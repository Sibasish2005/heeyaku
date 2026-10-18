import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredNonces } from '@/lib/auth/nonce-cleanup';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Scheduled maintenance endpoint for bounded cleanup of expired replay nonces.
 * Protected by CRON_SECRET bearer token authentication via constant-time comparison.
 * Configurable via Vercel Cron or external scheduler.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecretHeader = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  // Enforce secret presence and match
  const providedToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : cronSecretHeader?.trim();

  if (!expectedSecret || !providedToken || !timingSafeEqual(providedToken, expectedSecret)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid CRON_SECRET is required.' },
      { status: 401 }
    );
  }

  const batchSize = Math.min(
    Math.max(1, parseInt(req.nextUrl.searchParams.get('batchSize') || '500', 10)),
    2000
  );
  const maxBatches = Math.min(
    Math.max(1, parseInt(req.nextUrl.searchParams.get('maxBatches') || '5', 10)),
    20
  );

  const result = await cleanupExpiredNonces({ batchSize, maxBatches });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, deletedCount: result.deletedCount },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      service: 'heeyaku-cron-nonce-cleanup',
      deletedCount: result.deletedCount,
      batchesProcessed: result.batchesProcessed,
      hasMore: result.hasMore,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
