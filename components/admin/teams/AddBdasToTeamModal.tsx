'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2, Check, Users } from 'lucide-react';
import { addBdasToTeamAction, fetchAvailableBdasForTeamAction } from '@/app/admin/employees/actions';
import { toast } from 'sonner';

interface AddBdasToTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onAdded: () => void;
}

interface BdaCandidate {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phoneNumber: string;
  currentTeamName: string | null;
}

export default function AddBdasToTeamModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onAdded,
}: AddBdasToTeamModalProps) {
  const [candidates, setCandidates] = useState<BdaCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setSearch('');
      setError(null);
      return;
    }
    let mounted = true;
    async function loadCandidates() {
      setFetching(true);
      try {
        const res = await fetchAvailableBdasForTeamAction(teamId);
        if (mounted && res.success && res.data) {
          setCandidates(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setFetching(false);
      }
    }
    loadCandidates();
    return () => {
      mounted = false;
    };
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.employeeCode.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError('Please select at least one BDA to add.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await addBdasToTeamAction(teamId, Array.from(selectedIds));
      if (!res.success) {
        setError(res.error || 'Failed to assign BDAs.');
        return;
      }

      toast.success(`Successfully added ${selectedIds.size} BDA(s) to ${teamName}!`);
      onAdded();
      onClose();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-lg text-foreground tracking-tight">
                Add BDAs to {teamName}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Select sales associates to join this squad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {/* Search & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, EMP code, phone..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
            {filteredCandidates.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-muted transition-colors whitespace-nowrap cursor-pointer"
              >
                {selectedIds.size === filteredCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Candidates List */}
          {fetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              <span className="text-xs">Loading available BDAs...</span>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-1">
              <p className="text-sm font-semibold text-foreground">No available BDAs found</p>
              <p className="text-xs">
                {search ? 'Try adjusting your search criteria.' : 'All active BDAs are already assigned to this squad.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredCandidates.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'border-muted-foreground/40 bg-background'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({c.employeeCode})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.phoneNumber} • {c.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          c.currentTeamName
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {c.currentTeamName ? `In ${c.currentTeamName}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10">
          <span className="text-xs font-semibold text-muted-foreground">
            {selectedIds.size} BDA(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Selected ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
