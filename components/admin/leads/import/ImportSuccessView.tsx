'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportSuccessViewProps {
  insertedCount: number;
  totalRows: number;
  skippedDuplicates: number;
  assignedCounselorName?: string;
  onReset: () => void;
  onClose: () => void;
}

export function ImportSuccessView({
  insertedCount,
  totalRows,
  skippedDuplicates,
  assignedCounselorName,
  onReset,
  onClose,
}: ImportSuccessViewProps) {
  return (
    <div className="py-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold">Import Complete!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Successfully imported <span className="font-medium text-foreground">{insertedCount}</span> new leads.
        </p>
        {skippedDuplicates > 0 && (
          <p className="text-xs text-muted-foreground">
            ({skippedDuplicates} duplicates were skipped)
          </p>
        )}
        {assignedCounselorName && (
          <p className="text-xs text-muted-foreground mt-1">
            All leads assigned to Business Development Associate: <span className="font-medium text-foreground">{assignedCounselorName}</span>
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={onReset}>
          Import More
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
