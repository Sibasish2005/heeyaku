import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { formatSecondsDuration, LeadItem } from './types';

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
    columnHelper.accessor('callLogs', {
      id: 'callDurations',
      header: 'Call Duration',
      cell: (info) => {
        const calls = info.getValue() || [];
        if (calls.length === 0) {
          return <span className="text-muted-foreground/40 italic text-[11px]">-</span>;
        }

        const totalSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);

        if (calls.length === 1) {
          const call = calls[0];
          const isConn = call.durationSeconds > 0;
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                title={`Call: ${formatSecondsDuration(call.durationSeconds)} • ${
                  call.outcomeLabel || (isConn ? 'Connected' : 'No Answer')
                } (${new Date(call.startedAt).toLocaleString('en-IN')})`}
                className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${
                  isConn
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {formatSecondsDuration(call.durationSeconds)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {call.outcomeLabel || (isConn ? 'Connected' : 'No Answer')}
              </span>
            </div>
          );
        }

        // Multiple calls: show each call duration pill, plus total summary
        const displayCalls = calls.slice(0, 3);
        const remaining = calls.length - displayCalls.length;

        return (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-1 flex-wrap max-w-[280px]">
              {displayCalls.map((c, idx) => {
                const isConn = c.durationSeconds > 0;
                const callNumber = calls.length - idx;
                return (
                  <span
                    key={c.id || idx}
                    title={`Call #${callNumber}: ${formatSecondsDuration(c.durationSeconds)} • ${
                      c.outcomeLabel || (isConn ? 'Connected' : 'No Answer')
                    } (${new Date(c.startedAt).toLocaleString('en-IN')})`}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                      isConn
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    #{callNumber}: {formatSecondsDuration(c.durationSeconds)}
                  </span>
                );
              })}
              {remaining > 0 && (
                <span
                  title={calls
                    .slice(3)
                    .map((c, i) => `#${calls.length - 3 - i}: ${formatSecondsDuration(c.durationSeconds)}`)
                    .join(', ')}
                  className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-muted text-muted-foreground border border-border"
                >
                  +{remaining} more
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground">
              Total: {formatSecondsDuration(totalSeconds)} ({calls.length} calls)
            </span>
          </div>
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
