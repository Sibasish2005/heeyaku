'use client';

import React from 'react';

interface BentoFunnelFlowProps {
  totalLeads: number;
  newCount: number;
  assignedCount: number;
  contactedCount: number;
  callBackCount: number;
  interestedCount: number;
  followUpCount: number;
  convertedCount: number;
}

export default function BentoFunnelFlow({
  totalLeads,
  newCount,
  assignedCount,
  contactedCount,
  callBackCount,
  interestedCount,
  followUpCount,
  convertedCount,
}: BentoFunnelFlowProps) {
  const stage1 = newCount + assignedCount;
  const stage2 = contactedCount + callBackCount;
  const stage3 = interestedCount + followUpCount;
  const stage4 = convertedCount;

  const stages = [
    {
      step: '1',
      name: 'Just Received',
      count: stage1,
      barColor: 'bg-[#2563EB]/40',
    },
    {
      step: '2',
      name: 'Connected',
      count: stage2,
      barColor: 'bg-[#2563EB]/70',
    },
    {
      step: '3',
      name: 'Interested',
      count: stage3,
      barColor: 'bg-[#2563EB]',
    },
    {
      step: '4',
      name: 'Converted',
      count: stage4,
      barColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full p-3.5 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline Progression
          </span>
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {totalLeads} total leads
          </span>
        </div>

        {/* Cohesive progress bars */}
        <div className="space-y-3">
          {stages.map((stage) => {
            const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
            return (
              <div key={stage.step} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                      0{stage.step}
                    </span>
                    <span className="font-semibold text-foreground">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-foreground text-xs">{stage.count}</span>
                    <span className="text-[11px] text-muted-foreground w-7 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${stage.barColor} rounded-full transition-[width] duration-500 ease-out`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Active in motion</span>
        <span className="font-mono font-bold text-foreground">
          {totalLeads > 0 ? `${Math.round(((stage2 + stage3 + stage4) / totalLeads) * 100)}%` : '0%'}
        </span>
      </div>
    </div>
  );
}
