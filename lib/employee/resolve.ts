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

/**
 * Resiliently resolves an employee and all associated IDs (including matching
 * records across database reseeds or employeeCode/email aliases).
 */
export async function resolveEmployeeIdentity(
  payload: EmployeeTokenPayload
): Promise<ResolvedEmployee | null> {
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

  return {
    primaryId: employee?.id || payload.employeeId,
    allIds,
    employeeCode: employee?.employeeCode || payload.employeeCode,
    name: employee?.name || payload.name,
    email: employee?.email || payload.email,
    employee: employee || null,
  };
}
