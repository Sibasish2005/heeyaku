'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Search, Download, ExternalLink } from 'lucide-react';
import { LeadItem } from './types';
import InfiniteScrollSentinel from '@/components/admin/common/InfiniteScrollSentinel';
import { getEmployeeAssignedLeadsColumns } from './employeeAssignedLeadsColumns';

interface EmployeeAssignedLeadsTableProps {
  filteredLeads: LeadItem[];
  statusFilter: string;
  searchLead: string;
  employeeId: string;
  statusBadgeStyles: Record<string, string>;
  onSearchChange: (value: string) => void;
  onExport: (format: 'xlsx' | 'csv') => void;
}

export default function EmployeeAssignedLeadsTable({
  filteredLeads,
  statusFilter,
  searchLead,
  employeeId,
  statusBadgeStyles,
  onSearchChange,
  onExport,
}: EmployeeAssignedLeadsTableProps) {
  const CHUNK_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [statusFilter, searchLead]);

  const columns = useMemo(
    () => getEmployeeAssignedLeadsColumns(statusBadgeStyles),
    [statusBadgeStyles]
  );

  const visibleLeads = useMemo(
    () => filteredLeads.slice(0, visibleCount),
    [filteredLeads, visibleCount]
  );

  const table = useReactTable({
    data: visibleLeads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border overflow-hidden space-y-0">
      {/* Crisp Table Header */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <span>Assigned Prospects</span>
            <span className="font-mono text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            </span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {statusFilter === 'ALL' 
              ? 'Prospects assigned to this Business Development Associate' 
              : `Filtered by: ${statusFilter}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchLead}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg outline-hidden focus:bg-background focus:border-[#2563EB] font-medium transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-30 animate-in fade-in-50">
              <div className="bg-popover text-popover-foreground rounded-xl border border-border shadow-xl py-1 w-44 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => onExport('xlsx')}
                  className="w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between cursor-pointer"
                >
                  <span>Export to Excel</span>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExport('csv')}
                  className="w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between cursor-pointer"
                >
                  <span>Export to CSV</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">.csv</span>
                </button>
              </div>
            </div>
          </div>

          <Link
            href={`/admin/leads?employeeId=${employeeId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border border-[#2563EB]/20 rounded-lg transition-colors"
          >
            <span>Open CRM</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* TanStack Table - Sticky 10-row container */}
      <div
        ref={scrollContainerRef}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop - clientHeight < 120 && visibleCount < filteredLeads.length) {
            setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredLeads.length));
          }
        }}
        className="overflow-x-auto overflow-y-auto max-h-[490px] relative scroll-smooth divide-y divide-border"
      >
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs border-b border-border shadow-2xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-2.5 px-3 first:pl-4 last:pr-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-muted-foreground text-xs">
                  No leads found matching current criteria.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors whitespace-nowrap">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5 px-3 first:pl-4 last:pr-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InfiniteScrollSentinel
        hasMore={visibleCount < filteredLeads.length}
        onLoadMore={() => setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredLeads.length))}
        totalCount={filteredLeads.length}
        currentCount={visibleLeads.length}
        itemName="leads"
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  );
}
