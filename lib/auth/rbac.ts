import { cache } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

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
    const cacheKey = `${userId}:${simulatedRoleValue || 'DEFAULT'}`;

    const cached = sessionCache.get(cacheKey);
    if (cached && cached.user && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    const rawAdminEmails = process.env.ADMIN_EMAIL || '';
    const allowedCeoEmails = Array.from(
      new Set(
        rawAdminEmails
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    // Fast-path 1: Direct PostgreSQL lookup by clerkUserId (avoids 20s Clerk API network latency)
    const dbEmployee = await prisma.employee.findFirst({
      where: { clerkUserId: userId, isActive: true },
      include: { teamGroup: true, ledTeam: true },
    });

    if (dbEmployee) {
      const normalizedEmail = dbEmployee.email.toLowerCase().trim();
      const isConfiguredCeo = allowedCeoEmails.includes(normalizedEmail);
      
      let effectiveRole = dbEmployee.role;
      if (effectiveRole === Role.CEO && !isConfiguredCeo) {
        effectiveRole = Role.HR;
      }

      let effectiveTeamId: string | null = dbEmployee.teamId;
      let effectiveTeamName: string | null = dbEmployee.teamGroup?.name || null;
      let effectiveLedTeamId: string | null = dbEmployee.ledTeam?.id || null;
      let effectiveLedTeamName: string | null = dbEmployee.ledTeam?.name || null;

      if (isConfiguredCeo && simulatedRoleValue && ['HR', 'TEAM_LEAD', 'BDA'].includes(simulatedRoleValue)) {
        effectiveRole = simulatedRoleValue as Role;
        if (effectiveRole === Role.TEAM_LEAD) {
          const firstTeam = await prisma.team.findFirst({ orderBy: { name: 'asc' } });
          effectiveTeamId = firstTeam?.id || null;
          effectiveTeamName = firstTeam?.name || null;
          effectiveLedTeamId = firstTeam?.id || null;
          effectiveLedTeamName = firstTeam?.name || null;
        }
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
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      primaryEmail;

    // Check if user is configured as CEO via ADMIN_EMAIL
    if (allowedCeoEmails.includes(normalizedEmail)) {
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
      });
      if (existingEmployee && existingEmployee.clerkUserId !== userId) {
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { clerkUserId: userId },
        });
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
      },
    });

    if (!employee) {
      return null;
    }

    // Keep clerkUserId synchronized
    if (employee.clerkUserId !== userId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { clerkUserId: userId },
      });
    }

    const effectiveRole =
      employee.role === Role.CEO && !allowedCeoEmails.includes(normalizedEmail)
        ? Role.HR
        : employee.role;

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
 *
 * @returns {Promise<AuthenticatedUser>} The verified authenticated user
 * @throws {AuthorizationError} When the caller is not logged in or lacks permissions (HTTP 403)
 */
export const assertAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthorizationError('Access denied. Please log in with an authorized account.', 403);
  }
  return user;
});

/**
 * Checks whether the role has permission to onboard, edit, or configure employee staff.
 * @param role - Actor role ('CEO' | 'HR' | 'TEAM_LEAD' | 'BDA')
 * @returns {boolean} True if CEO or HR
 */
export const canManageEmployees = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Checks whether the role has permission to permanently delete staff accounts.
 * @param role - Actor role
 * @returns {boolean} True if CEO or HR
 */
export const canDeleteEmployee = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Checks whether the role has permission to create, edit, or delete leads.
 * @param role - Actor role
 * @returns {boolean} True if CEO or TEAM_LEAD
 */
export const canManageLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to assign or unassign leads to staff.
 * @param role - Actor role
 * @returns {boolean} True if CEO or TEAM_LEAD
 */
export const canAssignLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to export lead data to CSV/XLSX.
 * @param role - Actor role
 * @returns {boolean} True if CEO or TEAM_LEAD
 */
export const canExportLeads = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to view executive-level reports and financial telemetry.
 * @param role - Actor role
 * @returns {boolean} True only for CEO
 */
export const canViewExecutive = (role: Role): boolean => role === Role.CEO;

/**
 * Checks whether the role has permission to view squad performance and leaderboard boards.
 * @param role - Actor role
 * @returns {boolean} True if CEO or TEAM_LEAD
 */
export const canViewTeamsBoard = (role: Role): boolean => role === Role.CEO || role === Role.TEAM_LEAD;

/**
 * Checks whether the role has permission to create, dissolve, or reconfigure squads.
 * @param role - Actor role
 * @returns {boolean} True if CEO or HR
 */
export const canManageTeams = (role: Role): boolean => role === Role.CEO || role === Role.HR;

/**
 * Validates whether an email address belongs to an immutable Root CEO specified in .env ADMIN_EMAIL.
 *
 * @param email - Candidate email string to test
 * @returns {boolean} True if the email is present in the ADMIN_EMAIL list
 */
export function isAllowedCeoEmail(email?: string | null): boolean {
  if (!email) return false;
  const rawAdminEmails = process.env.ADMIN_EMAIL || '';
  const allowed = rawAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase().trim());
}

/**
 * Invalidates the in-memory user session cache when roles, permissions, or assignments mutate.
 *
 * @param userId - Optional specific Clerk user ID to clear. If omitted, clears all cached sessions.
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
