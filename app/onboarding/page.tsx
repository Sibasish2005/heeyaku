import { getAuthenticatedUser } from '@/lib/auth/rbac';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OnboardingFormClient from './OnboardingFormClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getAuthenticatedUser();

  // If Super Admin, route directly to the Super Admin governance portal
  if (user?.isSuperAdmin) {
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-indigo-600 selection:text-white">
      <OnboardingFormClient
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </div>
  );
}
