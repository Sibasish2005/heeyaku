'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Users,
  Plus,
  Search,
  CheckCircle2,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowUpDown,
  Building2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { TeamsLeaderboardProps, SquadLeaderboardItem } from './types';
import TeamPodiumCard from './TeamPodiumCard';
import CreateTeamModal from './CreateTeamModal';
import { Role } from '@prisma/client';

export default function TeamsLeaderboardView({
  squads,
  canManageTeams,
  currentUserRole,
  currentTeamId,
}: TeamsLeaderboardProps) {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'converted' | 'talkTime' | 'rate'>('converted');

  // Filtered & sorted squads
  const filteredSquads = useMemo(() => {
    let result = squads.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.teamLead && s.teamLead.name.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy === 'talkTime') {
      result = [...result].sort((a, b) => b.totalTalkTimeSeconds - a.totalTalkTimeSeconds);
    } else if (sortBy === 'rate') {
      result = [...result].sort((a, b) => b.conversionRate - a.conversionRate);
    } else {
      result = [...result].sort((a, b) => b.convertedLeads - a.convertedLeads);
    }

    return result.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [squads, search, sortBy]);

  // Aggregate stats across squads
  const totalSquads = squads.length;
  const totalConverted = squads.reduce((acc, s) => acc + s.convertedLeads, 0);
  const totalCalls = squads.reduce((acc, s) => acc + s.totalCalls, 0);
  const totalTalkSec = squads.reduce((acc, s) => acc + s.totalTalkTimeSeconds, 0);
  const totalMembers = squads.reduce((acc, s) => acc + s.activeMemberCount, 0);

  const top3 = filteredSquads.slice(0, 3);

  const formatTalkTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-500 uppercase mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Squad Recognition & Performance League</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Teams Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Recognizing team leads and squads gaining the most clients and driving telephony velocity.
          </p>
        </div>

        {canManageTeams && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Form New Squad</span>
          </button>
        )}
      </div>

      {/* Aggregate League Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Squads</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {totalSquads}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Active BDAs</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {totalMembers}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Clients Acquired</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalConverted}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Collective Talk Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {formatTalkTime(totalTalkSec)}
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Squad Podium Showcase</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {top3.map((squad) => (
              <TeamPodiumCard key={squad.id} squad={squad} />
            ))}
          </div>
        </div>
      )}

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search squad or team lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort by:
          </span>
          <div className="inline-flex rounded-xl border border-border p-0.5 bg-muted/40 text-xs font-semibold">
            <button
              onClick={() => setSortBy('converted')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                sortBy === 'converted'
                  ? 'bg-background text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clients Acquired
            </button>
            <button
              onClick={() => setSortBy('rate')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                sortBy === 'rate'
                  ? 'bg-background text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversion %
            </button>
            <button
              onClick={() => setSortBy('talkTime')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                sortBy === 'talkTime'
                  ? 'bg-background text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Talk Time
            </button>
          </div>
        </div>
      </div>

      {/* Full Squad Comparison Table */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-muted/60 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">Rank</th>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">Team Lead</th>
                <th className="py-3 px-4 text-center">Active BDAs</th>
                <th className="py-3 px-4 text-center">Clients Acquired</th>
                <th className="py-3 px-4 text-center">Pipeline Leads</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4 text-center">Calls Logged</th>
                <th className="py-3 px-4 text-center">Talk Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredSquads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    No squads match your search query.
                  </td>
                </tr>
              ) : (
                filteredSquads.map((squad) => {
                  const isCurrentUsersTeam = currentTeamId === squad.id;
                  return (
                    <tr
                      key={squad.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isCurrentUsersTeam ? 'bg-[#2563EB]/5 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {squad.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 font-extrabold text-xs">
                            🥇
                          </span>
                        ) : squad.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-400 font-extrabold text-xs">
                            🥈
                          </span>
                        ) : squad.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/15 text-amber-700 font-extrabold text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono text-muted-foreground font-bold">
                            #{squad.rank}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: squad.colorTag || '#2563EB' }}
                          />
                          <div>
                            <Link
                              href={`/admin/teams/${squad.id}`}
                              className="font-bold text-foreground hover:text-[#2563EB] transition-colors line-clamp-1"
                            >
                              {squad.name}
                            </Link>
                            {squad.description && (
                              <div className="text-[10px] text-muted-foreground line-clamp-1">
                                {squad.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {squad.teamLead ? (
                          <div>
                            <div className="font-bold text-foreground">
                              {squad.teamLead.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {squad.teamLead.employeeCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {squad.activeMemberCount}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          {squad.convertedLeads}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {squad.pipelineLeads} / {squad.totalLeads}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, squad.conversionRate)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-foreground">
                            {squad.conversionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <div className="font-semibold text-foreground">
                          {squad.totalCalls}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ({squad.connectedCalls} conn)
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold text-foreground">
                        {formatTalkTime(squad.totalTalkTimeSeconds)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/teams/${squad.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-foreground bg-muted/60 hover:bg-[#2563EB] hover:text-white rounded-lg transition-all"
                          >
                            <span>{canManageTeams ? 'Manage' : 'View'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          {(currentUserRole === Role.CEO || (currentUserRole === Role.TEAM_LEAD && isCurrentUsersTeam)) && (
                            <Link
                              href={`/admin/leads?teamId=${squad.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                              title="View squad leads in CRM"
                            >
                              <span>CRM</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTeamModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}
