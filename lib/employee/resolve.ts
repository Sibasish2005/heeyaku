import { prisma } from '@/lib/prisma';
import type { Employee } from '@prisma/client';
import { EmployeeTokenPayload } from '@/lib/auth/employee-token';

export interface ResolvedEmployee {
  primaryId: string;
  allIds: string[];
  employeeCode?: string;
  name?: string;
  email?: string;
  employee: Employee | null;
}

interface CachedResolvedEmployee {
  resolved: ResolvedEmployee;
  expiresAt: number;
}

const employeeIdentityCache = new Map<string, CachedResolvedEmployee>();
const RESOLVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Invalidates the employee identity resolution cache when an employee account is modified,
 * role updated, credentials reset, or deactivated.
 *
 * @param identifier - Optional ID, employeeCode, or email to purge specifically. If omitted, clears entire cache.
 */
export function clearEmployeeIdentityCache(identifier?: string): void {
  if (identifier) {
    employeeIdentityCache.delete(identifier);
    // Also clear keys that might match employeeCode or ID
    for (const [key, val] of employeeIdentityCache.entries()) {
      if (val.resolved.allIds.includes(identifier) || val.resolved.employeeCode === identifier || val.resolved.email === identifier) {
        employeeIdentityCache.delete(key);
      }
    }
  } else {
    employeeIdentityCache.clear();
  }
}

/**
 * Resiliently resolves an employee and all associated IDs (including matching
 * records across database reseeds or employeeCode/email aliases).
 * In-memory cached with 5-minute TTL to eliminate repetitive DB lookups on high-frequency mobile requests.
 *
 * @param payload - Decoded JWT claims from mobile app token
 * @param payload.employeeId - Primary database ID from JWT
 * @param payload.employeeCode - Employee code (e.g. EMP-0001)
 * @param payload.email - Staff email address
 * @param payload.name - Staff full name
 *
 * @returns {Promise<ResolvedEmployee | null>} The resolved employee identity object with all matching aliases, or null if inactive/nonexistent
 */
export async function resolveEmployeeIdentity(
  payload: EmployeeTokenPayload
): Promise<ResolvedEmployee | null> {
  const cacheKey = payload.employeeId || payload.employeeCode || payload.email || '';
  if (cacheKey) {
    const cached = employeeIdentityCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.resolved;
    }
  }

  let employee = await prisma.employee.findUnique({
    where: { id: payload.employeeId },
  });

  if (!employee && (payload.employeeCode || payload.email)) {
    employee = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
          ...(payload.email ? [{ email: payload.email }] : []),
        ],
      },
    });
  }

  // Fail closed: Employee must exist in the database and have active status
  if (!employee || !employee.isActive) {
    return null;
  }

  const matchingEmployees = await prisma.employee.findMany({
    where: {
      isActive: true,
      OR: [
        { id: employee.id },
        { id: payload.employeeId },
        ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
        ...(payload.email ? [{ email: payload.email }] : []),
        ...(employee.employeeCode ? [{ employeeCode: employee.employeeCode }] : []),
      ],
    },
    select: { id: true },
  });

  const allIds = Array.from(
    new Set([
      employee.id,
      payload.employeeId,
      ...matchingEmployees.map((e) => e.id),
    ])
  ).filter(Boolean);

  const result: ResolvedEmployee = {
    primaryId: employee?.id || payload.employeeId,
    allIds,
    employeeCode: employee?.employeeCode || payload.employeeCode,
    name: employee?.name || payload.name,
    email: employee?.email || payload.email,
    employee: employee || null,
  };

  if (cacheKey) {
    employeeIdentityCache.set(cacheKey, {
      resolved: result,
      expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS,
    });
  }

  return result;
}
