'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Edit3, UserPlus } from 'lucide-react';
import { LeadListItem, LEAD_STATUS_STYLES } from './types';

interface LeadTableRowProps {
  lead: LeadListItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onQuickAssign: () => void;
}

export default function LeadTableRow({
  lead,
  isSelected,
  onToggleSelect,
  onEdit,
  onQuickAssign,
}: LeadTableRowProps) {
  const statusInfo = LEAD_STATUS_STYLES[lead.status] || {
    label: lead.status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <tr className={`hover:bg-muted/40 transition-[background-color] duration-150 whitespace-nowrap ${isSelected ? 'bg-[#2563EB]/5 dark:bg-[#2563EB]/15' : ''}`}>
      <td className="py-2.5 px-3 text-center w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <button
          type="button"
          onClick={onEdit}
          className="font-mono font-bold text-[#2563EB] dark:text-blue-400 hover:opacity-80 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50 transition-colors text-left cursor-pointer text-[11px]"
        >
          {lead.leadCode}
        </button>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className="font-bold text-foreground text-xs">{lead.name}</span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-foreground/90">
          <Phone className="w-2.5 h-2.5 text-muted-foreground/60" />
          {lead.phoneNumber}
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        {lead.email ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <Mail className="w-2.5 h-2.5 text-muted-foreground/60" />
            <span className="truncate max-w-[170px]">{lead.email}</span>
          </span>
        ) : (
          <span className="text-[10.5px] text-muted-foreground/40 italic">-</span>
        )}
      </td>

      <td className="py-2.5 px-3 text-muted-foreground font-medium text-[11px] whitespace-nowrap truncate max-w-[200px]">
        {lead.company || <span className="text-muted-foreground/40 italic">-</span>}
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        {lead.assignedEmployee ? (
          <Link
            href={`/admin/employees/${lead.assignedEmployee.id}`}
            className="group inline-flex items-center gap-1.5 hover:text-[#2563EB] transition-colors"
          >
            <div className="w-4.5 h-4.5 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[8.5px] shrink-0">
              {lead.assignedEmployee.name.charAt(0)}
            </div>
            <span className="font-semibold text-xs text-foreground group-hover:text-[#2563EB]">
              {lead.assignedEmployee.name}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              ({lead.assignedEmployee.employeeCode})
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onQuickAssign}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/50 transition-colors"
          >
            <UserPlus className="w-2.5 h-2.5" />
            <span>Assign</span>
          </button>
        )}
      </td>

      <td className="py-2.5 px-3 text-[10.5px] text-muted-foreground font-mono whitespace-nowrap">
        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })}
      </td>

      <td className="py-2.5 px-4 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={onEdit}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors cursor-pointer"
          title="Edit Lead"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
