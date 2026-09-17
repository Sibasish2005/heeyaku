'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface EmployeeData {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  team: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EmployeeHeroCardProps {
  employee: EmployeeData;
  isToggling: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function EmployeeHeroCard({
  employee,
  isToggling,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: EmployeeHeroCardProps) {
  const initials = getInitials(employee.name);
  const formattedDate = new Date(employee.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5">
      {/* Top Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-[50px] h-[50px] rounded-full bg-[#0B1F33] dark:bg-blue-600 text-white flex items-center justify-center font-semibold text-base shrink-0 select-none shadow-xs">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-foreground">{employee.name}</span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  employee.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {employee.isActive ? 'Active staff' : 'Deactivated'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {employee.employeeCode} · {employee.team === 'BDA' || !employee.team ? 'Business Development Associate' : employee.team}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onResetPassword}
            className="px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
          >
            Reset password
          </button>

          <button
            type="button"
            disabled={isToggling}
            onClick={onToggleStatus}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              employee.isActive
                ? 'text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {isToggling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{employee.isActive ? 'Deactivate' : 'Reactivate'}</span>
          </button>
        </div>
      </div>

      {/* Clean, Lightweight Inline Metadata */}
      <div className="pt-3 border-t border-border/60 flex items-center gap-6 flex-wrap text-xs text-muted-foreground">
        <span>{employee.email}</span>
        <span>{employee.phoneNumber}</span>
        <span>Registered {formattedDate}</span>
        {employee.notes && (
          <span className="truncate max-w-xs" title={employee.notes}>
            {employee.notes}
          </span>
        )}
      </div>
    </div>
  );
}
