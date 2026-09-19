'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Building2, UserPlus, Edit3, Calendar } from 'lucide-react';
import { LeadListItem, LEAD_STATUS_STYLES } from './types';

interface LeadCardProps {
  lead: LeadListItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onQuickAssign: () => void;
}

export default function LeadCard({
  lead,
  isSelected,
  onToggleSelect,
  onEdit,
  onQuickAssign,
}: LeadCardProps) {
  const statusInfo = LEAD_STATUS_STYLES[lead.status] || {
    label: lead.status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  const formattedDate = new Date(lead.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className={`rounded-2xl border transition-all duration-150 p-4 bg-card text-card-foreground shadow-2xs space-y-3.5 ${
        isSelected
          ? 'border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#2563EB]/10 ring-1 ring-[#2563EB]/40'
          : 'border-border hover:border-border/80'
      }`}
    >
      {/* Top Bar: Checkbox + Lead Code + Date + Edit Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
            aria-label={`Select lead ${lead.leadCode}`}
          />
          <button
            type="button"
            onClick={onEdit}
            className="font-mono font-bold text-xs text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-900/60 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            {lead.leadCode}
          </button>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <Calendar className="w-3 h-3 text-muted-foreground/60" />
            <span>{formattedDate}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Edit Lead Details"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Row: Name + Status & Badges */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-sm text-foreground tracking-tight">
            {lead.name}
          </h3>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
          {lead.status !== 'NEW' && lead.status !== 'ASSIGNED' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Contacted
            </span>
          )}
        </div>

        {lead.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
      </div>

      {/* Contact Quick Actions (Tap to Call / Tap to Email) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <a
          href={`tel:${lead.phoneNumber}`}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 text-xs font-mono font-medium text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
            <span className="truncate">{lead.phoneNumber}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-sans font-semibold group-hover:text-foreground">
            Call
          </span>
        </a>

        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 text-xs text-muted-foreground hover:text-foreground transition-colors group truncate"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
            <span className="text-[10px] font-semibold group-hover:text-foreground shrink-0">
              Email
            </span>
          </a>
        ) : null}
      </div>

      {/* Bottom Row: Staff Assignment */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Assigned to:</span>
        {lead.assignedEmployee ? (
          <Link
            href={`/admin/employees/${lead.assignedEmployee.id}`}
            className="inline-flex items-center gap-1.5 hover:text-[#2563EB] transition-colors max-w-[70%]"
          >
            <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-[9px] shrink-0">
              {lead.assignedEmployee.name.charAt(0)}
            </div>
            <span className="font-semibold text-xs text-foreground truncate hover:text-[#2563EB]">
              {lead.assignedEmployee.name}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              ({lead.assignedEmployee.employeeCode})
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onQuickAssign}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/50 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            <span>Assign Staff</span>
          </button>
        )}
      </div>
    </div>
  );
}
