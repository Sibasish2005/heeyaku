'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ImportCompleteCardProps {
  count: number;
  assignedEmployee?: string;
  onReset: () => void;
  onClose: () => void;
}

export default function ImportCompleteCard({
  count,
  assignedEmployee,
  onReset,
  onClose,
}: ImportCompleteCardProps) {
  return (
    <div className="p-10 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
        <div className="text-base font-bold text-foreground">Import Completed!</div>
        <p className="text-xs text-muted-foreground mt-1">
          Successfully added <span className="font-bold text-emerald-600 dark:text-emerald-400">{count.toLocaleString()} leads</span> into your database.
        </p>
        {assignedEmployee && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Assigned to Business Development Associate <span className="font-semibold text-foreground">{assignedEmployee}</span>.
          </p>
        )}
      </div>
      <div className="pt-2 flex justify-center gap-3">
        <button
          onClick={onReset}
          className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
        >
          Import Another File
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
