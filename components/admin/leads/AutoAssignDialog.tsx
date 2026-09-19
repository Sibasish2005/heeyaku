'use client';

import React, { useState, useEffect } from 'react';
import { X, Bot, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { autoAssignLeadsAction } from '@/app/admin/leads/assignment-actions';
import { ActiveEmployee } from './table/types';
import { toast } from 'sonner';

interface AutoAssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmployees: ActiveEmployee[];
  onAssigned?: (count: number) => void;
}

export default function AutoAssignDialog({
  isOpen,
  onClose,
  activeEmployees,
  onAssigned,
}: AutoAssignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assignAll, setAssignAll] = useState(false);
  const [leadsPerEmployee, setLeadsPerEmployee] = useState<number>(50);
  const [distributionMethod, setDistributionMethod] = useState<'EVENLY' | 'SEQUENTIAL'>('EVENLY');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedEmployeeIds([]);
      setAssignAll(false);
      setLeadsPerEmployee(50);
      setDistributionMethod('EVENLY');
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = activeEmployees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEmployeeIds.length === activeEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(activeEmployees.map(e => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedEmployeeIds.length === 0) {
      setError('Please select at least one employee.');
      return;
    }

    if (!assignAll && (leadsPerEmployee <= 0 || isNaN(leadsPerEmployee))) {
      setError('Please enter a valid number of leads per employee.');
      return;
    }

    setLoading(true);

    try {
      const res = await autoAssignLeadsAction({
        employeeIds: selectedEmployeeIds,
        assignAll,
        leadsPerEmployee: assignAll ? undefined : leadsPerEmployee,
        distributionMethod,
      });

      if (!res.success) {
        setError(res.error || 'Failed to auto-assign leads.');
        return;
      }

      if (onAssigned) onAssigned(res.data?.assignedCount || 0);
      onClose();
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Auto-Assign Leads</h2>
              <p className="text-[11px] text-muted-foreground">Distribute unassigned leads automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <form id="auto-assign-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">1. Select Employees</label>
                <button 
                  type="button" 
                  onClick={toggleAll}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  {selectedEmployeeIds.length === activeEmployees.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-hidden focus:border-[#2563EB]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-xl bg-muted/20 scrollbar-thin">
                {filteredEmployees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded-sm border-input w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-foreground">{emp.name}</span>
                      <span className="text-[10px] text-muted-foreground">{emp.employeeCode}</span>
                    </div>
                  </label>
                ))}
                {filteredEmployees.length === 0 && (
                  <div className="col-span-full p-4 text-center text-xs text-muted-foreground">
                    No employees found.
                  </div>
                )}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {selectedEmployeeIds.length} employee(s) selected
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-foreground">2. Assignment Strategy</label>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="assignAllCheck"
                  checked={assignAll}
                  onChange={e => setAssignAll(e.target.checked)}
                  className="rounded-sm border-input w-3.5 h-3.5 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="assignAllCheck" className="text-xs font-medium text-foreground cursor-pointer">
                  Assign all available unassigned leads from the pool
                </label>
              </div>

              {!assignAll && (
                <div className="space-y-1.5 pl-5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Leads per selected employee</label>
                  <input
                    type="number"
                    min="1"
                    value={leadsPerEmployee}
                    onChange={(e) => setLeadsPerEmployee(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-hidden focus:border-[#2563EB] text-foreground"
                    placeholder="e.g. 50"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-foreground">3. Distribution Method (if leads are short)</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${distributionMethod === 'EVENLY' ? 'border-[#2563EB] bg-[#2563EB]/5 shadow-sm' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'}`}>
                  <input 
                    type="radio" 
                    name="distribution" 
                    value="EVENLY"
                    checked={distributionMethod === 'EVENLY'}
                    onChange={() => setDistributionMethod('EVENLY')}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-bold text-foreground mb-1">Distribute Evenly</span>
                  <span className="text-[10px] text-muted-foreground">Round-robin distribution so everyone gets roughly the same amount.</span>
                </label>
                
                <label className={`relative flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${distributionMethod === 'SEQUENTIAL' ? 'border-[#2563EB] bg-[#2563EB]/5 shadow-sm' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'}`}>
                  <input 
                    type="radio" 
                    name="distribution" 
                    value="SEQUENTIAL"
                    checked={distributionMethod === 'SEQUENTIAL'}
                    onChange={() => setDistributionMethod('SEQUENTIAL')}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-bold text-foreground mb-1">Fill Sequentially</span>
                  <span className="text-[10px] text-muted-foreground">Fills up the first employee completely before moving to the next.</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border">
              <div className="text-[11px] font-medium text-foreground">
                <span className="text-muted-foreground">Target total assignment: </span>
                <span className="font-bold text-[#2563EB]">
                  {assignAll ? 'All available' : `${(selectedEmployeeIds.length * leadsPerEmployee).toLocaleString()}`} leads
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="auto-assign-form"
            disabled={loading || selectedEmployeeIds.length === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            <span>{loading ? 'Assigning...' : 'Start Auto-Assign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
