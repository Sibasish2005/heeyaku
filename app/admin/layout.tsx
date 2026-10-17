import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { isSuperAdminEmail } from '@/lib/auth/rbac';
import AdminShell from '@/components/admin/AdminShell';
import { Smartphone } from 'lucide-react';
import { Role } from '@prisma/client';

export const metadata = {
  title: 'HEEYAKU Admin OS — Control Center',
  description: 'Operations, lead management, and employee administration.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Pre-flight safeguard: Intercept Super Admin before any tenant/onboarding redirect
  try {
    const clerkUser = await currentUser();
    const clerkEmails = clerkUser?.emailAddresses?.map((e) => e.emailAddress.toLowerCase().trim()) || [];
    if (clerkEmails.some((e) => isSuperAdminEmail(e))) {
      const cookieStore = await cookies();
      const isImpersonating = !!cookieStore.get('heeyaku_impersonate_company_id')?.value;
      if (!isImpersonating) {
        redirect('/super-admin');
      }
    }
  } catch (err: any) {
    if (err?.digest?.includes('NEXT_REDIRECT')) throw err;
  }

  const admin = await getAuthenticatedAdmin();

  // Platform Super Admins always default to the /super-admin governance portal.
  // They only access tenant /admin routes when actively impersonating a workspace in Ghost Mode.
  if (admin?.isSuperAdmin && !admin.isImpersonating) {
    redirect('/super-admin');
  }

  // If user has no workspace or employee record yet, send them to onboarding (non-super-admins only)
  if (!admin) {
    redirect('/onboarding');
  }

  // 1-Click Master Kill-Switch: Block non-super-admin access if company is suspended
  if (admin.companyStatus === 'SUSPENDED_BY_ADMIN' && !admin.isSuperAdmin) {
    redirect('/workspace-suspended');
  }

  // Pending Verification: Send to waiting room
  if (admin.companyStatus === 'PENDING_VERIFICATION' && !admin.isSuperAdmin) {
    redirect('/verification-pending');
  }

  // Unlinked user: Send to onboarding
  if (!admin.companyId && !admin.isSuperAdmin) {
    redirect('/onboarding');
  }

  // If user is a BDA (Android Field Sales Associate), guide them to mobile app
  if (admin.role === Role.BDA) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-[#0B1F33]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-blue-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Sales Associate Portal
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Welcome, {admin.name}! Sales Associates conduct lead outreach and telephony calling via the dedicated Android Call Tracker mobile app.
          </p>
          <div className="pt-4">
            <a
              href="/download"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Download Android Call Tracker
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      adminEmail={admin.email}
      adminName={admin.name}
      role={admin.role}
      teamName={admin.ledTeamName || admin.teamName || null}
      isRealCeo={admin.isRealCeo}
      simulatedRole={admin.simulatedRole}
      isSuperAdmin={admin.isSuperAdmin}
      isImpersonating={admin.isImpersonating}
      companyName={admin.companyName}
      trialDaysRemaining={admin.trialDaysRemaining}
      isTrialExpired={admin.isTrialExpired}
    >
      {children}
    </AdminShell>
  );
}
