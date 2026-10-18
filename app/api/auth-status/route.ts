import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedUser } from '@/lib/auth/rbac';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health check & non-sensitive auth status endpoint.
 * Anonymous callers receive only operational status.
 * Authenticated callers receive only their authenticated status and role.
 * Never discloses administrator email lists, environment configurations, or build hashes.
 */
export async function GET() {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }));

    if (!userId) {
      return NextResponse.json(
        {
          status: 'operational',
          authenticated: false,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const user = await getAuthenticatedUser().catch(() => null);

    return NextResponse.json(
      {
        status: 'operational',
        authenticated: true,
        userId,
        role: user?.role || null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        authenticated: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
