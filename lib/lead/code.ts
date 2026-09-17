import { prisma } from '@/lib/prisma';

/**
 * Generates the next sequential unique Lead Code.
 * Format: LED-1001, LED-1002, ...
 */
export async function generateNextLeadCode(): Promise<string> {
  const latestLead = await prisma.lead.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      leadCode: true,
    },
  });

  if (!latestLead || !latestLead.leadCode.startsWith('LED-')) {
    return 'LED-1001';
  }

  const numericPart = parseInt(latestLead.leadCode.replace('LED-', ''), 10);
  if (isNaN(numericPart)) {
    const count = await prisma.lead.count();
    return `LED-${1000 + count + 1}`;
  }

  return `LED-${numericPart + 1}`;
}
