'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { TopEmployeeReport } from './TodayTopPerformerSpotlight';
import { ArrowUpDown, ArrowUpRight, Search } from 'lucide-react';
import InfiniteScrollSentinel from '@/components/admin/common/InfiniteScrollSentinel';

interface EmployeeReportTanstackTableProps {
  data: TopEmployeeReport[];
}

const columnHelper = createColumnHelper<TopEmployeeReport>();

export default function EmployeeReportTanstackTable({ data }: EmployeeReportTanstackTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalAssignedToday', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const CHUNK_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Business Development Associate',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted font-bold text-xs flex items-center justify-center text-foreground uppercase shrink-0">
              {row.name.charAt(0)}
            </div>
            <div className="min-w-0 flex items-baseline gap-1.5 whitespace-nowrap">
              <Link href={`/admin/employees/${row.id}`} className="font-bold text-xs text-foreground hover:text-[#2563EB] truncate">
                {row.name}
              </Link>
              <span className="font-mono text-[10px] text-muted-foreground font-semibold">({row.employeeCode})</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('team', {
      header: 'Team / Dept',
      cell: (info) => <span className="text-xs text-muted-foreground font-medium">{info.getValue() || 'Business Development Associates'}</span>,
    }),
    columnHelper.accessor('totalAssignedToday', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 font-bold text-xs text-muted-foreground hover:text-foreground cursor-pointer">
          <span>Assigned (Today)</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
        </button>
      ),
      cell: (info) => <span className="font-mono font-bold text-xs text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor('contactedToday', {
      header: 'Contacted (Today)',
      cell: (info) => <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor('convertedToday', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 font-bold text-xs text-muted-foreground hover:text-foreground cursor-pointer">
          <span>Converted (Today)</span>
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
        </button>
      ),
      cell: (info) => (
        <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('conversionRate', {
      header: 'Conversion Rate',
      cell: (info) => <span className="font-mono text-xs text-muted-foreground font-bold">{info.getValue()}%</span>,
    }),
    columnHelper.accessor('totalAssignedAllTime', {
      header: 'All-Time Leads',
      cell: (info) => <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <Link href={`/admin/employees/${info.row.original.id}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-[#2563EB] hover:bg-muted transition-colors inline-block" title="View associate profile">
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      ),
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: (updater) => {
      setSorting(updater);
      setVisibleCount(CHUNK_SIZE);
    },
    onGlobalFilterChange: (val) => {
      setGlobalFilter(val);
      setVisibleCount(CHUNK_SIZE);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const visibleRows = filteredRows.slice(0, visibleCount);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground shadow-2xs">
      <div className="p-3.5 border-b border-border flex items-center justify-between gap-4 bg-muted/30">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search associate by name or code..."
            value={globalFilter ?? ''}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setVisibleCount(CHUNK_SIZE);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background text-foreground border border-border rounded-lg outline-hidden focus:border-[#2563EB] transition-colors"
          />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          Showing {Math.min(visibleCount, filteredRows.length)} of {filteredRows.length} {filteredRows.length === 1 ? 'associate' : 'associates'}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop - clientHeight < 120 && visibleCount < filteredRows.length) {
            setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredRows.length));
          }
        }}
        className="overflow-x-auto overflow-y-auto max-h-[490px] relative scroll-smooth divide-y divide-border"
      >
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs border-b border-border shadow-2xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3.5 py-2.5 first:pl-4 last:pr-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  No staff records found matching query.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50 transition-colors whitespace-nowrap">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2.5 first:pl-4 last:pr-4 whitespace-nowrap">
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
        hasMore={visibleCount < filteredRows.length}
        onLoadMore={() => setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredRows.length))}
        totalCount={filteredRows.length}
        currentCount={visibleRows.length}
        itemName="Business Development Associates"
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  );
}
