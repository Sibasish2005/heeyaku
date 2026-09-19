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
 * Resiliently resolves an employee and all associated IDs (including matching
 * records across database reseeds or employeeCode/email aliases).
 * In-memory cached with 5-minute TTL to eliminate repetitive DB lookups on high-frequency mobile requests.
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

  if (!employee && !payload.employeeId) {
    return null;
  }

  const matchingEmployees = await prisma.employee.findMany({
    where: {
      OR: [
        { id: payload.employeeId },
        ...(employee ? [{ id: employee.id }] : []),
        ...(payload.employeeCode ? [{ employeeCode: payload.employeeCode }] : []),
        ...(payload.email ? [{ email: payload.email }] : []),
        ...(employee?.employeeCode ? [{ employeeCode: employee.employeeCode }] : []),
      ],
    },
    select: { id: true },
  });

  const allIds = Array.from(
    new Set([
      payload.employeeId,
      ...(employee ? [employee.id] : []),
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
