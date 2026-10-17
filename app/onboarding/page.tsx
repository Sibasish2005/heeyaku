import { getAuthenticatedUser, isSuperAdminEmail } from '@/lib/auth/rbac';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OnboardingFormClient from './OnboardingFormClient';
import ThemeToggler from '@/components/ThemeToggler';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // 0. ABSOLUTE PRE-FLIGHT CHECK: Super Admin must NEVER see onboarding under any circumstances
  try {
    const clerkUser = await currentUser();
    const clerkEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
    if (clerkEmails.some((email) => isSuperAdminEmail(email))) {
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

  // If already linked to an active company, send to dashboard
  if (user?.companyStatus === 'ACTIVE') {
    redirect('/admin/dashboard');
  }

  // If already submitted and pending review, send to waiting room
  if (user?.companyStatus === 'PENDING_VERIFICATION') {
    redirect('/verification-pending');
  }

  // If company is suspended, send to workspace suspended screen
  if (user?.companyStatus === 'SUSPENDED_BY_ADMIN' && !user?.isSuperAdmin) {
    redirect('/workspace-suspended');
  }

  // Pre-fill email and name from Clerk if not yet provisioned in DB
  let defaultEmail = user?.email || '';
  let defaultName = user?.name || '';

  if (!defaultEmail) {
    try {
      const clerkUser = await currentUser();
      defaultEmail =
        clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser?.emailAddresses[0]?.emailAddress ||
        '';
      defaultName =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
        clerkUser?.username ||
        '';
    } catch {
      // Non-critical fallback
    }
  }

  // Fail-safe: If resolved Clerk email belongs to Super Admin, route directly to governance portal
  if (isSuperAdminEmail(defaultEmail)) {
    redirect('/super-admin');
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#2563EB] selection:text-white relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggler />
      </div>
      <OnboardingFormClient
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </div>
  );
}
