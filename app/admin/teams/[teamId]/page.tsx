import React from 'react';
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

export async function generateMetadata({ params }: PageProps) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  if (!team) return { title: 'Squad Not Found | HEEYAKU' };
  return {
    title: `${team.name} — Squad Details & Roster | HEEYAKU`,
    description: `Manage squad information, assigned team lead, and sales associates for ${team.name}.`,
  };
}

export default async function TeamPage({ params }: PageProps) {
  const admin = await assertAdminAccess();
  const { teamId } = await params;

  const team = await prisma.team.findUnique({
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
    },
  });

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

  // 1. Fetch active BDAs for this squad
  const bdaEmployees = await prisma.employee.findMany({
    where: {
      teamId: team.id,
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
  });

  const bdaIds = bdaEmployees.map((b) => b.id);

  // 2. Fetch stats for each BDA
  const [bdaTotalLeads, bdaConvertedLeads, bdaCallStats] = await Promise.all([
    prisma.lead.groupBy({
      by: ['assignedEmployeeId'],
      where: {
        assignedEmployeeId: { in: bdaIds },
      },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ['assignedEmployeeId'],
      where: {
        assignedEmployeeId: { in: bdaIds },
        status: 'CONVERTED',
      },
      _count: { id: true },
    }),
    prisma.callLog.groupBy({
      by: ['employeeId'],
      where: {
        employeeId: { in: bdaIds },
        leadId: { not: null },
      },
      _sum: { durationSeconds: true },
      _count: { id: true },
    }),
  ]);

  const bdaTotalLeadsMap = new Map<string, number>();
  bdaTotalLeads.forEach((l) => {
    if (l.assignedEmployeeId) bdaTotalLeadsMap.set(l.assignedEmployeeId, l._count.id);
  });

  const bdaConvertedMap = new Map<string, number>();
  bdaConvertedLeads.forEach((l) => {
    if (l.assignedEmployeeId) bdaConvertedMap.set(l.assignedEmployeeId, l._count.id);
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

  // 3. Squad Aggregate Leads & Call Stats
  const [totalLeads, convertedLeads, pipelineLeads, allSquadCalls] = await Promise.all([
    prisma.lead.count({
      where: { teamId: team.id },
    }),
    prisma.lead.count({
      where: { teamId: team.id, status: 'CONVERTED' },
    }),
    prisma.lead.count({
      where: {
        teamId: team.id,
        status: { in: ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
      },
    }),
    prisma.callLog.aggregate({
      where: {
        employee: { teamId: team.id },
        leadId: { not: null },
      },
      _count: { id: true },
      _sum: { durationSeconds: true },
    }),
  ]);

  const connectedCallsCount = await prisma.callLog.count({
    where: {
      employee: { teamId: team.id },
      leadId: { not: null },
      connected: true,
    },
  });

  // 4. Calculate Squad Rank
  const allTeamsConversions = await prisma.lead.groupBy({
    by: ['teamId'],
    where: {
      teamId: { not: null },
      status: 'CONVERTED',
    },
    _count: { id: true },
  });

  const allTeamsCount = await prisma.team.count();
  const sortedByConversions = allTeamsConversions
    .map((c) => ({ teamId: c.teamId, count: c._count.id }))
    .sort((a, b) => b.count - a.count);

  const rankIdx = sortedByConversions.findIndex((c) => c.teamId === team.id);
  const rank = rankIdx !== -1 ? rankIdx + 1 : allTeamsCount;

  // 5. Recent Leads assigned to this squad
  const recentLeadsData = await prisma.lead.findMany({
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
  });

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
          totalCalls: allSquadCalls._count.id || 0,
          connectedCalls: connectedCallsCount,
          totalTalkTimeSeconds: allSquadCalls._sum.durationSeconds || 0,
          rank,
          totalSquads: allTeamsCount,
        }}
        recentLeads={recentLeads}
        canManage={userCanManage}
        currentUserRole={admin.role}
      />
    </main>
  );
}
