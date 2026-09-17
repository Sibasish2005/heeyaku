'use client';

import React from 'react';
import { PipelineStatusConfig } from './types';

interface EmployeePipelineFiltersProps {
  statusFilter: string;
  totalAssigned: number;
  leadStatusCounts: Record<string, number>;
  pipelineStatuses: PipelineStatusConfig[];
  onSelectStatus: (status: string) => void;
}

export default function EmployeePipelineFilters({
  statusFilter,
  totalAssigned,
  leadStatusCounts,
  pipelineStatuses,
  onSelectStatus,
}: EmployeePipelineFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Crisp Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-foreground">Pipeline breakdown</h2>
      </div>

      {/* Filter Pill Badges */}
      <div className="flex flex-wrap gap-2">
        {/* All Leads Pill */}
        <button
          type="button"
          onClick={() => onSelectStatus('ALL')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
            statusFilter === 'ALL'
              ? 'border border-[#2563EB] dark:border-blue-500 bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400'
              : 'border border-border/80 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>All leads</span>
          <span className="font-mono">{totalAssigned}</span>
        </button>

        {/* Dynamic Status Pills */}
        {pipelineStatuses.map((s) => {
          const count = leadStatusCounts[s.key] || 0;
          const isSelected = statusFilter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectStatus(isSelected ? 'ALL' : s.key)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'border border-[#2563EB] dark:border-blue-500 bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 font-medium'
                  : 'border border-border/80 bg-card hover:bg-muted/60 text-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dotClass}`} />
              <span className={isSelected ? 'text-[#2563EB] dark:text-blue-400 font-medium' : 'text-muted-foreground'}>
                {s.label}
              </span>
              <span className="font-medium font-mono text-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Minimal Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground pt-0.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span>New</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
          <span>Active</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Stalled</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Lost</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Won</span>
        </span>
      </div>
    </div>
  );
}
