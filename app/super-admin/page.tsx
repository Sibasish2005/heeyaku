import { assertSuperAdmin } from '@/lib/auth/rbac';
import { getSuperAdminDashboardDataAction } from './actions';
import SuperAdminClientDashboard from '@/components/super-admin/SuperAdminClientDashboard';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  let superAdminUser;
  try {
    superAdminUser = await assertSuperAdmin();
  } catch (err) {
    // Conceal super admin existence from unauthorized users (404 Not Found)
    notFound();
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
