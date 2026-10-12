import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { canManageTeams } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import TeamsLeaderboardView from '@/components/admin/teams/TeamsLeaderboardView';
import { SquadLeaderboardItem } from '@/components/admin/teams/types';

export const metadata = {
  title: 'Teams Recognition & Leaderboard | HEEYAKU Admin',
  description: 'Squad performance ranking, client acquisition metrics, and team lead recognitions.',
};

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const admin = await assertAdminAccess();

  const isTeamLead = admin.role === Role.TEAM_LEAD;
  const targetTeamId = isTeamLead ? (admin.ledTeamId || admin.teamId || null) : null;

  const teams = await prisma.team.findMany({
    where: isTeamLead ? { id: targetTeamId || '__UNASSIGNED_SQUAD__' } : {},
    include: {
      teamLead: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
        },
      },
      members: {
        where: {
          isActive: true,
          role: Role.BDA,
        },
        select: { id: true },
      },
      _count: {
        select: {
          members: true,
          leads: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const teamIds = teams.map((t) => t.id);

  // Group queries for team conversions, call logs, and roster mapping
  const [teamStatusCounts, callStats, allEmployees] = await Promise.all([
    prisma.lead.groupBy({
      by: ['teamId', 'status'],
      where: {
        teamId: { in: teamIds },
        status: { in: ['CONVERTED', 'ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
      },
      _count: { id: true },
    }),
    prisma.callLog.groupBy({
      by: ['employeeId', 'connected'],
      where: {
        employee: { teamId: { in: teamIds } },
      },
      _sum: { durationSeconds: true },
      _count: { id: true },
    }),
    prisma.employee.findMany({
      where: { teamId: { in: teamIds } },
      select: { id: true, teamId: true },
    }),
  ]);

  // Map employee calls to teams
  const employeeTeamMap = new Map<string, string>();
  allEmployees.forEach((e) => {
    if (e.teamId) employeeTeamMap.set(e.id, e.teamId);
  });

  const teamTalkTimeMap = new Map<string, number>();
  const teamTotalCallsMap = new Map<string, number>();
  const teamConnectedCallsMap = new Map<string, number>();
  callStats.forEach((c) => {
    const tId = employeeTeamMap.get(c.employeeId);
    if (tId) {
      teamTalkTimeMap.set(tId, (teamTalkTimeMap.get(tId) || 0) + (c._sum.durationSeconds || 0));
      teamTotalCallsMap.set(tId, (teamTotalCallsMap.get(tId) || 0) + (c._count.id || 0));
      if (c.connected) {
        teamConnectedCallsMap.set(tId, (teamConnectedCallsMap.get(tId) || 0) + (c._count.id || 0));
      }
    }
  });

  const convertedMap = new Map<string, number>();
  const pipelineMap = new Map<string, number>();
  teamStatusCounts.forEach((s) => {
    if (!s.teamId) return;
    if (s.status === 'CONVERTED') {
      convertedMap.set(s.teamId, (convertedMap.get(s.teamId) || 0) + s._count.id);
    } else {
      pipelineMap.set(s.teamId, (pipelineMap.get(s.teamId) || 0) + s._count.id);
    }
  });

  const rawSquads: Omit<SquadLeaderboardItem, 'rank'>[] = teams.map((team) => {
    const converted = convertedMap.get(team.id) || 0;
    const totalLeads = team._count.leads;
    const pipeline = pipelineMap.get(team.id) || 0;
    const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
    const totalCalls = teamTotalCallsMap.get(team.id) || 0;
    const connectedCalls = teamConnectedCallsMap.get(team.id) || 0;
    const totalTalkSec = teamTalkTimeMap.get(team.id) || 0;

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      colorTag: team.colorTag || '#2563EB',
      teamLead: team.teamLead,
      activeMemberCount: team.members.length,
      totalLeads,
      convertedLeads: converted,
      pipelineLeads: pipeline,
      conversionRate,
      totalCalls,
      connectedCalls,
      totalTalkTimeSeconds: totalTalkSec,
    };
  });

  // Sort by converted leads descending, then conversion rate
  rawSquads.sort((a, b) => {
    if (b.convertedLeads !== a.convertedLeads) {
      return b.convertedLeads - a.convertedLeads;
    }
    return b.conversionRate - a.conversionRate;
  });

  const rankedSquads: SquadLeaderboardItem[] = rawSquads.map((s, idx) => ({
    ...s,
    rank: idx + 1,
  }));

  const userCanManage = canManageTeams(admin.role);

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
      <TeamsLeaderboardView
        squads={rankedSquads}
        canManageTeams={userCanManage}
        currentUserRole={admin.role}
        currentTeamId={admin.ledTeamId || admin.teamId}
      />
    </main>
  );
}
