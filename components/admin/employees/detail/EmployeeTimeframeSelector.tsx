'use client';

import React from 'react';
import { TimeFrame } from './types';
import { Calendar, Clock, Award } from 'lucide-react';

interface EmployeeTimeframeSelectorProps {
  timeframe: TimeFrame;
  onSelectTimeframe: (tf: TimeFrame) => void;
  counts: {
    today: number;
    month: number;
    lifetime: number;
  };
}

export default function EmployeeTimeframeSelector({
  timeframe,
  onSelectTimeframe,
  counts,
}: EmployeeTimeframeSelectorProps) {
  const options: { id: TimeFrame; label: string; icon: React.ReactNode; count: number; desc: string }[] = [
    {
      id: 'TODAY',
      label: 'Today',
      icon: <Clock className="w-3.5 h-3.5" />,
      count: counts.today,
      desc: 'Active today',
    },
    {
      id: 'MONTH',
      label: 'This Month',
      icon: <Calendar className="w-3.5 h-3.5" />,
      count: counts.month,
      desc: 'Month to date',
    },
    {
      id: 'LIFETIME',
      label: 'Lifetime',
      icon: <Award className="w-3.5 h-3.5" />,
      count: counts.lifetime,
      desc: 'All-time career',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-muted/40 rounded-2xl border border-border">
      <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border/60 shadow-2xs">
        {options.map((opt) => {
          const isSelected = timeframe === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectTimeframe(opt.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-muted-foreground px-2">
        Criteria:{' '}
        <span className="font-semibold text-foreground">
          {options.find((o) => o.id === timeframe)?.desc}
        </span>
      </div>
    </div>
  );
}
