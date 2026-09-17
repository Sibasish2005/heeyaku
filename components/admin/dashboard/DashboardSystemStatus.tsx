import React from 'react';
import { Database, ShieldCheck, Smartphone, Flame } from 'lucide-react';

interface DashboardSystemStatusProps {
  inDiscussionLeads: number;
}

export default function DashboardSystemStatus({ inDiscussionLeads }: DashboardSystemStatusProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">System & Telemetry</h2>
        <p className="text-xs text-slate-400">Database, Auth & Mobile synchronizer</p>
      </div>

      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">Supabase PostgreSQL</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Connected
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Clerk RBAC Guard</span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Smartphone className="w-4 h-4 text-slate-700" />
            <span className="font-semibold">Android Call Tracker</span>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
            Sync Ready
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Flame className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">Active Discussion</span>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60 font-mono">
            {inDiscussionLeads} leads
          </span>
        </div>

        <div className="pt-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            Mobile call telemetry automatically updates Business Development Associates performance metrics upon device sync.
          </div>
        </div>
      </div>
    </div>
  );
}
