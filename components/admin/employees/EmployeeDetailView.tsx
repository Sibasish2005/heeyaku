'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResetPasswordDialog from './ResetPasswordDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import EmployeeHeroCard from './detail/EmployeeHeroCard';
import EmployeeKpiCards from './detail/EmployeeKpiCards';
import EmployeeTimeframeSelector from './detail/EmployeeTimeframeSelector';
import EmployeePipelineFilters from './detail/EmployeePipelineFilters';
import EmployeeAssignedLeadsTable from './detail/EmployeeAssignedLeadsTable';
import { LeadItem, PIPELINE_STATUSES, STATUS_BADGE_STYLES, TimeFrame } from './detail/types';
import { toggleEmployeeStatusAction } from '@/app/admin/employees/actions';
import { downloadLeadsAsCsv, downloadLeadsAsXlsx } from '@/lib/lead/export';

export type { LeadItem } from './detail/types';

interface EmployeeDetailProps {
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phoneNumber: string;
    team: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  leads: LeadItem[];
  leadStatusCounts?: Record<string, number>;
}

export default function EmployeeDetailView({
  employee: initialEmployee,
  leads,
}: EmployeeDetailProps) {
  const [employee, setEmployee] = useState(initialEmployee);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeFrame>('TODAY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchLead, setSearchLead] = useState('');

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const res = await toggleEmployeeStatusAction(employee.id);
      if (res.success && res.data) {
        setEmployee((prev) => ({ ...prev, isActive: res.data!.isActive }));
      }
    } finally {
      setIsToggling(false);
    }
  };

  const { todayLeads, monthLeads, activePeriodLeads } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isMatch = (l: LeadItem, targetDate: Date) => {
      const assigned = l.assignedAt ? new Date(l.assignedAt) : null;
      const updated = l.updatedAt ? new Date(l.updatedAt) : null;
      const created = l.createdAt ? new Date(l.createdAt) : null;
      return Boolean(
        (assigned && assigned >= targetDate) ||
        (updated && updated >= targetDate) ||
        (created && created >= targetDate)
      );
    };

    const today = leads.filter((l) => isMatch(l, startOfToday));
    const month = leads.filter((l) => isMatch(l, startOfMonth));
    const active = timeframe === 'TODAY' ? today : timeframe === 'MONTH' ? month : leads;

    return { todayLeads: today, monthLeads: month, activePeriodLeads: active };
  }, [leads, timeframe]);

  const activeStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of activePeriodLeads) {
      counts[l.status] = (counts[l.status] || 0) + 1;
    }
    return counts;
  }, [activePeriodLeads]);

  const totalAssigned = activePeriodLeads.length;
  const inDiscussion = activePeriodLeads.filter((l) =>
    ['CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CALL_BACK'].includes(l.status)
  ).length;
  const converted = activePeriodLeads.filter((l) => l.status === 'CONVERTED').length;
  const conversionRate = totalAssigned > 0 ? ((converted / totalAssigned) * 100).toFixed(1) : '0.0';

  const filteredLeads = activePeriodLeads.filter((l) => {
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSearch =
      l.name.toLowerCase().includes(searchLead.toLowerCase()) ||
      l.phoneNumber.includes(searchLead) ||
      l.leadCode.toLowerCase().includes(searchLead.toLowerCase()) ||
      Boolean(l.company && l.company.toLowerCase().includes(searchLead.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleExportEmployeeLeads = (format: 'xlsx' | 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData = filteredLeads.map((l) => ({
      leadCode: l.leadCode,
      name: l.name,
      phoneNumber: l.phoneNumber,
      email: l.email,
      company: l.company,
      source: l.source,
      status: l.status,
      assignedEmployeeCode: employee.employeeCode,
      assignedEmployeeName: employee.name,
      assignedAt: l.assignedAt,
      createdAt: l.createdAt,
      notes: null,
    }));

    if (format === 'xlsx') {
      downloadLeadsAsXlsx(exportData, `HEEYAKU_Leads_${employee.employeeCode}_${timeframe}_${timestamp}.xlsx`);
    } else {
      downloadLeadsAsCsv(exportData, `HEEYAKU_Leads_${employee.employeeCode}_${timeframe}_${timestamp}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      <EmployeeHeroCard
        employee={employee}
        isToggling={isToggling}
        onEdit={() => setIsEditOpen(true)}
        onResetPassword={() => setIsResetOpen(true)}
        onToggleStatus={handleToggleStatus}
      />

      <EmployeeTimeframeSelector
        timeframe={timeframe}
        onSelectTimeframe={(tf) => {
          setTimeframe(tf);
          setStatusFilter('ALL');
        }}
        counts={{
          today: todayLeads.length,
          month: monthLeads.length,
          lifetime: leads.length,
        }}
      />

      <EmployeeKpiCards
        totalAssigned={totalAssigned}
        inDiscussion={inDiscussion}
        converted={converted}
        conversionRate={conversionRate}
      />

      <EmployeePipelineFilters
        statusFilter={statusFilter}
        totalAssigned={totalAssigned}
        leadStatusCounts={activeStatusCounts}
        pipelineStatuses={PIPELINE_STATUSES}
        onSelectStatus={setStatusFilter}
      />

      <EmployeeAssignedLeadsTable
        filteredLeads={filteredLeads}
        statusFilter={statusFilter}
        searchLead={searchLead}
        employeeId={employee.id}
        statusBadgeStyles={STATUS_BADGE_STYLES}
        onSearchChange={setSearchLead}
        onExport={handleExportEmployeeLeads}
      />

      <ResetPasswordDialog
        isOpen={isResetOpen}
        employee={employee}
        onClose={() => setIsResetOpen(false)}
      />

      <EditEmployeeDialog
        isOpen={isEditOpen}
        employee={employee}
        onClose={() => setIsEditOpen(false)}
        onUpdated={() => window.location.reload()}
      />
    </div>
  );
}
