import { prisma } from '@/lib/prisma';

/**
 * Generates the next sequential unique Employee Code.
 * Format: EMP-1001, EMP-1002, ...
 */
export async function generateNextEmployeeCode(): Promise<string> {
  const latestEmployee = await prisma.employee.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      employeeCode: true,
    },
  });

  if (!latestEmployee || !latestEmployee.employeeCode.startsWith('EMP-')) {
    return 'EMP-1001';
  }

  const numericPart = parseInt(latestEmployee.employeeCode.replace('EMP-', ''), 10);
  if (isNaN(numericPart)) {
    const count = await prisma.employee.count();
    return `EMP-${1000 + count + 1}`;
  }

  return `EMP-${numericPart + 1}`;
}
