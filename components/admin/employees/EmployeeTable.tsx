'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import EmployeeTableToolbar from './table/EmployeeTableToolbar';
import EmployeeTableRow from './table/EmployeeTableRow';
import EmployeeTableModals from './table/EmployeeTableModals';
import { employeeColumns } from './table/employeeColumns';
import { EmployeeListItem, EmployeeTableProps } from './table/types';
import InfiniteScrollSentinel from '@/components/admin/common/InfiniteScrollSentinel';
import { toggleEmployeeStatusAction } from '@/app/admin/employees/actions';
import { fetchEmployeesChunkAction } from '@/app/admin/employees/fetch-actions';

export type { EmployeeListItem } from './table/types';

export default function EmployeeTable({
  initialEmployees,
  totalEmployeesCount,
}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>(initialEmployees);
  const [totalCount, setTotalCount] = useState<number>(totalEmployeesCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dialog & menu states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeListItem | null>(null);
  const [resettingEmployee, setResettingEmployee] = useState<EmployeeListItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Requirement-based server fetch on search / filter changes
  const isInitialMount = useRef(true);
  const executeFilterFetch = useCallback(async (query: string, status: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setIsLoadingChunk(true);
    try {
      const res = await fetchEmployeesChunkAction({ skip: 0, take: 10, searchQuery: query, statusFilter: status });
      if (res.success) {
        setEmployees(res.items);
        setTotalCount(res.totalCount);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsLoadingChunk(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const timer = setTimeout(() => executeFilterFetch(searchQuery, statusFilter), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, executeFilterFetch]);

  // Requirement-based fetch for the NEXT 10 records
  const handleLoadMore = useCallback(async () => {
    if (isLoadingChunk || employees.length >= totalCount) return;
    setIsLoadingChunk(true);
    try {
      const res = await fetchEmployeesChunkAction({ skip: employees.length, take: 10, searchQuery, statusFilter });
      if (res.success && res.items.length > 0) {
        setEmployees((prev) => [...prev, ...res.items]);
        setTotalCount(res.totalCount);
      }
    } finally {
      setIsLoadingChunk(false);
    }
  }, [isLoadingChunk, employees.length, totalCount, searchQuery, statusFilter]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      handleLoadMore();
    }
  };

  const table = useReactTable({ data: employees, columns: employeeColumns, getCoreRowModel: getCoreRowModel() });

  const handleToggleStatus = async (emp: EmployeeListItem) => {
    setTogglingId(emp.id);
    setActiveMenuId(null);
    try {
      const res = await toggleEmployeeStatusAction(emp.id);
      if (res.success && res.data) {
        setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, isActive: res.data!.isActive } : e)));
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <EmployeeTableToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onCreateOpen={() => setIsCreateOpen(true)}
      />

      {/* Sticky Table Container - Exactly 10 rows visible at a time */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xs overflow-hidden flex flex-col">
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="overflow-x-auto overflow-y-auto max-h-[490px] relative scroll-smooth divide-y divide-border"
        >
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs border-b border-border shadow-2xs">
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-3">Contact Info</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3 text-center">Assigned Leads</th>
                <th className="py-2.5 px-3">Joined Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {isLoadingChunk ? 'Fetching staff records...' : 'No employees match your search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <EmployeeTableRow
                    key={row.original.id}
                    emp={row.original}
                    isMenuOpen={activeMenuId === row.original.id}
                    isToggling={togglingId === row.original.id}
                    onToggleMenu={() => setActiveMenuId(activeMenuId === row.original.id ? null : row.original.id)}
                    onCloseMenu={() => setActiveMenuId(null)}
                    onEdit={() => { setActiveMenuId(null); setEditingEmployee(row.original); }}
                    onResetPassword={() => { setActiveMenuId(null); setResettingEmployee(row.original); }}
                    onToggleStatus={() => handleToggleStatus(row.original)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky footer counter & sentinel */}
        <InfiniteScrollSentinel
          hasMore={employees.length < totalCount}
          onLoadMore={handleLoadMore}
          totalCount={totalCount}
          currentCount={employees.length}
          isLoading={isLoadingChunk}
          itemName="Business Development Associates"
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      <EmployeeTableModals
        isCreateOpen={isCreateOpen}
        editingEmployee={editingEmployee}
        resettingEmployee={resettingEmployee}
        onCloseCreate={() => setIsCreateOpen(false)}
        onCloseEdit={() => setEditingEmployee(null)}
        onCloseReset={() => setResettingEmployee(null)}
      />
    </div>
  );
}
