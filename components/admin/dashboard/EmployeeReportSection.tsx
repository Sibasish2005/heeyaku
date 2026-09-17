import React from 'react';
import TodayTopPerformerSpotlight, { TopEmployeeReport } from './TodayTopPerformerSpotlight';
import EmployeeReportTanstackTable from './EmployeeReportTanstackTable';

interface EmployeeReportSectionProps {
  topPerformerToday?: TopEmployeeReport | null;
  topPerformerThisMonth?: TopEmployeeReport | null;
  topPerformer?: TopEmployeeReport | null;
  employees: TopEmployeeReport[];
}

export default function EmployeeReportSection({
  topPerformerToday,
  topPerformerThisMonth,
  topPerformer,
  employees,
}: EmployeeReportSectionProps) {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-border">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#2563EB]">
            Section 02 · Business Development Associates Performance Report
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            Staff Output &amp; Today&apos;s Top Performer
          </h2>
        </div>
      </div>

      {/* Top Performer Spotlight banner */}
      <TodayTopPerformerSpotlight
        topPerformerToday={topPerformerToday}
        topPerformerThisMonth={topPerformerThisMonth}
        topPerformer={topPerformer}
      />

      {/* TanStack interactive table for all employees */}
      <EmployeeReportTanstackTable data={employees} />
    </section>
  );
}
