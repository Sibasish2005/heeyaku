'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, PhoneCall, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { SquadLeaderboardItem } from './types';

interface TeamPodiumCardProps {
  squad: SquadLeaderboardItem;
}

export default function TeamPodiumCard({ squad }: TeamPodiumCardProps) {
  const isFirst = squad.rank === 1;

  const formatTalkTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  };

  const getRankBadge = () => {
    return (
      <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
        isFirst 
          ? 'bg-primary/10 text-primary border-primary/20' 
          : 'bg-muted text-muted-foreground border-border'
      }`}>
        #{squad.rank}
      </div>
    );
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all duration-150 flex flex-col justify-between shadow-2xs">
      {/* Top Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: squad.colorTag || '#2563EB' }}
            />
            <Link
              href={`/admin/teams/${squad.id}`}
              className="font-extrabold text-base sm:text-lg text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors tracking-tight line-clamp-1"
            >
              {squad.name}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Lead: <span className="font-semibold text-foreground">{squad.teamLead ? squad.teamLead.name : 'Unassigned'}</span>
            {squad.teamLead && <span className="text-[10px] text-muted-foreground ml-1">({squad.teamLead.employeeCode})</span>}
          </p>
        </div>
        {getRankBadge()}
      </div>

      {/* Main KPI: Acquired Clients */}
      <div className="my-5 p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Clients Acquired</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight mt-0.5">
            {squad.convertedLeads}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Conversion Rate
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {squad.conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/80 text-center">
        <div className="space-y-0.5">
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            <span>BDAs</span>
          </div>
          <div className="text-xs font-bold text-foreground font-mono">
            {squad.activeMemberCount}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <PhoneCall className="w-3 h-3 text-blue-500" />
            <span>Calls</span>
          </div>
          <div className="text-xs font-bold text-foreground font-mono">
            {squad.totalCalls}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>Talk Time</span>
          </div>
          <div className="text-xs font-bold text-foreground font-mono">
            {formatTalkTime(squad.totalTalkTimeSeconds)}
          </div>
        </div>
      </div>

      {/* Manage Squad Link */}
      <div className="mt-3 pt-3 border-t border-border/80">
        <Link
          href={`/admin/teams/${squad.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-foreground hover:text-white bg-muted/60 hover:bg-[#2563EB] rounded-xl transition-all cursor-pointer"
        >
          <span>Manage Squad</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
