'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowLeft, ArrowRight, UserCheck, Loader2 } from 'lucide-react';
import { ImportPreviewResult } from '@/app/admin/leads/import-actions';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

interface ImportPreviewTabsProps {
  previewResult: ImportPreviewResult;
  activeEmployees: ActiveEmployee[];
  assignedEmployeeId: string;
  loading: boolean;
  onAssignedEmployeeChange: (id: string) => void;
  onBack: () => void;
  onExecuteImport: () => void;
}

export default function ImportPreviewTabs({
  previewResult,
  activeEmployees,
  assignedEmployeeId,
  loading,
  onAssignedEmployeeChange,
  onBack,
  onExecuteImport,
}: ImportPreviewTabsProps) {
  const [previewTab, setPreviewTab] = useState<'VALID' | 'DUPLICATES' | 'INVALID'>('VALID');

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      {/* KPI preview metrics */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setPreviewTab('VALID')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            previewTab === 'VALID' ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Valid Leads</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-foreground mt-0.5">
            {previewResult.validRows.length}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPreviewTab('DUPLICATES')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            previewTab === 'DUPLICATES' ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/30' : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Duplicates</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-foreground mt-0.5">
            {previewResult.duplicates.length}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPreviewTab('INVALID')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            previewTab === 'INVALID' ? 'ring-2 ring-red-500 bg-red-500/10 border-red-500/30' : 'bg-muted/30 border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-destructive uppercase">Invalid Rows</span>
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-xl font-extrabold text-foreground mt-0.5">
            {previewResult.invalidRows.length}
          </div>
        </button>
      </div>

      {/* Tab Details Table */}
      <div className="bg-muted/30 rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto">
        {previewTab === 'VALID' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-[10px] font-bold text-muted-foreground uppercase sticky top-0">
              <tr>
                <th className="py-2 px-3">Row</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Course / School</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {previewResult.validRows.slice(0, 50).map((row) => (
                <tr key={row.rowNumber}>
                  <td className="py-2 px-3 text-muted-foreground font-mono text-[10px]">{row.rowNumber}</td>
                  <td className="py-2 px-3 font-semibold text-foreground">{row.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{row.phoneNumber}</td>
                  <td className="py-2 px-3 text-muted-foreground">{row.company || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {previewTab === 'DUPLICATES' && (
          <div className="p-3 text-xs divide-y divide-border/60">
            {previewResult.duplicates.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">No duplicates found in this file.</div>
            ) : (
              previewResult.duplicates.map((dup, i) => (
                <div key={i} className="py-2 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-foreground">{dup.name}</span>
                    <span className="text-muted-foreground font-mono ml-2">({dup.phoneNumber})</span>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium text-[10px]">
                    {dup.reason === 'EXISTING_IN_DB' ? 'Already in Database' : 'Duplicate in file'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {previewTab === 'INVALID' && (
          <div className="p-3 text-xs divide-y divide-border/60">
            {previewResult.invalidRows.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">No invalid rows found.</div>
            ) : (
              previewResult.invalidRows.map((inv, i) => (
                <div key={i} className="py-2 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground">Row {inv.rowNumber}</span>
                  <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded font-medium text-[10px]">
                    {inv.error}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Staff Assignment Selector */}
      {previewResult.validRows.length > 0 && activeEmployees.length > 0 && (
        <div className="p-3.5 bg-muted/30 rounded-xl border border-border/80 space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Optional: Assign all imported leads to a Business Development Associate</span>
          </label>
          <ShadcnDropdownSelect
            value={assignedEmployeeId}
            onValueChange={onAssignedEmployeeChange}
            options={[
              { value: '', label: 'Leave Unassigned (Add to Pool)' },
              ...activeEmployees.map((emp) => ({
                value: emp.id,
                label: `${emp.name} (${emp.employeeCode})`,
              })),
            ]}
            placeholder="Select Business Development Associate or leave unassigned..."
            triggerClassName="bg-card"
          />
        </div>
      )}

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={loading || previewResult.validRows.length === 0}
          onClick={onExecuteImport}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Import {previewResult.validRows.length.toLocaleString()} Leads</span>
        </button>
      </div>
    </div>
  );
}
