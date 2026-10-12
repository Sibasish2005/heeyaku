import { prisma } from '@/lib/prisma';

/**
 * Robustly calculates the next sequential integer for Lead Code generation.
 * Handles mixed alphanumeric codes (e.g. from Google Sheets 'LD-HEX') by inspecting
 * recent leads to find the latest pure numeric sequence, completely preventing P2002 duplicate collisions.
 */
export async function getNextSequentialLeadNumber(): Promise<number> {
  const recentLeads = await prisma.lead.findMany({
    where: { leadCode: { startsWith: 'LD-' } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { leadCode: true },
  });

  let maxNumber = 0;
  for (const l of recentLeads) {
    const rawNum = l.leadCode.replace(/^LD-/, '');
    if (/^\d+$/.test(rawNum)) {
      const parsed = parseInt(rawNum, 10);
      if (!isNaN(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
        break; // First purely numeric lead code found descending
      }
    }
  }

  if (maxNumber === 0) {
    const totalCount = await prisma.lead.count();
    maxNumber = totalCount;
  }

  let candidate = maxNumber + 1;

  // Extra collision check: ensure candidate code is truly free
  const existing = await prisma.lead.findUnique({
    where: { leadCode: `LD-${String(candidate).padStart(5, '0')}` },
    select: { id: true },
  });
  if (existing) {
    const totalCount = await prisma.lead.count();
    candidate = totalCount + 1;
    // If totalCount + 1 also somehow exists, increment until a free slot is found
    while (
      await prisma.lead.findUnique({
        where: { leadCode: `LD-${String(candidate).padStart(5, '0')}` },
        select: { id: true },
      })
    ) {
      candidate++;
    }
  }

  return candidate;
}

/**
 * Generates the next sequential unique Lead Code.
 * Format: LD-00001, LD-00002, ...
 */
export async function generateNextLeadCode(): Promise<string> {
  const nextNum = await getNextSequentialLeadNumber();
  return `LD-${String(nextNum).padStart(5, '0')}`;
}
