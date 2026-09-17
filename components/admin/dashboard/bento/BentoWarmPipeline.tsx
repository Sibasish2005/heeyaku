'use client';

import React from 'react';

interface BentoWarmPipelineProps {
  totalLeads: number;
  interested: number;
  followUp: number;
  callBack: number;
}

export default function BentoWarmPipeline({
  totalLeads,
  interested,
  followUp,
  callBack,
}: BentoWarmPipelineProps) {
  const hotItems = [
    { label: 'Interested', count: interested },
    { label: 'Follow-up needed', count: followUp },
    { label: 'Call back later', count: callBack },
  ];

  const totalWarm = interested + followUp + callBack;

  return (
    <div className="flex flex-col justify-between h-full p-3.5 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Follow-Up Priority Queue
          </span>
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {totalWarm} waiting
          </span>
        </div>

        {/* Clean list with subtle hover state */}
        <div className="divide-y divide-border/40">
          {hotItems.map((item) => {
            const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
            return (
              <div
                key={item.label}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/20 px-1 rounded-lg transition-colors duration-150"
              >
                <div className="text-xs font-semibold text-foreground">{item.label}</div>

                <div className="text-right font-mono flex items-center gap-3">
                  <div className="text-sm font-bold text-foreground">{item.count}</div>
                  <div className="text-xs text-muted-foreground w-8 text-right">{pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Active prospects</span>
        <span className="font-mono font-bold text-foreground">
          {totalWarm}
        </span>
      </div>
    </div>
  );
}
