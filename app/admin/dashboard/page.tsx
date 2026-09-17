import React from 'react';
import { assertAdminAccess } from '@/lib/auth/admin';
import TodayLeadStatusSection from '@/components/admin/dashboard/TodayLeadStatusSection';
import EmployeeReportSection from '@/components/admin/dashboard/EmployeeReportSection';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Overview & Daily Pipeline | HEEYAKU Admin',
  description: 'Daily real-time breakdown of all lead intake statuses and Business Development Associates performance reports.',
};

export default async function AdminDashboard() {
  await assertAdminAccess();

  const {
    totalLeadsToday,
    statusBreakdown,
    employeeReports,
    topPerformerToday,
    topPerformerThisMonth,
    topPerformer,
  } = await getDashboardMetrics();

  return (
    <div className="p-6 sm:p-8 space-y-10 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
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
