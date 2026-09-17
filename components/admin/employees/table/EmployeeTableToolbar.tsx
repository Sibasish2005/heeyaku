'use client';

import React from 'react';
import { Search, UserPlus } from 'lucide-react';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

interface EmployeeTableToolbarProps {
  searchQuery: string;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  onSearchChange: (val: string) => void;
  onStatusChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  onCreateOpen: () => void;
}

export default function EmployeeTableToolbar({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onCreateOpen,
}: EmployeeTableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-2xs">
      <div className="flex flex-1 items-center gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, email, phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
          />
        </div>

        <div className="w-32 shrink-0">
          <ShadcnDropdownSelect
            value={statusFilter}
            onValueChange={(val) => onStatusChange(val as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'INACTIVE', label: 'Deactivated' },
            ]}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateOpen}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Add Employee</span>
      </button>
    </div>
  );
}
