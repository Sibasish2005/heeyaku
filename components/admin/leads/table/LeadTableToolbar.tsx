'use client';

import React from 'react';
import { Search, Plus, Upload, Download, Filter, RotateCcw, X, FileSpreadsheet, Bot, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { ActiveEmployee } from './types';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

interface LeadTableToolbarProps {
  searchQuery: string;
  statusFilter: string;
  assignmentFilter: 'ALL' | 'ASSIGNED' | 'UNASSIGNED';
  employeeFilter: string;
  activeEmployees: ActiveEmployee[];
  totalFiltered?: number;
  totalCount?: number;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (mode: 'cards' | 'table') => void;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onAssignmentChange: (val: 'ALL' | 'ASSIGNED' | 'UNASSIGNED') => void;
  onEmployeeChange: (val: string) => void;
  onResetFilters?: () => void;
  onExport: (format: 'xlsx' | 'csv') => void;
  onCreateOpen: () => void;
  onImportOpen: () => void;
  onAutoAssignOpen: () => void;
  onSyncSheets?: () => void;
  isSyncingSheets?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP', label: 'Follow-up needed' },
  { value: 'CALL_BACK', label: 'Call back later' },
  { value: 'NOT_INTERESTED', label: 'Not interested' },
  { value: 'NO_ANSWER', label: 'No answer' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'WRONG_NUMBER', label: 'Wrong number' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'NOT_QUALIFIED', label: 'Not qualified' },
  { value: 'OTHER', label: 'Other' },
];

const ASSIGNMENT_OPTIONS = [
  { value: 'ALL', label: 'All Assignments' },
  { value: 'ASSIGNED', label: 'Assigned Only' },
  { value: 'UNASSIGNED', label: 'Unassigned Only' },
];

export default function LeadTableToolbar({
  searchQuery,
  statusFilter,
  assignmentFilter,
  employeeFilter,
  activeEmployees,
  totalFiltered,
  totalCount,
  viewMode,
  onViewModeChange,
  onSearchChange,
  onStatusChange,
  onAssignmentChange,
  onEmployeeChange,
  onResetFilters,
  onExport,
  onCreateOpen,
  onImportOpen,
  onAutoAssignOpen,
  onSyncSheets,
  isSyncingSheets = false,
}: LeadTableToolbarProps) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    assignmentFilter !== 'UNASSIGNED' ||
    employeeFilter !== 'ALL';

  const employeeOptions = [
    { value: 'ALL', label: 'All Associates' },
    { value: 'UNASSIGNED', label: 'Unassigned (Pool)' },
    ...activeEmployees.map((emp) => ({
      value: emp.id,
      label: `${emp.name} (${emp.employeeCode})`,
    })),
  ];

  return (
    <div className="bg-card text-card-foreground p-3 sm:p-4 rounded-2xl border border-border shadow-2xs space-y-3">
      {/* Tier 1: Search Bar & Primary Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads by name, phone, code, school..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-end">
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold text-foreground bg-card hover:bg-muted/60 border border-border rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-30 animate-in fade-in-50">
              <div className="bg-card rounded-xl border border-border shadow-xl py-1 w-44 text-xs font-medium divide-y divide-border">
                <button
                  type="button"
                  onClick={() => onExport('xlsx')}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 text-foreground flex items-center justify-between cursor-pointer"
                >
                  <span>Export to Excel</span>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExport('csv')}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 text-foreground flex items-center justify-between cursor-pointer"
                >
                  <span>Export to CSV</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">.csv</span>
                </button>
              </div>
            </div>
          </div>

          {onSyncSheets && (
            <button
              type="button"
              onClick={onSyncSheets}
              disabled={isSyncingSheets}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-60 border border-emerald-500/20 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Sync leads directly from your connected Google Sheet"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onImportOpen}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold text-foreground bg-card hover:bg-muted/60 border border-border rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={onAutoAssignOpen}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Auto Assign</span>
          </button>

          <button
            type="button"
            onClick={onCreateOpen}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-initial"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Dedicated Filter Controls, Live Count & View Mode */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Filters:</span>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[140px] lg:w-40">
            <ShadcnDropdownSelect
              value={statusFilter}
              onValueChange={onStatusChange}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[140px] lg:w-38">
            <ShadcnDropdownSelect
              value={assignmentFilter}
              onValueChange={(val) => onAssignmentChange(val as 'ALL' | 'ASSIGNED' | 'UNASSIGNED')}
              options={ASSIGNMENT_OPTIONS}
            />
          </div>

          {activeEmployees.length > 0 && (
            <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48 col-span-1 sm:col-span-2 lg:col-span-1">
              <ShadcnDropdownSelect
                value={employeeFilter}
                onValueChange={onEmployeeChange}
                options={employeeOptions}
              />
            </div>
          )}

          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl border border-border/70 hover:border-border transition-colors cursor-pointer w-full sm:w-auto"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
          {totalFiltered !== undefined && totalCount !== undefined && (
            <div className="text-xs text-muted-foreground font-medium shrink-0">
              Showing <span className="font-mono font-bold text-foreground">{totalFiltered.toLocaleString()}</span> of{' '}
              <span className="font-mono font-bold text-foreground">{totalCount.toLocaleString()}</span> leads
            </div>
          )}

          {onViewModeChange && (
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-background text-[#2563EB] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Card View"
                aria-label="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-background text-[#2563EB] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
