import React from 'react';
import { Database, ShieldCheck, Smartphone, Flame } from 'lucide-react';

interface DashboardSystemStatusProps {
  inDiscussionLeads: number;
}

export default function DashboardSystemStatus({ inDiscussionLeads }: DashboardSystemStatusProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground tracking-tight">System & Telemetry</h2>
        <p className="text-xs text-muted-foreground">Database, Auth & Mobile synchronizer</p>
      </div>

      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <Database className="w-4 h-4 text-primary" />
            <span className="font-semibold">Supabase PostgreSQL</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Connected
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Clerk RBAC Guard</span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <Smartphone className="w-4 h-4 text-foreground" />
            <span className="font-semibold">Android Call Tracker</span>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Sync Ready
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Active Discussion</span>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
            {inDiscussionLeads} leads
          </span>
        </div>

        <div className="pt-3">
          <div className="p-3.5 rounded-lg bg-muted/50 border border-border text-[11px] text-muted-foreground leading-relaxed">
            Mobile call telemetry automatically updates Business Development Associates performance metrics upon device sync.
          </div>
        </div>
      </div>
    </div>
  );
}
