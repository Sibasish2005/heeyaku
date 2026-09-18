import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import EmployeeTable, { EmployeeListItem } from '@/components/admin/employees/EmployeeTable';

export const metadata = {
  title: 'Employee Directory & Access Control | HEEYAKU Admin',
  description: 'Manage staff accounts, credentials, and lead assignments.',
};

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  await assertAdminAccess();

  let totalEmployees = 0;
  let activeEmployees = 0;
  let totalAssignedLeads = 0;
  let totalCallsCount = 0;
  let connectedCallsCount = 0;
  let totalTalkTimeSeconds = 0;
  let initialTeams: string[] = [];
  let formattedEmployees: EmployeeListItem[] = [];

  try {
    const [
      total,
      active,
      assigned,
      callsTotal,
      connectedCallsTotal,
      talkTimeAgg,
      teamsRaw,
      initialEmployeesList,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { assignedEmployeeId: { not: null } } }),
      prisma.callLog.count(),
      prisma.callLog.count({ where: { connected: true } }),
      prisma.callLog.aggregate({
        _sum: {
          durationSeconds: true,
        },
      }),
      prisma.employee.findMany({
        select: { team: true },
        distinct: ['team'],
      }),
      prisma.employee.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          phoneNumber: true,
          team: true,
          notes: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              leads: true,
              callLogs: true,
            },
          },
        },
      }),
    ]);

    const employeeIds = initialEmployeesList.map((e) => e.id);
    const talkTimes = employeeIds.length > 0
      ? await prisma.callLog.groupBy({
          by: ['employeeId'],
          where: { employeeId: { in: employeeIds } },
          _sum: { durationSeconds: true },
        })
      : [];

    const talkTimeMap = new Map<string, number>();
    for (const t of talkTimes) {
      if (t.employeeId) {
        talkTimeMap.set(t.employeeId, t._sum.durationSeconds || 0);
      }
    }

    totalEmployees = total;
    activeEmployees = active;
    totalAssignedLeads = assigned;
    totalCallsCount = callsTotal;
    connectedCallsCount = connectedCallsTotal;
    totalTalkTimeSeconds = talkTimeAgg._sum.durationSeconds || 0;
    initialTeams = Array.from(new Set(teamsRaw.map((t) => t.team).filter(Boolean))) as string[];

    formattedEmployees = initialEmployeesList.map((e) => {
      const empTalkTime = talkTimeMap.get(e.id) || 0;
      return {
        id: e.id,
        employeeCode: e.employeeCode,
        name: e.name,
        email: e.email,
        phoneNumber: e.phoneNumber,
        team: e.team,
        notes: e.notes,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
        _count: {
          leads: e._count.leads,
          callLogs: e._count.callLogs,
        },
        totalCalls: e._count.callLogs,
        totalTalkTimeSeconds: empTalkTime,
      };
    });
  } catch (error) {
    console.error('Error loading employees in EmployeesPage:', error);
  }

  const formatRibbonTalkTime = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return '0s';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#2563EB] dark:text-blue-400 uppercase mb-1">
            Staff & Tele-caller Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Employee Directory
          </h1>
        </div>
      </div>

      {/* Unified Metric Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 rounded-2xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Total Staff</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalEmployees}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Active Members</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{activeEmployees}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Assigned Leads</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalAssignedLeads}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Calls Logged</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">{totalCallsCount}</div>
            {totalCallsCount > 0 && (
              <span className="text-xs font-bold text-muted-foreground font-mono">
                ({connectedCallsCount} conn)
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Total Talk Time</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            {formatRibbonTalkTime(totalTalkTimeSeconds)}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <EmployeeTable
        initialEmployees={formattedEmployees}
        totalEmployeesCount={totalEmployees}
        initialTeams={initialTeams}
      />
    </main>
  );
}
