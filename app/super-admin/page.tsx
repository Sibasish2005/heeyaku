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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center">
            <HeeyakuLogo size={32} color="#FFFFFF" dotColor="#3B82F6" withText textColor="#FFFFFF" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/25">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Super Admin Access Required
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are signed in as:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-amber-300 font-semibold break-all">
              {emails}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              This account does not have Super Admin platform permissions. Please sign in with an authorized platform administrator email.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in?redirect_url=/super-admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-red-500/30 text-center">
          <h2 className="text-lg font-bold text-red-400">Governance Portal Error</h2>
          <p className="text-xs text-slate-400 mt-2">{data.error || 'Failed to load platform data.'}</p>
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
