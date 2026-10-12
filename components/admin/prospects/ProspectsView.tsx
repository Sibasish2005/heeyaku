'use client';

import React, { useState, useMemo } from 'react';
import { Search, Target, Filter, CheckCircle2, PhoneCall, TrendingUp, Users, ArrowUpRight, Clock } from 'lucide-react';
import { ProspectItem, TeamLeadSummary, PROSPECT_STATUS_META } from './types';
import ProspectTableRow from './ProspectTableRow';
import ProspectUpdateDialog from './ProspectUpdateDialog';
import { LeadStatus } from '@prisma/client';

interface ProspectsViewProps {
  initialProspects: ProspectItem[];
  teamLeadSummaries: TeamLeadSummary[];
  currentUserRole: string;
  currentUserId: string;
  currentUserName: string;
}

export default function ProspectsView({
  initialProspects,
  teamLeadSummaries,
  currentUserRole,
  currentUserId,
  currentUserName,
}: ProspectsViewProps) {
  const isCeo = currentUserRole === 'CEO';
  const [prospects, setProspects] = useState<ProspectItem[]>(initialProspects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTlId, setSelectedTlId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingProspect, setEditingProspect] = useState<ProspectItem | null>(null);

  // Filtered dataset
  const filteredProspects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return prospects.filter((p) => {
      // 1. Text search
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phoneNumber.includes(q) ||
        p.leadCode.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q)) ||
        (p.originalBda && p.originalBda.name.toLowerCase().includes(q)) ||
        (p.assignedEmployee && p.assignedEmployee.name.toLowerCase().includes(q));

      // 2. Team Lead filter (for CEO)
      const matchTl =
        selectedTlId === 'ALL' ||
        p.assignedEmployeeId === selectedTlId ||
        (p.team && p.team.id === selectedTlId);

      // 3. Status filter
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchTl && matchStatus;
    });
  }, [prospects, searchQuery, selectedTlId, statusFilter]);

  // Aggregate metrics
  const totalCount = prospects.length;
  const inPipelineCount = prospects.filter((p) =>
    ['INTERESTED', 'CALL_BACK', 'FOLLOW_UP'].includes(p.status)
  ).length;
  const convertedCount = prospects.filter((p) => p.status === 'CONVERTED').length;
  const closingRate =
    totalCount > 0 ? ((convertedCount / totalCount) * 100).toFixed(1) : '0.0';

  const handleUpdateSuccess = (updated: { id: string; status: LeadStatus; updatedNotes: string | null }) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...p,
              status: updated.status,
              notes: updated.updatedNotes,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
            <Target className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{isCeo ? 'High-Intent Pipeline' : 'Team Lead Command Center'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {isCeo ? 'Prospects Pipeline & Closing Matrix' : 'My Assigned Prospects'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isCeo
              ? 'Company-wide prospects qualified by BDAs and handed over to Team Leads for final closing.'
              : `Qualified high-interest leads handed over to you (${currentUserName}) for callbacks, demos, and closing.`}
          </p>
        </div>

        {/* Global Pipeline Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-foreground">{inPipelineCount} Active In-Flight</span>
          </div>
        </div>
      </div>

      {/* CEO View: TL-Wise Performance Matrix Cards */}
      {isCeo && teamLeadSummaries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Team Lead Prospects Breakdown</span>
            </h2>
            <span className="text-[11px] text-muted-foreground">Click a Team Lead card to filter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {teamLeadSummaries.map((tl) => {
              const isSelected = selectedTlId === tl.id;

              return (
                <button
                  key={tl.id}
                  type="button"
                  onClick={() => setSelectedTlId(isSelected ? 'ALL' : tl.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#2563EB]/5 shadow-sm ring-1 ring-[#2563EB]'
                      : 'border-border/70 bg-card hover:border-border hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground">{tl.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">({tl.employeeCode})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {tl.teamName ? `Squad ${tl.teamName}` : 'Squad Lead'}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                      {tl.conversionRate}%
                    </span>
                  </div>

                  {/* Numbers row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50 text-center">
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase font-bold">Total</span>
                      <span className="font-mono text-xs font-extrabold text-foreground">{tl.totalProspects}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase font-bold">In-Flight</span>
                      <span className="font-mono text-xs font-extrabold text-cyan-600 dark:text-cyan-400">
                        {tl.inPipeline}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase font-bold">Closed</span>
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {tl.converted}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Lead View: Personal Metric Summary Cards */}
      {!isCeo && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border/70">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Prospects Handed Over
            </span>
            <span className="text-2xl font-black text-foreground font-mono mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">From your squad BDAs</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/70">
            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
              Active In-Flight
            </span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">
              {inPipelineCount}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Callbacks & Interested</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/70">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Deals Closed & Converted
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {convertedCount}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Successfully closed deals</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/70">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Closing Conversion Rate
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">
              {closingRate}%
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Converted / Total</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/70">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prospects by name, phone, BDA, or company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* TL Filter Dropdown (CEO Only) */}
          {isCeo && teamLeadSummaries.length > 0 && (
            <select
              value={selectedTlId}
              onChange={(e) => setSelectedTlId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="ALL">All Team Leads</option>
              {teamLeadSummaries.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.name} ({tl.teamName || 'Squad Lead'})
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="INTERESTED">Interested</option>
            <option value="CALL_BACK">Call Back</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="CONVERTED">Converted (Won)</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="NOT_QUALIFIED">Not Qualified</option>
          </select>
        </div>
      </div>

      {/* Prospects Data Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Lead Code</th>
                <th className="py-2.5 px-3">Prospect Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Qualified By (BDA)</th>
                {isCeo && <th className="py-2.5 px-3">Assigned TL</th>}
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Updated</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td
                    colSpan={isCeo ? 8 : 7}
                    className="py-12 text-center text-xs text-muted-foreground"
                  >
                    <Target className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="font-medium text-foreground text-sm">No prospects found.</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {searchQuery || statusFilter !== 'ALL' || selectedTlId !== 'ALL'
                        ? 'Try clearing your filters or search keywords.'
                        : 'Prospects will appear here automatically when BDAs mark calls as Interested or Call Back.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProspects.map((prospect) => (
                  <ProspectTableRow
                    key={prospect.id}
                    prospect={prospect}
                    showTeamLeadColumn={isCeo}
                    onEditStatus={(p) => setEditingProspect(p)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filteredProspects.length}</strong> of{' '}
            <strong className="text-foreground">{prospects.length}</strong> total prospects
          </span>
          <span className="font-mono text-[11px]">
            {convertedCount} Closed Deals ({closingRate}% Conversion)
          </span>
        </div>
      </div>

      {/* Manual Status Update Dialog */}
      <ProspectUpdateDialog
        prospect={editingProspect}
        isOpen={Boolean(editingProspect)}
        onClose={() => setEditingProspect(null)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}
