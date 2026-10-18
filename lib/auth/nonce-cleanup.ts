export interface NonceCleanupOptions {
  batchSize?: number;
  maxBatches?: number;
  cutoffDate?: Date;
  client?: any;
  dryRun?: boolean;
}

export interface NonceCleanupResult {
  success: boolean;
  deletedCount: number;
  batchesProcessed: number;
  hasMore: boolean;
  error?: string;
}

/**
 * Bounded, batch-based cleanup for expired consumed_nonces records.
 *
 * Design constraints enforced:
 * 1. Bounded batch deletes (default: 500 per batch) to avoid long table-level locks.
 * 2. Maximum iteration limit (default: 5 batches) to avoid serverless function execution timeouts.
 * 3. Targets ONLY nonces with `expiresAt < cutoffDate` (guaranteed expired, replay impossible).
 * 4. Safe against concurrent token consumption: uses indexed ID-based batch deletions.
 */
export async function cleanupExpiredNonces(
  options: NonceCleanupOptions = {}
): Promise<NonceCleanupResult> {
  const batchSize = Math.min(Math.max(1, options.batchSize || 500), 2000);
  const maxBatches = Math.min(Math.max(1, options.maxBatches || 5), 20);
  const cutoffDate = options.cutoffDate || new Date();
  const dryRun = !!options.dryRun;

  let dbClient = options.client;
  if (!dbClient) {
    const { prisma } = await import('@/lib/prisma');
    dbClient = prisma;
  }

  let totalDeleted = 0;
  let batches = 0;
  let hasMore = false;

  try {
    for (let i = 0; i < maxBatches; i++) {
      // Find a bounded slice of expired nonce IDs using the expiresAt index
      const expired = await dbClient.consumedNonce.findMany({
        where: {
          expiresAt: { lt: cutoffDate },
        },
        select: { id: true },
        take: batchSize,
      });

      if (!expired || expired.length === 0) {
        hasMore = false;
        break;
      }

      if (dryRun) {
        totalDeleted += expired.length;
        batches += 1;
        if (expired.length === batchSize) {
          hasMore = true;
        }
        break;
      }

      const idsToDelete = expired.map((e: { id: string }) => e.id);
      const res = await dbClient.consumedNonce.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });

      const deletedCount = res?.count ?? idsToDelete.length;
      totalDeleted += deletedCount;
      batches += 1;

      // If we found fewer records than batchSize, we've exhausted all currently expired nonces
      if (expired.length < batchSize) {
        hasMore = false;
        break;
      }

      // If we hit the max batches limit and still had a full batch, more remain
      if (i === maxBatches - 1) {
        hasMore = true;
      }
    }

    return {
      success: true,
      deletedCount: totalDeleted,
      batchesProcessed: batches,
      hasMore,
    };
  } catch (err: any) {
    return {
      success: false,
      deletedCount: totalDeleted,
      batchesProcessed: batches,
      hasMore,
      error: err?.message || String(err),
    };
  }
}
