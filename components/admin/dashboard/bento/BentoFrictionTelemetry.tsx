'use client';

import React from 'react';

interface BentoFrictionTelemetryProps {
  totalLeads: number;
  noAnswer: number;
  busy: number;
  wrongNumber: number;
  notInterested: number;
  notQualified: number;
  other: number;
}

export default function BentoFrictionTelemetry({
  totalLeads,
  noAnswer,
  busy,
  wrongNumber,
  notInterested,
  notQualified,
  other,
}: BentoFrictionTelemetryProps) {
  const unreachableTotal = noAnswer + busy + wrongNumber;
  const lostTotal = notInterested + notQualified + other;

  const unreachableStats = [
    { label: 'No Answer', count: noAnswer },
    { label: 'Busy', count: busy },
    { label: 'Wrong Number', count: wrongNumber },
  ];

  const lostStats = [
    { label: 'Not Interested', count: notInterested },
    { label: 'Not Qualified', count: notQualified },
    { label: 'Other', count: other },
  ];

  return (
    <div className="flex flex-col justify-between h-full p-3.5 sm:p-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Connection & Outcome Diagnostics
          </span>
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {unreachableTotal + lostTotal} logged
          </span>
        </div>

        {/* Group 1: Re-dial Candidates */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Not Connected</span>
            <span className="font-mono font-bold text-muted-foreground">{unreachableTotal}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center">
            {unreachableStats.map((item) => (
              <div key={item.label}>
                <div className="text-sm font-bold font-mono text-foreground">{item.count}</div>
                <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Group 2: Closed & Disqualified */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Lost & Disqualified</span>
            <span className="font-mono font-bold text-muted-foreground">{lostTotal}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center">
            {lostStats.map((item) => (
              <div key={item.label}>
                <div className="text-sm font-bold font-mono text-foreground">{item.count}</div>
                <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Lost rate</span>
        <span className="font-mono font-bold text-foreground">
          {totalLeads > 0 ? `${Math.round((lostTotal / totalLeads) * 100)}%` : '0%'}
        </span>
      </div>
    </div>
  );
}
