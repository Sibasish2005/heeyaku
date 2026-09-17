import React, { useState } from 'react';
import { Phone, Search } from 'lucide-react';
import { CallLogItem, formatSecondsDuration, STATUS_BADGE_STYLES } from './types';

interface EmployeeCallLogsTableProps {
  callLogs: CallLogItem[];
}

export default function EmployeeCallLogsTable({ callLogs }: EmployeeCallLogsTableProps) {
  const [search, setSearch] = useState('');

  const filteredLogs = callLogs.filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      log.phoneNumber.includes(q) ||
      Boolean(log.contactName && log.contactName.toLowerCase().includes(q)) ||
      Boolean(log.outcomeLabel && log.outcomeLabel.toLowerCase().includes(q)) ||
      Boolean(log.notes && log.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden space-y-3 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <h3 className="text-sm font-bold text-foreground">Synced Mobile Call History</h3>
          <p className="text-xs text-muted-foreground">
            Audit trail of outbound calls, talk durations, and notes recorded on device
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search phone or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground font-semibold">
              <th className="py-2.5 px-3">Contact / Number</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Outcome</th>
              <th className="py-2.5 px-3">Discussion Notes</th>
              <th className="py-2.5 px-3 text-right">Call Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  <Phone className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No mobile call records found for this period.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const outcomeKey = (log.outcomeId || '').toUpperCase();
                const badgeClass =
                  STATUS_BADGE_STYLES[outcomeKey] ||
                  'bg-muted text-foreground border-border';

                const formattedTime = new Date(log.startedAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">
                        {log.contactName || log.lead?.name || 'Student Lead'}
                      </div>
                      <div className="font-mono text-muted-foreground text-[11px]">
                        {log.phoneNumber}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-muted text-[10px] font-bold text-muted-foreground tracking-wider">
                        {log.callType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          log.durationSeconds > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatSecondsDuration(log.durationSeconds)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {log.outcomeLabel || log.outcomeId ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeClass}`}
                        >
                          {log.outcomeLabel || log.outcomeId}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs truncate text-muted-foreground">
                      {log.notes || '—'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[11px] text-muted-foreground">
                      {formattedTime}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
