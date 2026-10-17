import { assertSuperAdmin } from '@/lib/auth/rbac';
import { getSuperAdminDashboardDataAction } from './actions';
import SuperAdminClientDashboard from '@/components/super-admin/SuperAdminClientDashboard';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/super-admin');
  }

  let superAdminUser;
  try {
    superAdminUser = await assertSuperAdmin();
  } catch {
    const clerkUser = await currentUser();
    const emails =
      clerkUser?.emailAddresses?.map((e) => e.emailAddress).join(', ') || 'No email detected';

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-[#2563EB] selection:text-white">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border text-center space-y-6 shadow-2xs">
          <div className="flex justify-center">
            <HeeyakuLogo size={36} color="currentColor" dotColor="#2563EB" withText textColor="currentColor" />
          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Access Restricted
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Super Admin Access Required
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are currently signed in as:
            </p>
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border font-mono text-xs text-foreground font-semibold break-all">
              {emails}
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              This account does not have platform-level governance permissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in?redirect_url=/super-admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-500 text-white transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = await getSuperAdminDashboardDataAction();

  if (!data.success || !data.stats) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-destructive/30 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-destructive">Governance Portal Error</h2>
          <p className="text-xs text-muted-foreground">{data.error || 'Failed to load platform data.'}</p>
          <div className="pt-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminClientDashboard
      initialStats={data.stats}
      initialPending={data.pendingCompanies || []}
      initialActive={data.activeCompanies || []}
      impersonatingCompanyId={data.impersonatingCompanyId || null}
      superAdminEmail={superAdminUser.email}
    />
  );
}
