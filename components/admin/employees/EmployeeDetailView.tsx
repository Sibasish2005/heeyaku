'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, PhoneCall, Users } from 'lucide-react';
import ResetPasswordDialog from './ResetPasswordDialog';
import EditEmployeeDialog from './EditEmployeeDialog';
import EmployeeHeroCard from './detail/EmployeeHeroCard';
import EmployeeCallStatsCards from './detail/EmployeeCallStatsCards';
import EmployeeCallOutcomesBreakdown from './detail/EmployeeCallOutcomesBreakdown';
import EmployeeCallLogsTable from './detail/EmployeeCallLogsTable';
import EmployeeTimeframeSelector from './detail/EmployeeTimeframeSelector';
import EmployeePipelineFilters from './detail/EmployeePipelineFilters';
import EmployeeAssignedLeadsTable from './detail/EmployeeAssignedLeadsTable';
import { CallLogItem, LeadItem, PIPELINE_STATUSES, STATUS_BADGE_STYLES, TimeFrame } from './detail/types';
import { toggleEmployeeStatusAction } from '@/app/admin/employees/actions';
import { downloadLeadsAsCsv, downloadLeadsAsXlsx } from '@/lib/lead/export';

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
  callLogs?: CallLogItem[];
  leadStatusCounts?: Record<string, number>;
}

export default function EmployeeDetailView({
  employee: initialEmployee,
  leads,
  callLogs = [],
}: EmployeeDetailProps) {
  const [employee, setEmployee] = useState(initialEmployee);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeFrame>('TODAY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchLead, setSearchLead] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'calls'>('leads');

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

  const { activePeriodLeads, activePeriodCalls, todayCount, monthCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isMatch = (isoDate: string | null | undefined, target: Date) =>
      Boolean(isoDate && new Date(isoDate) >= target);

    const todayLeads = leads.filter(l => isMatch(l.assignedAt || l.updatedAt || l.createdAt, startOfToday));
    const monthLeads = leads.filter(l => isMatch(l.assignedAt || l.updatedAt || l.createdAt, startOfMonth));
    const targetLeads = timeframe === 'TODAY' ? todayLeads : timeframe === 'MONTH' ? monthLeads : leads;

    const todayCalls = callLogs.filter(c => isMatch(c.startedAt, startOfToday));
    const monthCalls = callLogs.filter(c => isMatch(c.startedAt, startOfMonth));
    const targetCalls = timeframe === 'TODAY' ? todayCalls : timeframe === 'MONTH' ? monthCalls : callLogs;

    return {
      activePeriodLeads: targetLeads,
      activePeriodCalls: targetCalls,
      todayCount: todayLeads.length,
      monthCount: monthLeads.length,
    };
  }, [leads, callLogs, timeframe]);

  // Calling KPIs
  const totalCalls = activePeriodCalls.length;
  const connectedCalls = activePeriodCalls.filter(c => c.connected || c.durationSeconds > 0).length;
  const connectionRate = totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(1) : '0.0';
  const totalTalkTimeSeconds = activePeriodCalls.reduce((acc, c) => acc + c.durationSeconds, 0);
  const averageTalkTimeSeconds = connectedCalls > 0 ? Math.round(totalTalkTimeSeconds / connectedCalls) : 0;

  const outcomeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of activePeriodCalls) {
      if (c.outcomeId) map[c.outcomeId] = (map[c.outcomeId] || 0) + 1;
    }
    return map;
  }, [activePeriodCalls]);

  // Lead Pipeline KPIs
  const activeStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of activePeriodLeads) counts[l.status] = (counts[l.status] || 0) + 1;
    return counts;
  }, [activePeriodLeads]);

  const convertedLeads = activePeriodLeads.filter(l => l.status === 'CONVERTED').length;
  const conversionRate = activePeriodLeads.length > 0
    ? ((convertedLeads / activePeriodLeads.length) * 100).toFixed(1)
    : '0.0';

  const filteredLeads = activePeriodLeads.filter((l) => {
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const q = searchLead.toLowerCase();
    const matchSearch =
      l.name.toLowerCase().includes(q) ||
      l.phoneNumber.includes(q) ||
      l.leadCode.toLowerCase().includes(q) ||
      Boolean(l.company && l.company.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const handleExport = (format: 'xlsx' | 'csv') => {
    const ts = new Date().toISOString().split('T')[0];
    const data = filteredLeads.map(l => ({
      ...l,
      assignedEmployeeCode: employee.employeeCode,
      assignedEmployeeName: employee.name,
      notes: null,
    }));
    const fn = `HEEYAKU_Leads_${employee.employeeCode}_${timeframe}_${ts}`;
    if (format === 'xlsx') downloadLeadsAsXlsx(data, `${fn}.xlsx`);
    else downloadLeadsAsCsv(data, `${fn}.csv`);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Employee Directory</span>
      </Link>

      <EmployeeHeroCard
        employee={employee}
        isToggling={isToggling}
        onEdit={() => setIsEditOpen(true)}
        onResetPassword={() => setIsResetOpen(true)}
        onToggleStatus={handleToggleStatus}
      />

      <EmployeeTimeframeSelector
        timeframe={timeframe}
        onSelectTimeframe={(tf) => { setTimeframe(tf); setStatusFilter('ALL'); }}
        counts={{ today: todayCount, month: monthCount, lifetime: leads.length }}
      />

      {/* Mobile Telephony Analytical KPI Cards */}
      <EmployeeCallStatsCards
        totalCalls={totalCalls}
        connectedCalls={connectedCalls}
        connectionRate={connectionRate}
        totalTalkTimeSeconds={totalTalkTimeSeconds}
        averageTalkTimeSeconds={averageTalkTimeSeconds}
        convertedLeads={convertedLeads}
        conversionRate={conversionRate}
      />

      {/* Outcome Distribution */}
      <EmployeeCallOutcomesBreakdown
        totalCalls={totalCalls}
        outcomeDistribution={outcomeDistribution}
      />

      {/* View Switcher: Assigned Leads vs Call History */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'leads'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Assigned Leads ({filteredLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'calls'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Mobile Call Logs ({activePeriodCalls.length})</span>
        </button>
      </div>

      {activeTab === 'leads' ? (
        <>
          <EmployeePipelineFilters
            statusFilter={statusFilter}
            totalAssigned={activePeriodLeads.length}
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
            onExport={handleExport}
          />
        </>
      ) : (
        <EmployeeCallLogsTable callLogs={activePeriodCalls} />
      )}

      <ResetPasswordDialog isOpen={isResetOpen} employee={employee} onClose={() => setIsResetOpen(false)} />
      <EditEmployeeDialog isOpen={isEditOpen} employee={employee} onClose={() => setIsEditOpen(false)} onUpdated={() => window.location.reload()} />
    </div>
  );
}
