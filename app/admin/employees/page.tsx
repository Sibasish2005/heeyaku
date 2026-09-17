import React from 'react';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import EmployeeTable from '@/components/admin/employees/EmployeeTable';

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
  let formattedEmployees: any[] = [];

  try {
    const [total, active, assigned, initialEmployeesList] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { assignedEmployeeId: { not: null } } }),
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
            },
          },
        },
      }),
    ]);

    totalEmployees = total;
    activeEmployees = active;
    totalAssignedLeads = assigned;
    formattedEmployees = initialEmployeesList.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error loading employees in EmployeesPage:', error);
  }

  const inactiveEmployees = Math.max(0, totalEmployees - activeEmployees);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Total Staff</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalEmployees}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Active Members</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{activeEmployees}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Deactivated</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{inactiveEmployees}</div>
        </div>

        <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
          <div className="text-xs font-semibold text-muted-foreground">Assigned Leads</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{totalAssignedLeads}</div>
        </div>
      </div>

      {/* Main Table View */}
      <EmployeeTable
        initialEmployees={formattedEmployees}
        totalEmployeesCount={totalEmployees}
      />
    </main>
  );
}
