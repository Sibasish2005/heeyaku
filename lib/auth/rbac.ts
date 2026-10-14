import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role, CompanyStatus } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  employeeId?: string;
  teamId?: string | null;
  teamName?: string | null;
  ledTeamId?: string | null;
  ledTeamName?: string | null;
  isRealCeo?: boolean;
  simulatedRole?: Role | null;
  companyId?: string | null;
  companyName?: string | null;
  companySlug?: string | null;
  companyStatus?: CompanyStatus | null;
  isSuperAdmin?: boolean;
  isImpersonating?: boolean;
  isTrialExpired?: boolean;
  trialDaysRemaining?: number | null;
}

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string = 'Access denied.', statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

interface CachedSession {
  user: AuthenticatedUser | null;
  expiresAt: number;
}

// In-memory cache across navigations to eliminate Clerk + DB roundtrips
const sessionCache = new Map<string, CachedSession>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates whether an email address belongs to an App-Level Super Admin
 * specified in environment variable SUPER_ADMIN_EMAILS.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const rawSuperEmails = process.env.SUPER_ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  const allowed = rawSuperEmails
    .split(',')
    .map((e) => e.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
  const normalized = email.toLowerCase().trim();
  return allowed.includes(normalized);
}

/**
 * Resolves the currently authenticated user from Clerk session and PostgreSQL DB.
 * Checks for Root CEO status in ADMIN_EMAIL environment variable, checks for
 * CEO developer role simulation cookie ('heeyaku_simulated_role'), matches employee record,
 * and caches results in-memory with a 5-minute TTL.
 *
 * @returns {Promise<AuthenticatedUser | null>} The authenticated profile or null if unauthenticated
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const cookieStore = await cookies();
    const simulatedRoleValue = cookieStore.get('heeyaku_simulated_role')?.value;
    const impersonateCompanyId = cookieStore.get('heeyaku_impersonate_company_id')?.value;
    const cacheKey = `${userId}:${simulatedRoleValue || 'DEFAULT'}:${impersonateCompanyId || 'NONE'}`;

    if (sessionCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of sessionCache.entries()) {
        if (now > v.expiresAt) sessionCache.delete(k);
      }
    }

    const cached = sessionCache.get(cacheKey);
    if (cached && cached.user && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    // Fast-path 1: Direct PostgreSQL lookup by clerkUserId (avoids 20s Clerk API network latency)
    const dbEmployee = await prisma.employee.findFirst({
      where: { clerkUserId: userId, isActive: true },
      include: { teamGroup: true, ledTeam: true, company: true },
    });

    if (dbEmployee) {
      const normalizedEmail = dbEmployee.email.toLowerCase().trim();
      const isConfiguredCeo = isAllowedCeoEmail(normalizedEmail) || dbEmployee.role === Role.CEO;
      const isSuper = isSuperAdminEmail(normalizedEmail);
      
      let effectiveRole = dbEmployee.role;

      let effectiveTeamId: string | null = dbEmployee.teamId;
      let effectiveTeamName: string | null = dbEmployee.teamGroup?.name || null;
      let effectiveLedTeamId: string | null = dbEmployee.ledTeam?.id || null;
      let effectiveLedTeamName: string | null = dbEmployee.ledTeam?.name || null;

      if (isConfiguredCeo && simulatedRoleValue && ['HR', 'TEAM_LEAD', 'BDA'].includes(simulatedRoleValue)) {
        effectiveRole = simulatedRoleValue as Role;
        if (effectiveRole === Role.TEAM_LEAD) {
          const firstTeam = await prisma.team.findFirst({
            where: dbEmployee.companyId ? { companyId: dbEmployee.companyId } : {},
            orderBy: { name: 'asc' },
          });
          effectiveTeamId = firstTeam?.id || null;
          effectiveTeamName = firstTeam?.name || null;
          effectiveLedTeamId = firstTeam?.id || null;
          effectiveLedTeamName = firstTeam?.name || null;
        }
      }

      // Resolve company details & trial expiration
      let effectiveCompany = dbEmployee.company;
      let isImpersonating = false;

      // Super Admin Ghost Mode: allow impersonating a company
      if (isSuper && impersonateCompanyId) {
        const targetCompany = await prisma.company.findUnique({
          where: { id: impersonateCompanyId },
        });
        if (targetCompany) {
          effectiveCompany = targetCompany;
          isImpersonating = true;
        }
      }

      let trialDaysRemaining: number | null = null;
      let isTrialExpired = false;
      if (effectiveCompany?.trialEndsAt) {
        const diffMs = new Date(effectiveCompany.trialEndsAt).getTime() - Date.now();
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        isTrialExpired = diffMs <= 0;
      }

      const authUser: AuthenticatedUser = {
        userId,
        email: dbEmployee.email,
        name: dbEmployee.name,
        role: effectiveRole,
        isRealCeo: isConfiguredCeo,
        simulatedRole: isConfiguredCeo && effectiveRole !== Role.CEO ? effectiveRole : null,
        employeeId: dbEmployee.id,
        teamId: effectiveTeamId,
        teamName: effectiveTeamName,
        ledTeamId: effectiveLedTeamId,
        ledTeamName: effectiveLedTeamName,
        companyId: effectiveCompany?.id || null,
        companyName: effectiveCompany?.name || null,
        companySlug: effectiveCompany?.slug || null,
        companyStatus: effectiveCompany?.status || null,
        isSuperAdmin: isSuper,
        isImpersonating,
        isTrialExpired,
        trialDaysRemaining,
      };

      sessionCache.set(cacheKey, {
        user: authUser,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      return authUser;
    }

    // Path 2: Fallback for first-time login before clerkUserId is linked
    let clerkUser = null;
    try {
      clerkUser = await currentUser();
    } catch (err) {
      console.warn('currentUser() fetch timed out or failed, falling back:', err);
    }

    if (!clerkUser && process.env.CLERK_SECRET_KEY) {
      try {
        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        });
        const u = await clerk.users.getUser(userId);
        if (u) {
          clerkUser = {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            username: u.username,
            primaryEmailAddressId: u.primaryEmailAddressId,
            emailAddresses: u.emailAddresses.map((e) => ({
              id: e.id,
              emailAddress: e.emailAddress,
            })),
          } as unknown as typeof clerkUser;
        }
      } catch (backendErr) {
        console.warn('Backend Clerk client getUser fallback also failed:', backendErr);
      }
    }

    if (!clerkUser) {
      return null;
    }

    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return null;
    }

    const normalizedEmail = primaryEmail.toLowerCase().trim();
    const allUserEmails = clerkUser.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [normalizedEmail];
    const isSuper = allUserEmails.some((e) => isSuperAdminEmail(e));
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      primaryEmail;

    // Check if user is configured as CEO via ADMIN_EMAIL or company domain wildcard
    if (isAllowedCeoEmail(normalizedEmail)) {
      let effectiveRole: Role = Role.CEO;
      let effectiveTeamId: string | null = null;
      let effectiveTeamName: string | null = null;

      if (simulatedRoleValue && ['HR', 'TEAM_LEAD', 'BDA'].includes(simulatedRoleValue)) {
        effectiveRole = simulatedRoleValue as Role;
        if (effectiveRole === Role.TEAM_LEAD) {
          const firstTeam = await prisma.team.findFirst({ orderBy: { name: 'asc' } });
          effectiveTeamId = firstTeam?.id || null;
          effectiveTeamName = firstTeam?.name || null;
        }
      }

      // Link clerkUserId in database if matching employee record exists
      const existingEmployee = await prisma.employee.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        include: { company: true },
      });
      if (existingEmployee && existingEmployee.clerkUserId !== userId) {
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { clerkUserId: userId },
        });
      }

      let effectiveCompany = existingEmployee?.company;
      let isImpersonating = false;

      if (isSuper && impersonateCompanyId) {
        const targetCompany = await prisma.company.findUnique({
          where: { id: impersonateCompanyId },
        });
        if (targetCompany) {
          effectiveCompany = targetCompany;
          isImpersonating = true;
        }
      }

      let trialDaysRemaining: number | null = null;
      let isTrialExpired = false;
      if (effectiveCompany?.trialEndsAt) {
        const diffMs = new Date(effectiveCompany.trialEndsAt).getTime() - Date.now();
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        isTrialExpired = diffMs <= 0;
      }

      const authUser: AuthenticatedUser = {
        userId,
        email: primaryEmail,
        name,
        role: effectiveRole,
        isRealCeo: true,
        simulatedRole: effectiveRole !== Role.CEO ? effectiveRole : null,
        employeeId: existingEmployee?.id,
        teamId: effectiveTeamId,
        teamName: effectiveTeamName,
        ledTeamId: effectiveTeamId,
        ledTeamName: effectiveTeamName,
        companyId: effectiveCompany?.id || null,
        companyName: effectiveCompany?.name || null,
        companySlug: effectiveCompany?.slug || null,
        companyStatus: effectiveCompany?.status || null,
        isSuperAdmin: isSuper,
        isImpersonating,
        isTrialExpired,
        trialDaysRemaining,
      };

      sessionCache.set(cacheKey, {
        user: authUser,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      return authUser;
    }

    // Lookup non-CEO in PostgreSQL Employee table
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { clerkUserId: userId },
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        teamGroup: true,
        ledTeam: true,
        company: true,
      },
    });

    if (!employee) {
      // If this user is an authorized Super Admin without an employee profile, allow access to Super Admin portal
      if (isSuper) {
        const superUser: AuthenticatedUser = {
          userId,
          email: primaryEmail,
          name,
          role: Role.CEO,
          isSuperAdmin: true,
        };
        return superUser;
      }
      return null;
    }

    // Keep clerkUserId synchronized
    if (employee.clerkUserId !== userId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { clerkUserId: userId },
      });
    }

    const effectiveRole = employee.role;

    let trialDaysRemaining: number | null = null;
    let isTrialExpired = false;
    if (employee.company?.trialEndsAt) {
      const diffMs = new Date(employee.company.trialEndsAt).getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      isTrialExpired = diffMs <= 0;
    }

    const authUser: AuthenticatedUser = {
      userId,
      email: primaryEmail,
      name: employee.name || name,
      role: effectiveRole,
      employeeId: employee.id,
      teamId: employee.teamId,
      teamName: employee.teamGroup?.name || null,
      ledTeamId: employee.ledTeam?.id || null,
      ledTeamName: employee.ledTeam?.name || null,
      companyId: employee.company?.id || null,
      companyName: employee.company?.name || null,
      companySlug: employee.company?.slug || null,
      companyStatus: employee.company?.status || null,
      isSuperAdmin: isSuper,
      isTrialExpired,
      trialDaysRemaining,
    };

    sessionCache.set(cacheKey, {
      user: authUser,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return authUser;
  } catch (error) {
    console.error('Error verifying RBAC authorization:', error);
    return null;
  }
});

/**
 * Asserts user access to protected routes and actions.
 * Throws an `AuthorizationError` if unauthenticated or missing valid session.
 * Enforces company suspension kill-switch fail-closed.
 *
 * @returns {Promise<AuthenticatedUser>} The verified authenticated user
 * @throws {AuthorizationError} When the caller is not logged in or workspace is suspended (HTTP 403)
 */
export const assertAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthorizationError('Access denied. Please log in with an authorized account.', 403);
  }

  // 1-Click Master Kill-Switch: Block non-super-admin access if company is suspended
  if (user.companyStatus === CompanyStatus.SUSPENDED_BY_ADMIN && !user.isSuperAdmin) {
    throw new AuthorizationError('This workspace has been suspended by the platform administrator.', 403);
  }

  return user;
});

/**
 * Asserts user access to platform Super Admin routes and actions.
 * Throws an `AuthorizationError` if not in SUPER_ADMIN_EMAILS.
 */
export const assertSuperAdmin = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getAuthenticatedUser();
  if (!user || !user.isSuperAdmin) {
    throw new AuthorizationError('Access denied. Super Admin privileges required.', 403);
  }
  return user;
});

/**
 * Checks whether the role has permission to onboard, edit, or configure employee staff.
 */
export const canManageEmployees = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Checks whether the role has permission to permanently delete staff accounts.
 */
export const canDeleteEmployee = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Checks whether the role has permission to create, edit, or delete leads.
 */
export const canManageLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to assign or unassign leads to staff.
 */
export const canAssignLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to export lead data to CSV/XLSX.
 */
export const canExportLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to view executive-level reports and financial telemetry.
 */
export const canViewExecutive = (role: Role): boolean => role === Role.CEO;

/**
 * Checks whether the role has permission to view squad performance and leaderboard boards.
 */
export const canViewTeamsBoard = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to create, dissolve, or reconfigure squads.
 */
export const canManageTeams = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Validates whether an email address belongs to an immutable Root CEO specified in .env ADMIN_EMAIL.
 */
export function isAllowedCeoEmail(email?: string | null): boolean {
  if (!email) return false;
  const rawAdminEmails = process.env.ADMIN_EMAIL || '';
  const allowed = rawAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const normalized = email.toLowerCase().trim();
  return allowed.includes(normalized);
}

/**
 * Invalidates the in-memory user session cache when roles, permissions, or assignments mutate.
 */
export function invalidateUserSessionCache(userId?: string): void {
  if (userId) {
    for (const key of sessionCache.keys()) {
      if (key === userId || key.startsWith(`${userId}:`)) {
        sessionCache.delete(key);
      }
    }
  } else {
    sessionCache.clear();
  }
}
