import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role, CompanyStatus } from '@prisma/client';
import { isSuperAdminEmail } from './super-admin';
export { isSuperAdminEmail };

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
 * Resolves the currently authenticated user from Clerk session and PostgreSQL DB.
 * Checks for Root CEO status in ADMIN_EMAIL environment variable, matches employee record,
 * and caches results in-memory with a 5-minute TTL.
 * Roles are strictly constant per email/account with no simulation overrides.
 *
 * @returns {Promise<AuthenticatedUser | null>} The authenticated profile or null if unauthenticated
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get('heeyaku_impersonate_company_id')?.value;
    const cacheKey = `${userId}:${impersonateCompanyId || 'NONE'}`;

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
      let isSuper = isSuperAdminEmail(normalizedEmail);
      if (!isSuper && process.env.SUPER_ADMIN_EMAILS) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const u = await client.users.getUser(userId);
          const clerkEmails = u?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
          if (clerkEmails.some((e) => isSuperAdminEmail(e))) {
            isSuper = true;
          }
        } catch {
          // Non-blocking fallback
        }
      }
      
      // Auto-heal Root CEO role if marked as BDA or other role in database
      if (isAllowedCeoEmail(normalizedEmail) && dbEmployee.role !== Role.CEO) {
        try {
          await prisma.employee.update({
            where: { id: dbEmployee.id },
            data: { role: Role.CEO },
          });
          dbEmployee.role = Role.CEO;
        } catch (healErr) {
          console.warn('Failed to auto-heal CEO employee role in DB:', healErr);
        }
      }

      const effectiveRole = isConfiguredCeo ? Role.CEO : dbEmployee.role;

      const effectiveTeamId: string | null = dbEmployee.teamId;
      const effectiveTeamName: string | null = dbEmployee.teamGroup?.name || null;
      const effectiveLedTeamId: string | null = dbEmployee.ledTeam?.id || null;
      const effectiveLedTeamName: string | null = dbEmployee.ledTeam?.name || null;

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
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const u = await client.users.getUser(userId);
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
        console.warn('clerkClient getUser fallback failed, trying direct REST fetch:', backendErr);
        try {
          const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
          });
          if (res.ok) {
            const u = await res.json();
            clerkUser = {
              id: u.id,
              firstName: u.first_name,
              lastName: u.last_name,
              username: u.username,
              primaryEmailAddressId: u.primary_email_address_id,
              emailAddresses: u.email_addresses?.map((e: any) => ({
                id: e.id,
                emailAddress: e.email_address,
              })) || [],
            } as unknown as typeof clerkUser;
          }
        } catch (directErr) {
          console.warn('Direct Clerk REST getUser fallback also failed:', directErr);
        }
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

    // Platform Super Admin fast-path: Super Admin does not require an employee or company record unless actively impersonating
    if (isSuper && !impersonateCompanyId) {
      const superAdminUser: AuthenticatedUser = {
        userId,
        email: primaryEmail,
        name,
        role: Role.CEO,
        isRealCeo: true,
        companyId: null,
        companyName: null,
        companySlug: null,
        companyStatus: null,
        isSuperAdmin: true,
        isImpersonating: false,
      };

      sessionCache.set(cacheKey, {
        user: superAdminUser,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      return superAdminUser;
    }

    // Check if user is configured as CEO via ADMIN_EMAIL or company domain wildcard
    if (isAllowedCeoEmail(normalizedEmail)) {
      const effectiveRole: Role = Role.CEO;
      const effectiveTeamId: string | null = null;
      const effectiveTeamName: string | null = null;

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
      // Return authenticated profile for unlinked / first-time users (e.g. going through onboarding or super-admin)
      const unlinkedUser: AuthenticatedUser = {
        userId,
        email: primaryEmail,
        name,
        role: Role.CEO,
        companyId: null,
        companyName: null,
        companySlug: null,
        companyStatus: null,
        isSuperAdmin: isSuper,
      };

      sessionCache.set(cacheKey, {
        user: unlinkedUser,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });

      return unlinkedUser;
    }

    // Keep clerkUserId synchronized
    if (employee.clerkUserId !== userId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { clerkUserId: userId },
      });
    }

    const isConfiguredCeo = isAllowedCeoEmail(normalizedEmail) || employee.role === Role.CEO;
    if (isAllowedCeoEmail(normalizedEmail) && employee.role !== Role.CEO) {
      try {
        await prisma.employee.update({
          where: { id: employee.id },
          data: { role: Role.CEO },
        });
        employee.role = Role.CEO;
      } catch (healErr) {
        console.warn('Failed to auto-heal CEO employee role in DB:', healErr);
      }
    }

    const effectiveRole = isConfiguredCeo ? Role.CEO : employee.role;

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
      isRealCeo: isConfiguredCeo,
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
  if (user?.isSuperAdmin) {
    return user;
  }

  // Direct Clerk identity fallback: guarantee Super Admin access by verified email
  const { userId } = await auth();
  if (userId) {
    try {
      const clerkUser = await currentUser();
      const clerkEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
      if (clerkEmails.some((e) => isSuperAdminEmail(e))) {
        const primaryEmail =
          clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
          clerkEmails[0] ||
          '';
        const name =
          [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
          clerkUser?.username ||
          primaryEmail;

        const authSuperUser: AuthenticatedUser = {
          userId,
          email: primaryEmail,
          name,
          role: Role.CEO,
          isRealCeo: true,
          isSuperAdmin: true,
          isImpersonating: false,
        };

        return authSuperUser;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  throw new AuthorizationError('Access denied. Super Admin privileges required.', 403);
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
    .map((e) => e.trim().replace(/^["']|["']$/g, '').toLowerCase())
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
