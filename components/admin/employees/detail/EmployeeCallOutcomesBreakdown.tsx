import React from 'react';
import { MOBILE_OUTCOMES } from './types';

interface EmployeeCallOutcomesBreakdownProps {
  totalCalls: number;
  outcomeDistribution: Record<string, number>;
}

export default function EmployeeCallOutcomesBreakdown({
  totalCalls,
  outcomeDistribution,
}: EmployeeCallOutcomesBreakdownProps) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Mobile Call Outcomes & Dispositions</h3>
          <p className="text-xs text-muted-foreground">
            Real-time breakdown of call outcomes submitted from the mobile app
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted text-foreground border border-border">
          {totalCalls} {totalCalls === 1 ? 'call' : 'calls'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {MOBILE_OUTCOMES.map((outcome) => {
          const count =
            (outcomeDistribution[outcome.id] || 0) +
            (outcomeDistribution[outcome.key] || 0);
          const pct = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;

          return (
            <div key={outcome.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: outcome.color }}
                  />
                  <span className="font-medium text-foreground">{outcome.label}</span>
                </div>
                <div className="font-mono text-muted-foreground">
                  <span className="font-bold text-foreground">{count}</span> ({pct}%)
                </div>
              </div>

              {/* Segmented bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: outcome.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
