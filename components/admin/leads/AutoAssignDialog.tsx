'use client';

import React, { useState } from 'react';
import { X, Users, AlertCircle, PlayCircle, Loader2, Shield } from 'lucide-react';
import { autoAssignLeadsAction, autoAssignLeadsToTeamsAction } from '@/app/admin/leads/assignment-actions';
import { ActiveEmployee, ActiveTeam } from './table/types';

interface AutoAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmployees: ActiveEmployee[];
  teams?: ActiveTeam[];
  currentUserRole?: string;
  onAssigned?: (count: number) => void;
}

export default function AutoAssignDialog({
  isOpen,
  onClose,
  activeEmployees,
  teams = [],
  currentUserRole,
  onAssigned,
}: AutoAssignDialogProps) {
  const isCeo = currentUserRole === 'CEO';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignableEmployees = React.useMemo(() => {
    return activeEmployees.filter((emp) => emp.role === 'BDA');
  }, [activeEmployees]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignAll, setAssignAll] = useState(false);
  const [leadsPerTarget, setLeadsPerTarget] = useState<number>(50);
  const [distributionMethod, setDistributionMethod] = useState<'EVENLY' | 'SEQUENTIAL'>('EVENLY');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state on open via React prop transition tracking
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedIds([]);
      setAssignAll(false);
      setLeadsPerTarget(50);
      setDistributionMethod('EVENLY');
      setSearchQuery('');
      setError(null);
    }
  }

  if (!isOpen) return null;

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.teamLead && t.teamLead.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEmployees = assignableEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOptions = isCeo ? teams.length : assignableEmployees.length;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === totalOptions) {
      setSelectedIds([]);
    } else {
      setSelectedIds(isCeo ? teams.map((t) => t.id) : assignableEmployees.map((e) => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedIds.length === 0) {
      setError(isCeo ? 'Please select at least one squad.' : 'Please select at least one BDA.');
      return;
    }

    if (!assignAll && (leadsPerTarget <= 0 || isNaN(leadsPerTarget))) {
      setError('Please enter a valid number of leads per target.');
      return;
    }

    setLoading(true);

    try {
      if (isCeo) {
        const res = await autoAssignLeadsToTeamsAction({
          teamIds: selectedIds,
          assignAll,
          leadsPerTeam: assignAll ? undefined : leadsPerTarget,
          distributionMethod,
        });

        if (!res.success) {
          setError(res.error || 'Failed to auto-assign leads across squads.');
          return;
        }

        if (onAssigned) onAssigned(res.data?.assignedCount || 0);
        onClose();
      } else {
        const res = await autoAssignLeadsAction({
          employeeIds: selectedIds,
          assignAll,
          leadsPerEmployee: assignAll ? undefined : leadsPerTarget,
          distributionMethod,
        });

        if (!res.success) {
          setError(res.error || 'Failed to auto-assign leads.');
          return;
        }

        if (onAssigned) onAssigned(res.data?.assignedCount || 0);
        onClose();
      }
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card text-card-foreground w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isCeo ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">
                {isCeo ? 'Auto-Distribute to Squads' : 'Auto-Distribute to Squad BDAs'}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {isCeo
                  ? 'Distribute unassigned general pool leads across squads'
                  : 'Distribute squad leads evenly among your BDAs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
          <form id="auto-assign-form" onSubmit={handleSubmit} className="flex flex-col h-full gap-5 sm:gap-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-xs font-bold text-foreground">
                  {isCeo ? '1. Select Target Squads' : '1. Select Squad BDAs'}
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  {selectedIds.length === totalOptions ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isCeo ? 'Search squads or team leads...' : 'Search squad BDAs...'}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-[#2563EB] text-foreground shrink-0"
              />
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto p-1 border border-border rounded-xl bg-muted/20 scrollbar-thin max-h-48 sm:max-h-60">
                {isCeo ? (
                  filteredTeams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(team.id)}
                        onChange={() => toggleItem(team.id)}
                        className="rounded-sm border-input w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: team.colorTag || '#2563EB' }}
                        />
                        <span className="text-[11px] font-bold text-foreground truncate">Squad {team.name}</span>
                        {team.teamLead && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40 shrink-0">
                            TL: {team.teamLead.name}
                          </span>
                        )}
                        {team._count && (
                          <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.2 rounded border border-border/30 shrink-0">
                            {team._count.members} BDAs
                          </span>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  filteredEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => toggleItem(emp.id)}
                        className="rounded-sm border-input w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-[11px] font-bold text-foreground truncate">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40 shrink-0">
                          {emp.employeeCode}
                        </span>
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded shrink-0">
                          BDA
                        </span>
                      </div>
                    </label>
                  ))
                )}
                {totalOptions === 0 && (
                  <div className="col-span-full p-4 text-center text-xs text-muted-foreground">
                    {isCeo ? 'No squads available.' : 'No BDAs available in your squad.'}
                  </div>
                )}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground shrink-0">
                {selectedIds.length} {isCeo ? 'squad(s)' : 'BDA(s)'} selected
              </div>
            </div>

            <div className="shrink-0 space-y-4 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-foreground">2. Quantity Strategy</label>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="assignAllCheck"
                  checked={assignAll}
                  onChange={(e) => setAssignAll(e.target.checked)}
                  className="rounded-sm border-input w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="assignAllCheck" className="text-xs font-medium text-foreground cursor-pointer">
                  Assign all available unassigned leads from the pool
                </label>
              </div>

              {!assignAll && (
                <div className="space-y-1.5 pl-5">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    {isCeo ? 'Leads per selected squad' : 'Leads per selected BDA'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leadsPerTarget}
                    onChange={(e) => setLeadsPerTarget(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-[#2563EB] text-foreground"
                    placeholder="e.g. 50"
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-3 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-foreground">3. Distribution Method</label>
              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    value="EVENLY"
                    checked={distributionMethod === 'EVENLY'}
                    onChange={() => setDistributionMethod('EVENLY')}
                    className="w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB] border-input"
                  />
                  <span className="text-xs font-medium text-foreground">
                    Distribute evenly (round-robin)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="distribution"
                    value="SEQUENTIAL"
                    checked={distributionMethod === 'SEQUENTIAL'}
                    onChange={() => setDistributionMethod('SEQUENTIAL')}
                    className="w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB] border-input"
                  />
                  <span className="text-xs font-medium text-foreground">
                    Fill each target sequentially before moving to the next
                  </span>
                </label>
              </div>
            </div>

            <div className="shrink-0 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="text-[11px] font-medium text-foreground">
                <span className="text-muted-foreground">Target total allocation: </span>
                <span className="font-bold text-[#2563EB]">
                  {assignAll
                    ? 'All available'
                    : `${(selectedIds.length * leadsPerTarget).toLocaleString()}`}{' '}
                  leads
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="auto-assign-form"
            disabled={loading || selectedIds.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer text-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            <span>{loading ? 'Assigning...' : 'Start Auto-Assign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
