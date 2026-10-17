import { getAuthenticatedUser, isSuperAdminEmail } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import VerificationPendingClient from './VerificationPendingClient';

export const dynamic = 'force-dynamic';

export default async function VerificationPendingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Pre-flight safeguard: Intercept Super Admin before any tenant/onboarding redirect
  try {
    const clerkUser = await currentUser();
    const clerkEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
    if (clerkEmails.some((e) => isSuperAdminEmail(e))) {
      redirect('/super-admin');
    }
  } catch (err: any) {
    if (err?.digest?.includes('NEXT_REDIRECT')) throw err;
  }

  const user = await getAuthenticatedUser();

  // If Super Admin, route directly to the Super Admin governance portal
  if (user?.isSuperAdmin || isSuperAdminEmail(user?.email)) {
    redirect('/super-admin');
  }

  // If user is already active, direct them immediately to the dashboard
  if (user?.companyStatus === 'ACTIVE') {
    redirect('/admin/dashboard');
  }

  // If user has no company at all, send them to onboarding
  if (!user?.companyId) {
    // Check if there's an employee or company directly
    const employee = await prisma.employee.findFirst({
      where: { clerkUserId: userId },
      include: { company: true },
    });

    if (!employee || !employee.company) {
      redirect('/onboarding');
    }

    if (employee.company.status === 'ACTIVE') {
      redirect('/admin/dashboard');
    }

    return (
      <VerificationPendingClient
        company={{
          id: employee.company.id,
          name: employee.company.name,
          slug: employee.company.slug,
          requestedBdas: employee.company.requestedBdas,
          status: employee.company.status,
          rejectionReason: employee.company.rejectionReason,
          createdAt: employee.company.createdAt.toISOString(),
        }}
        userEmail={user?.email || employee.email}
        userName={user?.name || employee.name}
      />
    );
  }

  if (user.companyStatus === 'SUSPENDED_BY_ADMIN' && !user.isSuperAdmin) {
    redirect('/workspace-suspended');
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  return (
    <VerificationPendingClient
      company={{
        id: company?.id || user.companyId,
        name: company?.name || user.companyName || 'Your Organization',
        slug: company?.slug || user.companySlug || 'workspace',
        requestedBdas: company?.requestedBdas || 5,
        status: company?.status || 'PENDING_VERIFICATION',
        rejectionReason: company?.rejectionReason || null,
        createdAt: (company?.createdAt || new Date()).toISOString(),
      }}
      userEmail={user.email}
      userName={user.name}
    />
  );
}
