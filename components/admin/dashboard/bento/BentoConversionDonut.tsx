'use client';

import React from 'react';

interface BentoConversionDonutProps {
  totalLeads: number;
  newIntake: number;
  assigned: number;
  inProgress: number;
  converted: number;
}

export default function BentoConversionDonut({
  totalLeads,
  newIntake,
  assigned,
  inProgress,
  converted,
}: BentoConversionDonutProps) {
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0';

  const newPct = totalLeads > 0 ? (newIntake / totalLeads) * 100 : 0;
  const assignedPct = totalLeads > 0 ? (assigned / totalLeads) * 100 : 0;
  const inProgressPct = totalLeads > 0 ? (inProgress / totalLeads) * 100 : 0;
  const convertedPct = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  return (
    <div className="flex flex-col justify-between h-full p-3.5 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Converted Today
          </span>
          <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {conversionRate}% rate
          </span>
        </div>

        {/* Hero Conversion Count */}
        <div className="py-2">
          <div className="text-4xl sm:text-5xl font-extrabold text-foreground font-mono tracking-tight">
            {converted}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            of {totalLeads} total leads enrolled today
          </div>
        </div>
      </div>

      {/* Proportional Segmented Pipeline Bar */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex gap-0.5">
          <div
            style={{ width: `${newPct}%` }}
            className="h-full bg-muted-foreground/40 rounded-xs transition-all duration-500"
            title={`New: ${newIntake}`}
          />
          <div
            style={{ width: `${assignedPct}%` }}
            className="h-full bg-[#2563EB]/40 rounded-xs transition-all duration-500"
            title={`Assigned: ${assigned}`}
          />
          <div
            style={{ width: `${inProgressPct}%` }}
            className="h-full bg-[#2563EB] rounded-xs transition-all duration-500"
            title={`In Talks: ${inProgress}`}
          />
          <div
            style={{ width: `${convertedPct}%` }}
            className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
            title={`Converted: ${converted}`}
          />
        </div>

        {/* Clean borderless stat columns */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div>
            <div className="text-sm font-bold text-foreground font-mono">{newIntake}</div>
            <div className="text-[11px] text-muted-foreground font-medium">New</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground font-mono">{assigned}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Assigned</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground font-mono">{inProgress}</div>
            <div className="text-[11px] text-muted-foreground font-medium">In Talks</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground font-mono">{converted}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Converted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
