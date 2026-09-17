'use client';

import React, { useState, useMemo } from 'react';
import { UserCheck, X, AlertCircle, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { assignLeadsAction } from '@/app/admin/leads/assignment-actions';
import { cn } from '@/lib/utils';

export interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

interface BulkAssignDialogProps {
  isOpen: boolean;
  selectedLeadIds: string[];
  activeEmployees: ActiveEmployee[];
  onClose: () => void;
  onAssigned?: (count: number, employeeName: string) => void;
}

export default function BulkAssignDialog({
  isOpen,
  selectedLeadIds,
  activeEmployees,
  onClose,
  onAssigned,
}: BulkAssignDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(activeEmployees[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeEmployees;
    return activeEmployees.filter(
      (emp) => emp.name.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q)
    );
  }, [activeEmployees, searchQuery]);

  if (!isOpen) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please select an associate.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await assignLeadsAction({
        leadIds: selectedLeadIds,
        employeeId: selectedEmployeeId,
      });

      if (!res.success || !res.data) {
        const errMsg = res.error || 'Failed to assign leads.';
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      toast.success(
        `Successfully assigned ${res.data.count} lead${res.data.count > 1 ? 's' : ''} to ${res.data.employeeName}.`
      );

      if (onAssigned) onAssigned(res.data.count, res.data.employeeName);
      onClose();
    } catch {
      const errMsg = 'An unexpected server error occurred.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Assign Leads</h2>
              <p className="text-[11px] text-muted-foreground">
                Assign {selectedLeadIds.length} selected lead{selectedLeadIds.length > 1 ? 's' : ''} to a team member
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Assign to Business Development Associate *
            </label>

            {activeEmployees.length === 0 ? (
              <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                No active associates found. Please create an employee first.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search associates by name or EMP code..."
                    className="w-full text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground pl-8.5 pr-8 py-2 rounded-xl outline-hidden transition-colors"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/60 max-h-56 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">No matching associates found.</div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmployeeId === emp.id;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => { setSelectedEmployeeId(emp.id); setError(null); }}
                          className={cn(
                            "w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer text-xs active:scale-[0.99]",
                            isSelected ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 font-semibold" : "text-foreground hover:bg-muted/60"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{emp.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border/40 shrink-0">
                              {emp.employeeCode}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || activeEmployees.length === 0 || !selectedEmployeeId}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer active:scale-[0.97]"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>Assign Leads</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
