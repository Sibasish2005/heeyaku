import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { Role, Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import ProspectsView from '@/components/admin/prospects/ProspectsView';
import { ProspectItem, TeamLeadSummary } from '@/components/admin/prospects/types';

export const metadata = {
  title: 'Prospects Pipeline & Closing Matrix | HEEYAKU Admin',
  description: 'Manage qualified prospects, track Team Lead conversions, and close deals.',
};

export const dynamic = 'force-dynamic';

export default async function ProspectsPage() {
  const admin = await assertAdminAccess();

  // HR is strictly blocked from viewing prospects
  if (admin.role !== Role.CEO && admin.role !== Role.TEAM_LEAD) {
    redirect(admin.role === Role.HR ? '/admin/employees' : '/admin/dashboard');
  }

  const isTeamLead = admin.role === Role.TEAM_LEAD;
  const isCeo = admin.role === Role.CEO;
  const targetTeamId = isTeamLead ? (admin.ledTeamId || admin.teamId || null) : null;

  const companyScope = !admin.isSuperAdmin ? { companyId: admin.companyId || '__NO_COMPANY__' } : {};

  // Build query filter
  const prospectWhere: Prisma.LeadWhereInput = {
    isProspect: true,
    ...companyScope,
    ...(isTeamLead
      ? {
          OR: [
            { assignedEmployeeId: admin.employeeId },
            ...(targetTeamId ? [{ teamId: targetTeamId, assignedEmployee: { role: Role.TEAM_LEAD } }] : []),
          ],
        }
      : {}),
  };

  const [rawProspects, teamLeads] = await Promise.all([
    prisma.lead.findMany({
      where: prospectWhere,
      orderBy: { updatedAt: 'desc' },
      take: 2000,
      include: {
        assignedEmployee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            role: true,
          },
        },
        originalBda: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            colorTag: true,
          },
        },
        callLogs: {
          where: { connected: true },
          orderBy: { startedAt: 'desc' },
          take: 3,
          select: {
            id: true,
            durationSeconds: true,
            connected: true,
            startedAt: true,
            outcomeLabel: true,
            notes: true,
          },
        },
      },
    }),
    isCeo
      ? prisma.employee.findMany({
          where: { role: Role.TEAM_LEAD, isActive: true, ...companyScope },
          select: {
            id: true,
            name: true,
            employeeCode: true,
            team: true,
            teamId: true,
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  // Format prospects for client consumption
  const prospects: ProspectItem[] = rawProspects.map((p) => ({
    id: p.id,
    leadCode: p.leadCode,
    name: p.name,
    phoneNumber: p.phoneNumber,
    email: p.email,
    company: p.company,
    source: p.source,
    status: p.status,
    notes: p.notes,
    isProspect: p.isProspect,
    promotedToProspectAt: p.promotedToProspectAt ? p.promotedToProspectAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    teamId: p.teamId,
    team: p.team,
    assignedEmployeeId: p.assignedEmployeeId,
    assignedEmployee: p.assignedEmployee
      ? {
          id: p.assignedEmployee.id,
          employeeCode: p.assignedEmployee.employeeCode,
          name: p.assignedEmployee.name,
          role: p.assignedEmployee.role,
        }
      : null,
    originalBdaId: p.originalBdaId,
    originalBda: p.originalBda,
    recentCallLogs: p.callLogs.map((c) => ({
      id: c.id,
      durationSeconds: c.durationSeconds,
      connected: c.connected,
      startedAt: c.startedAt.toISOString(),
      outcomeLabel: c.outcomeLabel,
      notes: c.notes,
    })),
  }));

  // Build Team Lead summary matrix for CEO view
  const teamLeadSummaries: TeamLeadSummary[] = isCeo
    ? teamLeads.map((tl) => {
        const tlProspects = prospects.filter(
          (p) => p.assignedEmployeeId === tl.id || (p.teamId && p.teamId === tl.teamId)
        );
        const total = tlProspects.length;
        const converted = tlProspects.filter((p) => p.status === 'CONVERTED').length;
        const inPipeline = tlProspects.filter((p) =>
          ['INTERESTED', 'CALL_BACK', 'FOLLOW_UP'].includes(p.status)
        ).length;
        const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';

        return {
          id: tl.id,
          name: tl.name,
          employeeCode: tl.employeeCode,
          teamName: tl.team,
          teamId: tl.teamId,
          totalProspects: total,
          inPipeline,
          converted,
          conversionRate: rate,
        };
      })
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <ProspectsView
        initialProspects={prospects}
        teamLeadSummaries={teamLeadSummaries}
        currentUserRole={admin.role}
        currentUserId={admin.employeeId || admin.userId}
        currentUserName={admin.name}
      />
    </div>
  );
}
