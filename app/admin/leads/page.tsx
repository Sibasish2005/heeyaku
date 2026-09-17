import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import LeadTable from '@/components/admin/leads/LeadTable';

export const metadata = {
  title: 'Leads CRM Pipeline | HEEYAKU Admin',
  description: 'Manage prospect pipelines, status transitions, and tele-caller distribution.',
};

export const dynamic = 'force-dynamic';

interface LeadsPageProps {
  searchParams: Promise<{
    employeeId?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  await assertAdminAccess();
  const { employeeId } = await searchParams;

  const [leads, activeEmployees] = await Promise.all([
    prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
          },
        },
      },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        team: true,
      },
    }),
  ]);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'NEW').length;
  const activePipeline = leads.filter((l) =>
    ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'].includes(l.status)
  ).length;
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;

  const formattedLeads = leads.map((l) => ({
    ...l,
    assignedAt: l.assignedAt ? l.assignedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#2563EB] dark:text-blue-400 uppercase mb-1">
            Admissions & Sales CRM Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Leads Management
          </h1>
        </div>
      </div>

      {/* Unified Metric Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Total Leads</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalLeads.toLocaleString()}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">New Inquiries</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{newLeads.toLocaleString()}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">In Discussion</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{activePipeline.toLocaleString()}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Enrolled / Converted</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{convertedLeads.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Table View */}
      <LeadTable
        initialLeads={formattedLeads}
        activeEmployees={activeEmployees}
        initialEmployeeFilter={employeeId}
      />
    </main>
  );
}
