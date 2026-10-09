import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { canManageTeams } from '@/lib/auth/rbac';
import TeamsLeaderboardView from '@/components/admin/teams/TeamsLeaderboardView';
import { SquadLeaderboardItem } from '@/components/admin/teams/types';

export const metadata = {
  title: 'Teams Recognition & Leaderboard | HEEYAKU Admin',
  description: 'Squad performance ranking, client acquisition metrics, and team lead recognitions.',
};

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const admin = await assertAdminAccess();

  const teams = await prisma.team.findMany({
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
        where: { isActive: true },
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

  // Group queries for team conversions and call logs
  const [convertedCounts, pipelineCounts, callStats, connectedCounts] = await Promise.all([
    prisma.lead.groupBy({
      by: ['teamId'],
      where: {
        teamId: { in: teamIds },
        status: 'CONVERTED',
      },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ['teamId'],
      where: {
        teamId: { in: teamIds },
        status: { in: ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
      },
      _count: { id: true },
    }),
    prisma.callLog.groupBy({
      by: ['employeeId'],
      where: {
        employee: { teamId: { in: teamIds } },
        leadId: { not: null },
      },
      _sum: { durationSeconds: true },
      _count: { id: true },
    }),
    prisma.callLog.groupBy({
      by: ['employeeId'],
      where: {
        employee: { teamId: { in: teamIds } },
        leadId: { not: null },
        connected: true,
      },
      _count: { id: true },
    }),
  ]);

  // Map employee calls to teams
  const employeeTeamMap = new Map<string, string>();
  const allEmployees = await prisma.employee.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true, teamId: true },
  });
  allEmployees.forEach((e) => {
    if (e.teamId) employeeTeamMap.set(e.id, e.teamId);
  });

  const teamTalkTimeMap = new Map<string, number>();
  const teamTotalCallsMap = new Map<string, number>();
  callStats.forEach((c) => {
    const tId = employeeTeamMap.get(c.employeeId);
    if (tId) {
      teamTalkTimeMap.set(tId, (teamTalkTimeMap.get(tId) || 0) + (c._sum.durationSeconds || 0));
      teamTotalCallsMap.set(tId, (teamTotalCallsMap.get(tId) || 0) + (c._count.id || 0));
    }
  });

  const teamConnectedCallsMap = new Map<string, number>();
  connectedCounts.forEach((c) => {
    const tId = employeeTeamMap.get(c.employeeId);
    if (tId) {
      teamConnectedCallsMap.set(tId, (teamConnectedCallsMap.get(tId) || 0) + (c._count.id || 0));
    }
  });

  const convertedMap = new Map<string, number>();
  convertedCounts.forEach((c) => {
    if (c.teamId) convertedMap.set(c.teamId, c._count.id);
  });

  const pipelineMap = new Map<string, number>();
  pipelineCounts.forEach((c) => {
    if (c.teamId) pipelineMap.set(c.teamId, c._count.id);
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
