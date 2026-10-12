import React, { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { canManageTeams, AuthorizationError } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import TeamDetailsView, {
  SquadMemberBda,
  SquadRecentLead,
} from '@/components/admin/teams/TeamDetailsView';

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export const dynamic = 'force-dynamic';

// ⚡ React cache: Deduplicates team fetch between generateMetadata and TeamPage in the same request
const getTeamWithMembers = cache(async (teamId: string) => {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      teamLead: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          phoneNumber: true,
          isActive: true,
        },
      },
      members: {
        where: {
          role: Role.BDA,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          phoneNumber: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      },
    },
  });
});

// ⚡ 30s In-memory cache for organization-wide squad rankings to prevent scanning all leads on every squad page load
interface CachedSquadRankings {
  conversions: Array<{ teamId: string | null; _count: { id: number } }>;
  totalTeams: number;
  expiresAt: number;
}
let squadRankingsCache: CachedSquadRankings | null = null;
const SQUAD_RANK_CACHE_TTL_MS = 30 * 1000;

async function getCachedSquadRankings() {
  const now = Date.now();
  if (squadRankingsCache && squadRankingsCache.expiresAt > now) {
    return squadRankingsCache;
  }
  const [conversions, totalTeams] = await Promise.all([
    prisma.lead.groupBy({
      by: ['teamId'],
      where: {
        teamId: { not: null },
        status: 'CONVERTED',
      },
      _count: { id: true },
    }),
    prisma.team.count(),
  ]);
  squadRankingsCache = {
    conversions,
    totalTeams,
    expiresAt: now + SQUAD_RANK_CACHE_TTL_MS,
  };
  return squadRankingsCache;
}

export async function generateMetadata({ params }: PageProps) {
  const { teamId } = await params;
  const team = await getTeamWithMembers(teamId);
  if (!team) return { title: 'Squad Not Found | HEEYAKU' };
  return {
    title: `${team.name} — Squad Details & Roster | HEEYAKU`,
    description: `Manage squad information, assigned team lead, and sales associates for ${team.name}.`,
  };
}

export default async function TeamPage({ params }: PageProps) {
  const admin = await assertAdminAccess();
  const { teamId } = await params;

  const team = await getTeamWithMembers(teamId);

  if (!team) {
    notFound();
  }

  const userCanManage = canManageTeams(admin.role);

  // 🔒 RBAC Guard: Team Leads can only view their own squad; BDAs have no access
  if (!userCanManage) {
    if (admin.role === Role.TEAM_LEAD) {
      const isMySquad = admin.ledTeamId === team.id || admin.teamId === team.id;
      if (!isMySquad) {
        throw new AuthorizationError('Access denied: You can only view your own squad.');
      }
    } else {
      throw new AuthorizationError('Access denied: Unauthorized to view squad details.');
    }
  }

  // BDAs are already fetched with team in a single query above
  const bdaEmployees = team.members;
  const bdaIds = bdaEmployees.map((b) => b.id);

  // ⚡ Execute all remaining squad & BDA metrics in ONE single parallel roundtrip
  const [
    squadLeadStatusGroup,
    squadCallGroup,
    recentLeadsData,
    squadRankings,
    bdaStatusStats,
    bdaCallStats,
  ] = await Promise.all([
    // 1. Squad lead status breakdown (computes total, converted, pipeline in 1 query)
    prisma.lead.groupBy({
      by: ['status'],
      where: { teamId: team.id },
      _count: { id: true },
    }),
    // 2. Squad calls & talk time (groups by connected status to get total, connected, and duration in 1 query)
    prisma.callLog.groupBy({
      by: ['connected'],
      where: {
        employee: { teamId: team.id },
        leadId: { not: null },
      },
      _count: { id: true },
      _sum: { durationSeconds: true },
    }),
    // 3. Recent 10 leads for this squad
    prisma.lead.findMany({
      where: { teamId: team.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        assignedEmployee: {
          select: { name: true },
        },
      },
    }),
    // 4. Cached squad ranking
    getCachedSquadRankings(),
    // 5. BDA lead status counts (only if squad has active BDAs)
    bdaIds.length > 0
      ? prisma.lead.groupBy({
          by: ['assignedEmployeeId', 'status'],
          where: {
            assignedEmployeeId: { in: bdaIds },
          },
          _count: { id: true },
        })
      : Promise.resolve([]),
    // 6. BDA call & talk time stats (only if squad has active BDAs)
    bdaIds.length > 0
      ? prisma.callLog.groupBy({
          by: ['employeeId'],
          where: {
            employeeId: { in: bdaIds },
            leadId: { not: null },
          },
          _sum: { durationSeconds: true },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ]);

  // Aggregate squad calls & connected count from the grouped call stats
  let totalCalls = 0;
  let connectedCallsCount = 0;
  let totalTalkTimeSeconds = 0;
  squadCallGroup.forEach((c) => {
    const count = c._count.id || 0;
    const duration = c._sum.durationSeconds || 0;
    totalCalls += count;
    totalTalkTimeSeconds += duration;
    if (c.connected) {
      connectedCallsCount += count;
    }
  });

  // Map individual BDA stats
  const bdaTotalLeadsMap = new Map<string, number>();
  const bdaConvertedMap = new Map<string, number>();
  bdaStatusStats.forEach((s) => {
    if (s.assignedEmployeeId) {
      bdaTotalLeadsMap.set(
        s.assignedEmployeeId,
        (bdaTotalLeadsMap.get(s.assignedEmployeeId) || 0) + s._count.id
      );
      if (s.status === 'CONVERTED') {
        bdaConvertedMap.set(s.assignedEmployeeId, s._count.id);
      }
    }
  });

  const bdaCallsMap = new Map<string, number>();
  const bdaTalkTimeMap = new Map<string, number>();
  bdaCallStats.forEach((c) => {
    bdaCallsMap.set(c.employeeId, c._count.id || 0);
    bdaTalkTimeMap.set(c.employeeId, c._sum.durationSeconds || 0);
  });

  const rosterMembers: SquadMemberBda[] = bdaEmployees.map((b) => ({
    id: b.id,
    name: b.name,
    employeeCode: b.employeeCode,
    email: b.email,
    phoneNumber: b.phoneNumber,
    isActive: b.isActive,
    totalLeads: bdaTotalLeadsMap.get(b.id) || 0,
    convertedLeads: bdaConvertedMap.get(b.id) || 0,
    totalCalls: bdaCallsMap.get(b.id) || 0,
    totalTalkTimeSeconds: bdaTalkTimeMap.get(b.id) || 0,
  }));

  // Squad Aggregate Leads
  let totalLeads = 0;
  let convertedLeads = 0;
  let pipelineLeads = 0;
  squadLeadStatusGroup.forEach((g) => {
    totalLeads += g._count.id;
    if (g.status === 'CONVERTED') {
      convertedLeads += g._count.id;
    }
    if (['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'].includes(g.status)) {
      pipelineLeads += g._count.id;
    }
  });

  // Calculate Squad Rank using cached org conversions
  const sortedByConversions = squadRankings.conversions
    .map((c) => ({ teamId: c.teamId, count: c._count.id }))
    .sort((a, b) => b.count - a.count);

  const rankIdx = sortedByConversions.findIndex((c) => c.teamId === team.id);
  const rank = rankIdx !== -1 ? rankIdx + 1 : squadRankings.totalTeams;

  const recentLeads: SquadRecentLead[] = recentLeadsData.map((l) => ({
    id: l.id,
    name: l.name,
    phoneNumber: l.phoneNumber,
    status: l.status,
    assignedEmployeeName: l.assignedEmployee?.name || null,
    createdAt: l.createdAt.toISOString(),
  }));

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8">
      <TeamDetailsView
        team={{
          id: team.id,
          name: team.name,
          description: team.description,
          colorTag: team.colorTag,
          createdAt: team.createdAt.toISOString(),
          teamLead: team.teamLead,
        }}
        members={rosterMembers}
        stats={{
          totalLeads,
          convertedLeads,
          pipelineLeads,
          conversionRate,
          totalCalls,
          connectedCalls: connectedCallsCount,
          totalTalkTimeSeconds,
          rank,
          totalSquads: squadRankings.totalTeams,
        }}
        recentLeads={recentLeads}
        canManage={userCanManage}
        currentUserRole={admin.role}
      />
    </main>
  );
}
