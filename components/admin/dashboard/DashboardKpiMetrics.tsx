import React from 'react';
import { Users, UserCheck, Layers, TrendingUp } from 'lucide-react';

interface DashboardKpiMetricsProps {
  totalLeads: number;
  newLeads: number;
  activeEmployees: number;
  totalEmployees: number;
  unassignedLeads: number;
  conversionRate: string;
  convertedLeads: number;
}

export default function DashboardKpiMetrics({
  totalLeads,
  newLeads,
  activeEmployees,
  totalEmployees,
  unassignedLeads,
  conversionRate,
  convertedLeads,
}: DashboardKpiMetricsProps) {
  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads.toLocaleString('en-IN'),
      meta: `${newLeads} new`,
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    },
    {
      label: 'Active Business Development Associates',
      value: activeEmployees.toLocaleString('en-IN'),
      meta: `${totalEmployees} total`,
      icon: UserCheck,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      label: 'Unassigned Pool',
      value: unassignedLeads.toLocaleString('en-IN'),
      meta: `${totalLeads - unassignedLeads} assigned`,
      icon: Layers,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      meta: `${convertedLeads} converted`,
      icon: TrendingUp,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-card text-card-foreground rounded-xl border border-border p-4 sm:p-5 flex items-start justify-between shadow-2xs hover:border-primary/40 transition-colors"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {stat.label}
              </span>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] font-medium text-muted-foreground/80">
                {stat.meta}
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${stat.iconBg} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
