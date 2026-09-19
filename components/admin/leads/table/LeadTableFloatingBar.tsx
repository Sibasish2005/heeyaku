'use client';

import React from 'react';
import { UserCheck, UserX, Download, Loader2 } from 'lucide-react';

interface LeadTableFloatingBarProps {
  selectedCount: number;
  isUnassigning: boolean;
  onAssignOpen: () => void;
  onBulkUnassign: () => void;
  onExportSelected: (format: 'xlsx' | 'csv') => void;
  onClearSelection: () => void;
}

export default function LeadTableFloatingBar({
  selectedCount,
  isUnassigning,
  onAssignOpen,
  onBulkUnassign,
  onExportSelected,
  onClearSelection,
}: LeadTableFloatingBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-16 z-30 bg-[#0B1F33] text-white px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 sm:gap-3 animate-in slide-in-from-top-3 duration-200">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="font-mono font-bold text-xs bg-blue-600 px-2 py-0.5 rounded-full">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-slate-200">
          lead{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          type="button"
          onClick={onAssignOpen}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assign<span className="hidden sm:inline"> to Staff</span></span>
        </button>

        <button
          type="button"
          disabled={isUnassigning}
          onClick={onBulkUnassign}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isUnassigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
          <span>Unassign</span>
        </button>

        <div className="relative group">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export<span className="hidden sm:inline"> Selected</span></span>
          </button>
          <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-30 animate-in fade-in-50">
            <div className="bg-[#0B1F33] rounded-xl border border-slate-700 shadow-xl py-1 w-44 text-xs font-medium text-slate-200">
              <button
                type="button"
                onClick={() => onExportSelected('xlsx')}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>Excel (.xlsx)</span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">.xlsx</span>
              </button>
              <button
                type="button"
                onClick={() => onExportSelected('csv')}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>CSV (.csv)</span>
                <span className="font-mono text-[10px] text-blue-400 font-bold">.csv</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
