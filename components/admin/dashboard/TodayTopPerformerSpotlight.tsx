'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Award, TrendingUp } from 'lucide-react';

export interface TopEmployeeReport {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  team: string | null;
  totalAssignedToday: number;
  totalAssignedMonth?: number;
  totalAssignedAllTime: number;
  convertedToday: number;
  convertedMonth?: number;
  convertedAllTime: number;
  contactedToday: number;
  contactedMonth?: number;
  conversionRate: string;
  conversionRateMonth?: string;
}

interface TodayTopPerformerSpotlightProps {
  topPerformerToday?: TopEmployeeReport | null;
  topPerformerThisMonth?: TopEmployeeReport | null;
  topPerformer?: TopEmployeeReport | null;
}

function MinimalPerformerCard({
  periodLabel,
  performer,
  assignedCount,
  contactedCount,
  convertedCount,
  conversionRate,
  icon: Icon,
}: {
  periodLabel: string;
  performer: TopEmployeeReport | null;
  assignedCount: number;
  contactedCount: number;
  convertedCount: number;
  conversionRate: string;
  icon: React.ElementType;
}) {
  if (!performer) {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-card/40 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{periodLabel}</span>
          <p className="text-xs text-muted-foreground mt-0.5">No activity recorded for this period.</p>
        </div>
        <Link href="/admin/employees" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium">
          <span>Staff Directory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="group p-4 sm:p-5 rounded-xl border border-border/70 bg-card hover:border-border transition-all duration-150 flex flex-col justify-between gap-3.5">
      {/* Top row: Category tag & View Profile link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          <Icon className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
          <span>{periodLabel}</span>
          <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-semibold">#1</span>
        </div>

        <Link
          href={`/admin/employees/${performer.id}`}
          className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1 group-hover:text-[#2563EB] transition-colors"
        >
          <span>View Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Performer Name & Team */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 truncate">
          <Link
            href={`/admin/employees/${performer.id}`}
            className="font-bold text-sm sm:text-base text-foreground hover:text-[#2563EB] tracking-tight truncate transition-colors"
          >
            {performer.name}
          </Link>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0 font-medium">
            {performer.employeeCode}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {performer.team || 'Business Development Associates'}
        </p>
      </div>

      {/* Clean, minimal metric summary */}
      <div className="pt-2.5 border-t border-border/50 flex items-baseline justify-between text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-muted-foreground">Assigned:</span>
          <span className="font-mono font-bold text-foreground text-xs">{assignedCount}</span>
          <span className="text-[10px] text-muted-foreground font-medium">({contactedCount} contacted)</span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-muted-foreground">Converted:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">{convertedCount}</span>
          <span className="font-mono text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">({conversionRate}%)</span>
        </div>
      </div>
    </div>
  );
}

export default function TodayTopPerformerSpotlight({
  topPerformerToday,
  topPerformerThisMonth,
  topPerformer,
}: TodayTopPerformerSpotlightProps) {
  const effectiveToday = topPerformerToday || topPerformer || null;
  const effectiveMonth = topPerformerThisMonth || topPerformerToday || topPerformer || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <MinimalPerformerCard
        periodLabel="Top Performer Today"
        icon={Award}
        performer={effectiveToday}
        assignedCount={effectiveToday?.totalAssignedToday || 0}
        contactedCount={effectiveToday?.contactedToday || 0}
        convertedCount={effectiveToday?.convertedToday || 0}
        conversionRate={effectiveToday?.conversionRate || '0.0'}
      />

      <MinimalPerformerCard
        periodLabel="Top Performer This Month"
        icon={TrendingUp}
        performer={effectiveMonth}
        assignedCount={effectiveMonth?.totalAssignedMonth ?? effectiveMonth?.totalAssignedAllTime ?? 0}
        contactedCount={effectiveMonth?.contactedMonth ?? effectiveMonth?.contactedToday ?? 0}
        convertedCount={effectiveMonth?.convertedMonth ?? effectiveMonth?.convertedAllTime ?? 0}
        conversionRate={effectiveMonth?.conversionRateMonth ?? effectiveMonth?.conversionRate ?? '0.0'}
      />
    </div>
  );
}
