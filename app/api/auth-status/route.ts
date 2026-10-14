import { auth, currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedUser, isSuperAdminEmail } from '@/lib/auth/rbac';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  const user = await getAuthenticatedUser();
  const clerkUser = await currentUser().catch(() => null);

  const primaryEmail =
    clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    user?.email ||
    null;

  return NextResponse.json({
    status: 'ok',
    deployedCommit: '306946c',
    userId: userId || null,
    resolvedUser: user,
    primaryEmail,
    isSuperAdminByEmail: isSuperAdminEmail(primaryEmail),
    configuredSuperEmails: process.env.SUPER_ADMIN_EMAILS || null,
    configuredAdminEmails: process.env.ADMIN_EMAIL || null,
    timestamp: new Date().toISOString(),
  });
}
