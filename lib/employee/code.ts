import { prisma } from '@/lib/prisma';
import { generateSequentialCode } from '@/lib/common/code-generator';

/**
 * Generates the next sequential unique Employee Code.
 * Format: EMP-1001, EMP-1002, ...
 */
export async function generateNextEmployeeCode(client: any = prisma): Promise<string> {
  return generateSequentialCode(
    async () => {
      const latest = await client.employee.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { employeeCode: true },
      });
      return latest?.employeeCode;
    },
    () => client.employee.count(),
    'EMP',
    1001
  );
}
