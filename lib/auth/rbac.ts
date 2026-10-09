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

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const cookieStore = await cookies();
    const simulatedRoleValue = cookieStore.get('heeyaku_simulated_role')?.value;
    const cacheKey = `${userId}:${simulatedRoleValue || 'DEFAULT'}`;

    const cached = sessionCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      sessionCache.set(cacheKey, { user: null, expiresAt: Date.now() + 30 * 1000 });
      return null;
    }

    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      sessionCache.set(cacheKey, { user: null, expiresAt: Date.now() + 30 * 1000 });
      return null;
    }

    const normalizedEmail = primaryEmail.toLowerCase().trim();
    const rawAdminEmails = process.env.ADMIN_EMAIL || '';
    const allowedCeoEmails = Array.from(
      new Set(
        rawAdminEmails
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      primaryEmail;

    // 1. Is user configured as CEO via ADMIN_EMAIL?
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

      const authUser: AuthenticatedUser = {
        userId,
        email: primaryEmail,
        name,
        role: effectiveRole,
        isRealCeo: true,
        simulatedRole: effectiveRole !== Role.CEO ? effectiveRole : null,
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

    // 2. Look up in PostgreSQL Employee table
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ clerkUserId: userId }, { email: normalizedEmail }],
        isActive: true,
      },
      include: {
        teamGroup: true,
        ledTeam: true,
      },
    });

    if (!employee) {
      // Not an authorized employee or CEO
      sessionCache.set(userId, { user: null, expiresAt: Date.now() + 60 * 1000 });
      return null;
    }

    // Link clerkUserId if not linked yet
    if (!employee.clerkUserId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { clerkUserId: userId },
      });
    }

    const authUser: AuthenticatedUser = {
      userId,
      email: primaryEmail,
      name: employee.name || name,
      role: employee.role,
      employeeId: employee.id,
      teamId: employee.teamId,
      teamName: employee.teamGroup?.name || null,
      ledTeamId: employee.ledTeam?.id || null,
      ledTeamName: employee.ledTeam?.name || null,
    };

    sessionCache.set(userId, {
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
 * Asserts user access. Throws AuthorizationError if unauthenticated.
 */
export const assertAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthorizationError('Access denied. Please log in with an authorized account.', 403);
  }
  return user;
});

/**
 * Permission check functions
 */
export const canManageEmployees = (role: Role) => role === Role.CEO || role === Role.HR;
export const canDeleteEmployee = (role: Role) => role === Role.CEO || role === Role.HR;
export const canManageLeads = (role: Role) => role === Role.CEO || role === Role.TEAM_LEAD;
export const canAssignLeads = (role: Role) => role === Role.CEO || role === Role.TEAM_LEAD;
export const canExportLeads = (role: Role) => role === Role.CEO || role === Role.TEAM_LEAD;
export const canViewExecutive = (role: Role) => role === Role.CEO;
export const canViewTeamsBoard = (role: Role) => role === Role.CEO || role === Role.TEAM_LEAD;
export const canManageTeams = (role: Role) => role === Role.CEO || role === Role.HR;

/**
 * Invalidate session cache when roles or assignments change
 */
export function invalidateUserSessionCache(userId?: string) {
  if (userId) {
    sessionCache.delete(userId);
  } else {
    sessionCache.clear();
  }
}
