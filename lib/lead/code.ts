import { prisma } from '@/lib/prisma';
import { generateSequentialCode } from '@/lib/common/code-generator';

/**
 * Generates the next sequential unique Lead Code.
 * Format: LD-00001, LD-00002, ...
 */
export async function generateNextLeadCode(): Promise<string> {
  return generateSequentialCode(
    async () => {
      const latest = await prisma.lead.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { leadCode: true },
      });
      return latest?.leadCode;
    },
    () => prisma.lead.count(),
    'LD',
    1,
    5
  );
}

