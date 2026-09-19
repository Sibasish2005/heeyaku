import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
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
  await assertAdminAccess();
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
          assignedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      callLogs: {
        where: {
          leadId: { not: null },
        },
        orderBy: {
          startedAt: 'desc',
        },
        select: {
          id: true,
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

  const formattedLeads = employee.leads.map((l) => ({
    ...l,
    assignedAt: l.assignedAt ? l.assignedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const formattedCallLogs = employee.callLogs.map((c) => ({
    ...c,
    startedAt: c.startedAt.toISOString(),
    endedAt: c.endedAt ? c.endedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
      <EmployeeDetailView
        employee={formattedEmployee}
        leads={formattedLeads}
        leadStatusCounts={leadStatusCounts}
        callLogs={formattedCallLogs}
      />
    </main>
  );

}
