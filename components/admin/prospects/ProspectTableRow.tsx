'use client';

import React from 'react';
import { Phone, Edit3, User } from 'lucide-react';
import { ProspectItem, PROSPECT_STATUS_META } from './types';

interface ProspectTableRowProps {
  prospect: ProspectItem;
  showTeamLeadColumn?: boolean;
  onEditStatus: (prospect: ProspectItem) => void;
}

export default function ProspectTableRow({
  prospect,
  showTeamLeadColumn = true,
  onEditStatus,
}: ProspectTableRowProps) {
  const statusMeta = PROSPECT_STATUS_META[prospect.status] || {
    label: prospect.status,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  };

  const isConverted = prospect.status === 'CONVERTED';

  return (
    <tr className={`hover:bg-muted/40 transition-[background-color] duration-150 whitespace-nowrap ${isConverted ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}>
      {/* Code */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className="font-mono font-bold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50 text-[11px]">
          {prospect.leadCode}
        </span>
      </td>

      {/* Prospect Name & Details */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground text-xs">{prospect.name}</span>
          <span className="inline-flex items-center text-[9px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
            Prospect
          </span>
        </div>
        {prospect.company && (
          <p className="text-[10.5px] text-muted-foreground truncate max-w-[200px] mt-0.5">
            {prospect.company}
          </p>
        )}
      </td>

      {/* Contact */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <a
            href={`tel:${prospect.phoneNumber}`}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#2563EB] dark:text-blue-400 hover:underline font-semibold"
          >
            <Phone className="w-3 h-3 text-muted-foreground/60" />
            <span>{prospect.phoneNumber}</span>
          </a>
        </div>
        {prospect.email && (
          <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
            {prospect.email}
          </span>
        )}
      </td>

      {/* Original BDA Attribution */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        {prospect.originalBda ? (
          <div className="inline-flex items-center gap-1 text-[11px]">
            <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-bold text-[10px] shrink-0 border border-border/50">
              <User className="w-3 h-3" />
            </span>
            <span className="font-semibold text-foreground text-xs">{prospect.originalBda.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">({prospect.originalBda.employeeCode})</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/50 font-mono">Direct / Intake</span>
        )}
      </td>

      {/* Team Lead / Squad Column (Visible on CEO view) */}
      {showTeamLeadColumn && (
        <td className="py-2.5 px-3 whitespace-nowrap">
          {prospect.assignedEmployee ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center text-[10px] font-medium text-foreground bg-muted border border-border px-2 py-0.5 rounded">
                <span>TL {prospect.assignedEmployee.name}</span>
              </span>
              {prospect.team && (
                <span className="text-[9.5px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                  {prospect.team.name}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/40 text-[11px] font-mono">Unassigned</span>
          )}
        </td>
      )}

      {/* Status Badge */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dotClass}`} />
          <span>{statusMeta.label}</span>
        </span>
      </td>

      {/* Last Updated Date */}
      <td className="py-2.5 px-3 text-[10.5px] text-muted-foreground font-mono whitespace-nowrap">
        {new Date(prospect.updatedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })}
      </td>

      {/* Action: Manual Status Update Button */}
      <td className="py-2.5 px-4 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => onEditStatus(prospect)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer hover:shadow-blue-500/20"
        >
          <Edit3 className="w-3 h-3" />
          <span>Update Status</span>
        </button>
      </td>
    </tr>
  );
}
