import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { LeadItem } from './types';

const columnHelper = createColumnHelper<LeadItem>();

export function getEmployeeAssignedLeadsColumns(statusBadgeStyles: Record<string, string>) {
  return [
    columnHelper.accessor('leadCode', {
      header: 'Code No',
      cell: (info) => (
        <span className="font-mono font-bold text-[11px] text-[#2563EB] dark:text-blue-400 whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Lead Name',
      cell: (info) => (
        <span className="font-bold text-foreground text-xs whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('phoneNumber', {
      header: 'Phone No',
      cell: (info) => (
        <span className="font-mono text-foreground/90 text-[11px] whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <span className="text-muted-foreground text-[10.5px] whitespace-nowrap truncate max-w-[160px] block">
            {val}
          </span>
        ) : (
          <span className="text-muted-foreground/40 italic text-[10.5px]">-</span>
        );
      },
    }),
    columnHelper.accessor('company', {
      header: 'Course / School',
      cell: (info) => (
        <span className="text-muted-foreground text-[11px] whitespace-nowrap truncate max-w-[180px] block">
          {info.getValue() || <span className="text-muted-foreground/40 italic">-</span>}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold border whitespace-nowrap ${
              statusBadgeStyles[status] || 'bg-muted text-foreground border-border'
            }`}
          >
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('source', {
      header: 'Source',
      cell: (info) => <span className="text-muted-foreground text-[10.5px] whitespace-nowrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('assignedAt', {
      header: 'Assigned Date',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className="text-muted-foreground text-[10.5px] font-mono whitespace-nowrap">
            {val
              ? new Date(val).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'}
          </span>
        );
      },
    }),
  ];
}
