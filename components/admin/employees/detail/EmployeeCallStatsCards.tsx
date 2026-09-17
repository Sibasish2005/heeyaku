import React from 'react';
import { PhoneCall, PhoneForwarded, Clock, CheckCircle2 } from 'lucide-react';
import { formatSecondsDuration } from './types';

interface EmployeeCallStatsCardsProps {
  totalCalls: number;
  connectedCalls: number;
  connectionRate: string;
  totalTalkTimeSeconds: number;
  averageTalkTimeSeconds: number;
  convertedLeads: number;
  conversionRate: string;
}

export default function EmployeeCallStatsCards({
  totalCalls,
  connectedCalls,
  connectionRate,
  totalTalkTimeSeconds,
  averageTalkTimeSeconds,
  convertedLeads,
  conversionRate,
}: EmployeeCallStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-border bg-card shadow-2xs">
      {/* 1. Total Calls Made */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
          <span>Calls Logged</span>
        </div>
        <div className="text-2xl font-extrabold text-foreground font-mono tracking-tight">
          {totalCalls}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {connectedCalls} connected ({connectionRate}%)
        </div>
      </div>

      {/* 2. Total Talk Time */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Total Talk Time</span>
        </div>
        <div className="text-2xl font-extrabold text-foreground font-mono tracking-tight">
          {formatSecondsDuration(totalTalkTimeSeconds)}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Cumulative voice duration
        </div>
      </div>

      {/* 3. Average Duration */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <PhoneForwarded className="w-3.5 h-3.5 text-amber-500" />
          <span>Avg. Call Duration</span>
        </div>
        <div className="text-2xl font-extrabold text-foreground font-mono tracking-tight">
          {formatSecondsDuration(averageTalkTimeSeconds)}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Per connected call
        </div>
      </div>

      {/* 4. Closed Enrollments */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Converted</span>
        </div>
        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
          {convertedLeads}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {conversionRate}% conversion rate
        </div>
      </div>
    </div>
  );
}
