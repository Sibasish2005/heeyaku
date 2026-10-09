import React from 'react';
import { assertAuthenticatedUser } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import TodayLeadStatusSection from '@/components/admin/dashboard/TodayLeadStatusSection';
import EmployeeReportSection from '@/components/admin/dashboard/EmployeeReportSection';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Overview & Daily Pipeline | HEEYAKU Admin',
  description: 'Daily real-time breakdown of all lead intake statuses and Business Development Associates performance reports.',
};

export default async function AdminDashboard() {
  const user = await assertAuthenticatedUser();

  // If user is HR, redirect to Staff Management
  if (user.role === Role.HR) {
    redirect('/admin/employees');
  }

  // If user is Team Lead, pass their squad's teamId
  const teamId = user.role === Role.TEAM_LEAD ? (user.ledTeamId || user.teamId || 'UNASSIGNED_SQUAD') : null;

  const {
    totalLeadsToday,
    statusBreakdown,
    employeeReports,
    topPerformerToday,
    topPerformerThisMonth,
    topPerformer,
  } = await getDashboardMetrics(teamId);

  return (
    <div className="p-6 sm:p-8 space-y-10 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Squad indicator for Team Leads */}
      {user.role === Role.TEAM_LEAD && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {user.ledTeamName || user.teamName || 'Squad'} Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Scoped performance and activity for your assigned Business Development Associates.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
            Team Lead View
          </span>
        </div>
      )}

      {/* Section 1: Today Total Lead Statuses */}
      <TodayLeadStatusSection
        totalLeadsToday={totalLeadsToday}
        statusBreakdown={statusBreakdown}
      />

      {/* Section 2: Employee Report & TanStack Table */}
      <EmployeeReportSection
        topPerformerToday={topPerformerToday}
        topPerformerThisMonth={topPerformerThisMonth}
        topPerformer={topPerformer}
        employees={employeeReports}
      />
    </div>
  );
}
