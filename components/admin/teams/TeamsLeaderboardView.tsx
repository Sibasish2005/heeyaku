'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Building2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { TeamsLeaderboardProps, SquadLeaderboardItem } from './types';
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

  const formatTalkTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  };

  const isTeamLead = currentUserRole === Role.TEAM_LEAD;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            {isTeamLead ? 'Squad Telemetry' : 'Organization & Squads'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isTeamLead ? (squads[0]?.name ? `${squads[0].name} Squad` : 'My Squad') : 'Squad Performance'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isTeamLead
              ? 'Real-time telemetry, client acquisitions, and telephony volume for your squad.'
              : 'Cross-squad performance metrics, client acquisitions, and telephony output.'}
          </p>
        </div>

        {canManageTeams && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Form New Squad</span>
          </button>
        )}
      </div>

      {/* Aggregate League / Squad Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-medium text-muted-foreground">
            {isTeamLead ? 'Squad' : 'Active Squads'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono truncate">
            {isTeamLead ? (squads[0]?.name || 'My Squad') : totalSquads}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-medium text-muted-foreground">
            {isTeamLead ? 'Squad BDAs' : 'Active BDAs'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
            {totalMembers}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-medium text-muted-foreground">
            {isTeamLead ? 'Clients Acquired' : 'Total Clients Acquired'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalConverted}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors">
          <div className="text-xs font-medium text-muted-foreground">
            {isTeamLead ? 'Squad Talk Time' : 'Collective Talk Time'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
            {formatTalkTime(totalTalkSec)}
          </div>
        </div>
      </div>

      {/* Toolbar & Filter (only shown when multiple squads exist) */}
      {!isTeamLead && (
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
      )}

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
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                          #{squad.rank}
                        </span>
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
