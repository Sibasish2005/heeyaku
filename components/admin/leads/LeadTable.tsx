'use client';

import React, { useMemo, useState } from 'react';
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import LeadTableToolbar from './table/LeadTableToolbar';
import LeadTableFloatingBar from './table/LeadTableFloatingBar';
import LeadTableHead from './table/LeadTableHead';
import LeadTableRow from './table/LeadTableRow';
import LeadCard from './table/LeadCard';
import LeadTableModals from './table/LeadTableModals';
import TablePagination from '@/components/admin/common/TablePagination';
import { ActiveEmployee, LeadListItem } from './table/types';
import { exportLeadsDataset } from './table/exportHelper';
import { getLeadTableColumns } from './table/leadTableColumns';
import { unassignLeadsAction } from '@/app/admin/leads/assignment-actions';
import { syncGoogleSheetDirectAction } from '@/app/admin/leads/sync-sheet-action';
import { toast } from 'sonner';

export type { ActiveEmployee, LeadListItem } from './table/types';

interface LeadTableProps {
  initialLeads: LeadListItem[];
  activeEmployees: ActiveEmployee[];
  initialEmployeeFilter?: string;
}

export default function LeadTable({
  initialLeads,
  activeEmployees,
  initialEmployeeFilter,
}: LeadTableProps) {
  const [leads] = useState<LeadListItem[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>(
    initialEmployeeFilter ? 'ALL' : 'UNASSIGNED'
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>(initialEmployeeFilter || 'ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'auto'>('auto');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadListItem | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return leads.filter((lead) => {
      const matchSearch = lead.name.toLowerCase().includes(q) || lead.phoneNumber.includes(searchQuery) || (lead.email && lead.email.toLowerCase().includes(q)) || lead.leadCode.toLowerCase().includes(q) || (lead.company && lead.company.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchAssign = assignmentFilter === 'ALL' ? true : assignmentFilter === 'ASSIGNED' ? !!lead.assignedEmployeeId : !lead.assignedEmployeeId;
      const matchEmp = employeeFilter === 'ALL' ? true : employeeFilter === 'UNASSIGNED' ? !lead.assignedEmployeeId : lead.assignedEmployeeId === employeeFilter;
      return matchSearch && matchStatus && matchAssign && matchEmp;
    });
  }, [leads, searchQuery, statusFilter, assignmentFilter, employeeFilter]);

  const columns = useMemo(() => getLeadTableColumns(), []);

  const table = useReactTable({
    data: filteredLeads,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const visibleRows = table.getRowModel().rows;
  const visibleIds = useMemo(() => visibleRows.map((r) => r.original.id), [visibleRows]);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some((id) => selectedIds.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkUnassign = async () => {
    if (!confirm(`Are you sure you want to unassign ${selectedIds.length} lead(s)?`)) return;
    setIsUnassigning(true);
    try {
      const res = await unassignLeadsAction({ leadIds: selectedIds });
      if (res.success && res.data) {
        toast.success(`Successfully unassigned ${res.data.count} lead${res.data.count > 1 ? 's' : ''}.`);
        setSelectedIds([]);
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast.error(res.error || 'Failed to unassign leads.');
      }
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    const toastId = toast.loading('Syncing with Google Sheets...');
    try {
      const res = await syncGoogleSheetDirectAction();
      if (res.success) {
        if (res.count && res.count > 0) {
          toast.success(`Synced successfully! ${res.count} new lead(s) added from Google Sheet.`, { id: toastId });
          setTimeout(() => window.location.reload(), 600);
        } else {
          toast.success('Synced successfully! Leads are already up to date.', { id: toastId });
        }
      } else {
        toast.error(res.error || 'Something went wrong while syncing. Please try again.', { id: toastId, duration: 4000 });
      }
    } catch (err) {
      toast.error('Something went wrong while syncing. Please try again.', { id: toastId, duration: 4000 });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <LeadTableFloatingBar
        selectedCount={selectedIds.length}
        isUnassigning={isUnassigning}
        onAssignOpen={() => setIsBulkAssignOpen(true)}
        onBulkUnassign={handleBulkUnassign}
        onExportSelected={(fmt) => exportLeadsDataset(fmt, leads.filter((l) => selectedIds.includes(l.id)), `Selected_${selectedIds.length}`)}
        onClearSelection={() => setSelectedIds([])}
      />

      <LeadTableToolbar
        searchQuery={searchQuery} statusFilter={statusFilter}
        assignmentFilter={assignmentFilter} employeeFilter={employeeFilter}
        activeEmployees={activeEmployees} totalFiltered={filteredLeads.length} totalCount={leads.length}
        viewMode={viewMode === 'auto' ? undefined : viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        onSearchChange={setSearchQuery} onStatusChange={setStatusFilter}
        onAssignmentChange={setAssignmentFilter} onEmployeeChange={setEmployeeFilter}
        onResetFilters={() => { setSearchQuery(''); setStatusFilter('ALL'); setAssignmentFilter('UNASSIGNED'); setEmployeeFilter('ALL'); }}
        onExport={(fmt) => exportLeadsDataset(fmt, filteredLeads, 'Filtered')}
        onCreateOpen={() => setIsCreateOpen(true)}
        onImportOpen={() => setIsImportOpen(true)}
        onAutoAssignOpen={() => setIsAutoAssignOpen(true)}
        onSyncSheets={handleSyncSheets}
        isSyncingSheets={isSyncingSheets}
      />

      {/* Mobile Card List View (visible on screens < md, or when viewMode === 'cards') */}
      <div className={`space-y-3 ${viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'}`}>
        {/* Mobile Batch Selection Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-card rounded-2xl border border-border text-xs shadow-2xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
            <input
              type="checkbox"
              checked={isAllVisibleSelected}
              ref={(input) => {
                if (input) input.indeterminate = isSomeVisibleSelected;
              }}
              onChange={handleToggleSelectVisible}
              className="w-4 h-4 rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Select page ({visibleRows.length})</span>
          </label>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[11px] font-bold text-[#2563EB] dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear ({selectedIds.length})
            </button>
          )}
        </div>

        {visibleRows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border text-xs">
            No leads match your current search and filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRows.map((row) => (
              <LeadCard
                key={row.original.id}
                lead={row.original}
                isSelected={selectedIds.includes(row.original.id)}
                onToggleSelect={() =>
                  setSelectedIds((prev) =>
                    prev.includes(row.original.id)
                      ? prev.filter((i) => i !== row.original.id)
                      : [...prev, row.original.id]
                  )
                }
                onEdit={() => setEditingLead(row.original)}
                onQuickAssign={() => {
                  setSelectedIds([row.original.id]);
                  setIsBulkAssignOpen(true);
                }}
              />
            ))}
          </div>
        )}

        <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xs overflow-hidden">
          <TablePagination table={table} itemName="leads" />
        </div>
      </div>

      {/* Desktop Spreadsheet Table View (visible on screens >= md, or when viewMode === 'table') */}
      <div className={`bg-card text-card-foreground rounded-2xl border border-border shadow-2xs overflow-hidden flex-col ${viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'flex' : 'hidden md:flex'}`}>
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] min-h-[400px] relative scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <LeadTableHead
              isAllVisibleSelected={isAllVisibleSelected}
              isSomeVisibleSelected={isSomeVisibleSelected}
              onToggleSelectVisible={handleToggleSelectVisible}
            />
            <tbody className="divide-y divide-border">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    No leads match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <LeadTableRow
                    key={row.original.id}
                    lead={row.original}
                    isSelected={selectedIds.includes(row.original.id)}
                    onToggleSelect={() => setSelectedIds((prev) => prev.includes(row.original.id) ? prev.filter((i) => i !== row.original.id) : [...prev, row.original.id])}
                    onEdit={() => setEditingLead(row.original)}
                    onQuickAssign={() => {
                      setSelectedIds([row.original.id]);
                      setIsBulkAssignOpen(true);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination table={table} itemName="leads" />
      </div>

      <LeadTableModals
        isCreateOpen={isCreateOpen}
        editingLead={editingLead}
        isBulkAssignOpen={isBulkAssignOpen}
        isAutoAssignOpen={isAutoAssignOpen}
        isImportOpen={isImportOpen}
        selectedIds={selectedIds}
        activeEmployees={activeEmployees}
        onCloseCreate={() => setIsCreateOpen(false)}
        onCloseEdit={() => setEditingLead(null)}
        onCloseBulkAssign={() => setIsBulkAssignOpen(false)}
        onCloseAutoAssign={() => setIsAutoAssignOpen(false)}
        onCloseImport={() => setIsImportOpen(false)}
        onAssigned={(count, employeeName) => {
          toast.success(
            `Successfully assigned ${count} lead${count > 1 ? 's' : ''}${employeeName ? ` to ${employeeName}` : ''}.`
          );
          setSelectedIds([]);
          setTimeout(() => window.location.reload(), 600);
        }}
      />
    </div>
  );
}
