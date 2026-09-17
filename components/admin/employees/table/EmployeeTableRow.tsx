'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Users, ExternalLink, MoreVertical, Edit3, KeyRound, UserCheck, UserX, Loader2 } from 'lucide-react';
import { EmployeeListItem } from '../EmployeeTable';

interface EmployeeTableRowProps {
  emp: EmployeeListItem;
  isMenuOpen: boolean;
  isToggling: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
}

export default function EmployeeTableRow({
  emp,
  isMenuOpen,
  isToggling,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: EmployeeTableRowProps) {
  return (
    <tr className="hover:bg-muted/40 transition-[background-color] duration-150 whitespace-nowrap">
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
            {emp.name.charAt(0)}
          </div>
          <div className="flex items-baseline gap-1.5">
            <Link href={`/admin/employees/${emp.id}`} className="font-bold text-foreground text-xs hover:text-[#2563EB]">
              {emp.name}
            </Link>
            <span className="text-[10px] font-mono text-[#2563EB] dark:text-blue-400 font-semibold">
              ({emp.employeeCode})
            </span>
          </div>
        </div>
      </td>

      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono text-muted-foreground">{emp.phoneNumber}</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="truncate max-w-[160px]">{emp.email}</span>
        </div>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className="text-[10.5px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Business Development Associate
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
            emp.isActive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
          <span>{emp.isActive ? 'Active' : 'Deactivated'}</span>
        </span>
      </td>

      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <Link
          href={`/admin/leads?employeeId=${emp.id}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold text-foreground hover:text-[#2563EB] hover:bg-[#2563EB]/10 transition-colors"
        >
          <Users className="w-3 h-3 text-muted-foreground" />
          <span>{emp._count.leads}</span>
        </Link>
      </td>

      <td className="py-2.5 px-3 text-[10.5px] text-muted-foreground font-mono whitespace-nowrap">
        {new Date(emp.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      <td className="py-2.5 px-4 text-right relative whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/employees/${emp.id}`}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
            title="View Details"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onToggleMenu}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {isMenuOpen && (
          <div 
            className="absolute right-5 top-11 z-30 w-44 bg-card text-card-foreground rounded-xl border border-border shadow-xl py-1 text-xs text-left animate-in fade-in-50 zoom-in-95 origin-top-right"
            onMouseLeave={onCloseMenu}
          >
            <Link
              href={`/admin/employees/${emp.id}`}
              className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted/60 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span>View Full Profile</span>
            </Link>

            <button
              type="button"
              onClick={onEdit}
              className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted/60 font-medium cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={onResetPassword}
              className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Password</span>
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              disabled={isToggling}
              onClick={onToggleStatus}
              className={`w-full flex items-center gap-2 px-3 py-2 font-medium cursor-pointer ${
                emp.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : emp.isActive ? (
                <UserX className="w-3.5 h-3.5 text-destructive" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>{emp.isActive ? 'Deactivate' : 'Reactivate'}</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
