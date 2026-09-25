import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import LeadTable, { ActiveEmployee } from '@/components/admin/leads/LeadTable';

type LeadQueryResult = Prisma.LeadGetPayload<{
  include: {
    assignedEmployee: {
      select: {
        id: true;
        employeeCode: true;
        name: true;
      };
    };
  };
}>;

export const metadata = {
  title: 'Lead Management & CRM Pipeline | HEEYAKU Admin',
  description: 'Manage sales leads, assignments, and follow-ups.',
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

  let leads: LeadQueryResult[] = [];
  let activeEmployees: ActiveEmployee[] = [];

  let totalLeads = 0;
  let newLeads = 0;
  let activePipeline = 0;
  let convertedLeads = 0;

  try {
    const [
      fetchedLeads,
      fetchedEmployees,
      totalCount,
      newCount,
      activePipelineCount,
      convertedCount,
    ] = await Promise.all([
      prisma.lead.findMany({
        take: 2000,
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
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.lead.count({
        where: {
          status: { in: ['ASSIGNED', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] },
        },
      }),
      prisma.lead.count({ where: { status: 'CONVERTED' } }),
    ]);
    leads = fetchedLeads;
    activeEmployees = fetchedEmployees;
    totalLeads = totalCount;
    newLeads = newCount;
    activePipeline = activePipelineCount;
    convertedLeads = convertedCount;
  } catch (error) {
    console.error('Error loading leads in LeadsPage:', error);
  }

  const formattedLeads = leads.map((l) => ({
    ...l,
    assignedAt: l.assignedAt ? l.assignedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <main className="max-w-[1600px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 sm:pb-4 border-b border-border/80">
        <div>
          <div className="text-[10px] sm:text-xs font-bold tracking-widest text-[#2563EB] dark:text-blue-400 uppercase mb-1">
            Admissions & Sales CRM Pipeline
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
            Leads Management
          </h1>
        </div>
      </div>

      {/* Unified Metric Ribbon (Responsive 2x2 on mobile, 1x4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150 border-r border-b lg:border-b-0 border-border">
          <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Total Leads</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalLeads.toLocaleString()}</div>
        </div>

        <div className="p-3.5 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150 border-b lg:border-b-0 lg:border-r border-border">
          <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">New Inquiries</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">{newLeads.toLocaleString()}</div>
        </div>

        <div className="p-3.5 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150 border-r border-border">
          <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">In Discussion</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">{activePipeline.toLocaleString()}</div>
        </div>

        <div className="p-3.5 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Enrolled / Converted</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">{convertedLeads.toLocaleString()}</div>
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
