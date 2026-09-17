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
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Active Business Development Associates',
      value: activeEmployees.toLocaleString('en-IN'),
      meta: `${totalEmployees} total`,
      icon: UserCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Unassigned Pool',
      value: unassignedLeads.toLocaleString('en-IN'),
      meta: `${totalLeads - unassignedLeads} assigned`,
      icon: Layers,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      meta: `${convertedLeads} converted`,
      icon: TrendingUp,
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 flex items-start justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {stat.label}
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] font-medium text-slate-400">
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
