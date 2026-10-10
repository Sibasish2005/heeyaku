import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { canManageLeads, isAllowedCeoEmail } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';
import EmployeeDetailView from '@/components/admin/employees/EmployeeDetailView';

interface EmployeeDetailPageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EmployeeDetailPageProps) {
  const { employeeId } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { name: true, employeeCode: true },
  });

  if (!employee) {
    return { title: 'Employee Not Found | HEEYAKU Admin' };
  }

  return {
    title: `${employee.name} (${employee.employeeCode}) | HEEYAKU Admin`,
  };
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const admin = await assertAdminAccess();
  const { employeeId } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leads: {
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          leadCode: true,
          name: true,
          phoneNumber: true,
          email: true,
          company: true,
          status: true,
          source: true,
          notes: true,
          assignedAt: true,
          createdAt: true,
          updatedAt: true,
          callLogs: {
            where: {
              employeeId: employeeId,
            },
            orderBy: {
              startedAt: 'desc',
            },
            select: {
              id: true,
              phoneNumber: true,
              durationSeconds: true,
              connected: true,
              outcomeId: true,
              outcomeLabel: true,
              notes: true,
              startedAt: true,
            },
          },
        },
      },
      callLogs: {
        orderBy: {
          startedAt: 'desc',
        },
        select: {
          id: true,
          leadId: true,
          phoneNumber: true,
          contactName: true,
          callType: true,
          durationSeconds: true,
          connected: true,
          outcomeId: true,
          outcomeLabel: true,
          notes: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
          lead: {
            select: {
              id: true,
              name: true,
              leadCode: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  // 🔒 Squad Data Isolation: Team Leads cannot view employees outside their own squad
  if (admin.role === Role.TEAM_LEAD) {
    const tlTeamId = admin.ledTeamId || admin.teamId;
    if (!tlTeamId || employee.teamId !== tlTeamId) {
      notFound();
    }
  }

  const isHr = !canManageLeads(admin.role);

  // Count leads by status
  const leadStatusCounts: Record<string, number> = {};
  for (const lead of employee.leads) {
    leadStatusCounts[lead.status] = (leadStatusCounts[lead.status] || 0) + 1;
  }

  const formattedEmployee = {
    ...employee,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };

  // Build secondary lookup for phone-matched calls
  const phoneToCallsMap = new Map<string, typeof employee.callLogs>();
  for (const call of employee.callLogs) {
    const digits = call.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (digits.length >= 8) {
      const arr = phoneToCallsMap.get(digits) || [];
      arr.push(call);
      phoneToCallsMap.set(digits, arr);
    }
  }

  const formattedLeads = employee.leads.map((l) => {
    const leadDigits = l.phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const matchedMap = new Map<string, {
      id: string;
      phoneNumber?: string;
      durationSeconds: number;
      connected: boolean;
      outcomeId: string | null;
      outcomeLabel: string | null;
      notes?: string | null;
      startedAt: string;
    }>();

    // 1. Calls directly linked via relation
    if (l.callLogs) {
      for (const c of l.callLogs) {
        matchedMap.set(c.id, {
          id: c.id,
          phoneNumber: c.phoneNumber,
          durationSeconds: c.durationSeconds,
          connected: c.connected,
          outcomeId: c.outcomeId,
          outcomeLabel: c.outcomeLabel,
          notes: c.notes,
          startedAt: c.startedAt.toISOString(),
        });
      }
    }

    // 2. Also incorporate phone-matched calls if any weren't directly linked
    if (leadDigits.length >= 8 && phoneToCallsMap.has(leadDigits)) {
      const phoneCalls = phoneToCallsMap.get(leadDigits)!;
      for (const pc of phoneCalls) {
        if (!matchedMap.has(pc.id)) {
          matchedMap.set(pc.id, {
            id: pc.id,
            phoneNumber: pc.phoneNumber,
            durationSeconds: pc.durationSeconds,
            connected: pc.connected,
            outcomeId: pc.outcomeId,
            outcomeLabel: pc.outcomeLabel,
            notes: pc.notes,
            startedAt: pc.startedAt.toISOString(),
          });
        }
      }
    }

    const allCalls = Array.from(matchedMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    const totalCallDurationSeconds = allCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    return {
      ...l,
      name: isHr ? `Confidential Lead (${l.leadCode})` : l.name,
      phoneNumber: isHr ? '***-***-****' : l.phoneNumber,
      email: isHr ? null : l.email,
      company: isHr ? 'Redacted' : l.company,
      notes: isHr ? null : l.notes,
      assignedAt: l.assignedAt ? l.assignedAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      callLogs: allCalls.map((ac) => ({
        ...ac,
        phoneNumber: isHr ? '***-***-****' : ac.phoneNumber,
        notes: isHr ? null : ac.notes,
      })),
      totalCallDurationSeconds,
      callCount: allCalls.length,
    };
  });

  const formattedCallLogs = employee.callLogs.map((c) => ({
    ...c,
    phoneNumber: isHr ? '***-***-****' : c.phoneNumber,
    contactName: isHr ? (c.lead ? `Lead ${c.lead.leadCode}` : 'Confidential Contact') : c.contactName,
    notes: isHr ? null : c.notes,
    lead: c.lead
      ? {
          ...c.lead,
          name: isHr ? `Lead ${c.lead.leadCode}` : c.lead.name,
        }
      : null,
    startedAt: c.startedAt.toISOString(),
    endedAt: c.endedAt ? c.endedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));

  const isTargetCeo = employee.role === Role.CEO || isAllowedCeoEmail(employee.email);
  const isTargetHr = employee.role === Role.HR;
  const isViewerHr = admin.role === Role.HR;
  const canManage =
    (admin.role === Role.CEO || admin.role === Role.HR) &&
    !isTargetCeo &&
    !(isViewerHr && isTargetHr);

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
      <EmployeeDetailView
        employee={formattedEmployee}
        leads={formattedLeads}
        leadStatusCounts={leadStatusCounts}
        callLogs={formattedCallLogs}
        canManage={canManage}
      />
    </main>
  );
}
