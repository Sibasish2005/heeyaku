'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { UserCheck, X, AlertCircle, Loader2, Search, Check, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { assignLeadsAction, assignLeadsToTeamAction } from '@/app/admin/leads/assignment-actions';
import { cn } from '@/lib/utils';
import { ActiveEmployee, ActiveTeam } from './table/types';

export type { ActiveEmployee, ActiveTeam };

interface BulkAssignDialogProps {
  isOpen: boolean;
  selectedLeadIds: string[];
  activeEmployees: ActiveEmployee[];
  teams?: ActiveTeam[];
  currentUserRole?: string;
  onClose: () => void;
  onAssigned?: (count: number, targetName: string) => void;
}

export default function BulkAssignDialog({
  isOpen,
  selectedLeadIds,
  activeEmployees,
  teams = [],
  currentUserRole,
  onClose,
  onAssigned,
}: BulkAssignDialogProps) {
  const isCeo = currentUserRole === 'CEO';
  const isTl = currentUserRole === 'TEAM_LEAD';

  // Team Lead can only assign to BDAs in their squad
  const assignableEmployees = useMemo(() => {
    if (isTl) {
      return activeEmployees.filter((emp) => emp.role === 'BDA');
    }
    return activeEmployees.filter((emp) => emp.role === 'BDA');
  }, [activeEmployees, isTl]);

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(assignableEmployees[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default selection
  useEffect(() => {
    if (isCeo && teams.length > 0 && !teams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    } else if (!isCeo && assignableEmployees.length > 0 && !assignableEmployees.some((e) => e.id === selectedEmployeeId)) {
      setSelectedEmployeeId(assignableEmployees[0].id);
    }
  }, [isCeo, teams, assignableEmployees, selectedTeamId, selectedEmployeeId]);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.teamLead &&
          (t.teamLead.name.toLowerCase().includes(q) || t.teamLead.employeeCode.toLowerCase().includes(q)))
    );
  }, [teams, searchQuery]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assignableEmployees;
    return assignableEmployees.filter(
      (emp) => emp.name.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q)
    );
  }, [assignableEmployees, searchQuery]);

  if (!isOpen) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isCeo) {
        if (!selectedTeamId) {
          setError('Please select a squad / team.');
          setLoading(false);
          return;
        }

        const res = await assignLeadsToTeamAction({
          leadIds: selectedLeadIds,
          teamId: selectedTeamId,
        });

        if (!res.success || !res.data) {
          const errMsg = res.error || 'Failed to assign leads to squad.';
          setError(errMsg);
          toast.error(errMsg);
          return;
        }

        const teamName = res.data.teamName;
        toast.success(
          `Successfully assigned ${res.data.count} lead${res.data.count > 1 ? 's' : ''} to Squad ${teamName}.`
        );

        if (onAssigned) onAssigned(res.data.count, `Squad ${teamName}`);
        onClose();
      } else {
        if (!selectedEmployeeId) {
          setError('Please select a Business Development Associate.');
          setLoading(false);
          return;
        }

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
      }
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
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center shrink-0">
              {isCeo ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">
                {isCeo ? 'Assign Leads to Squad' : 'Distribute to Squad BDA'}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {isCeo
                  ? `Assign ${selectedLeadIds.length} lead${selectedLeadIds.length > 1 ? 's' : ''} to a Squad pool for Team Lead distribution`
                  : `Assign ${selectedLeadIds.length} lead${selectedLeadIds.length > 1 ? 's' : ''} to a BDA in your squad`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCeo ? (
            /* CEO Mode: Select Squad / Team */
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Target Squad / Team *
              </label>

              {teams.length === 0 ? (
                <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                  No active squads found. Please create a squad in Team Management first.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search squad name or Team Lead..."
                      className="w-full text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground pl-8.5 pr-8 py-2 rounded-xl outline-hidden transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/60 max-h-56 overflow-y-auto">
                    {filteredTeams.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No matching squads found.
                      </div>
                    ) : (
                      filteredTeams.map((team) => {
                        const isSelected = selectedTeamId === team.id;
                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => {
                              setSelectedTeamId(team.id);
                              setError(null);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer text-xs active:scale-[0.99]',
                              isSelected
                                ? 'bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 font-semibold'
                                : 'text-foreground hover:bg-muted/60'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: team.colorTag || '#2563EB' }}
                              />
                              <span className="font-bold truncate">Squad {team.name}</span>
                              {team.teamLead ? (
                                <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border/40 shrink-0">
                                  TL: {team.teamLead.name} ({team.teamLead.employeeCode})
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                                  No TL Assigned
                                </span>
                              )}
                              {team._count && (
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                                  {team._count.members} BDAs
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Team Lead Mode: Select Squad BDA */
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                Assign to Squad BDA *
              </label>

              {assignableEmployees.length === 0 ? (
                <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                  No active BDAs found in your squad to assign leads to.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search squad BDAs..."
                      className="w-full text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground pl-8.5 pr-8 py-2 rounded-xl outline-hidden transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/60 max-h-56 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No matching BDAs found.
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = selectedEmployeeId === emp.id;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setError(null);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer text-xs active:scale-[0.99]',
                              isSelected
                                ? 'bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 font-semibold'
                                : 'text-foreground hover:bg-muted/60'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{emp.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border/40 shrink-0">
                                {emp.employeeCode}
                              </span>
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                                BDA
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (isCeo ? teams.length === 0 || !selectedTeamId : assignableEmployees.length === 0 || !selectedEmployeeId)
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer active:scale-[0.97] text-center"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCeo ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{isCeo ? 'Assign to Squad' : 'Assign to BDA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
