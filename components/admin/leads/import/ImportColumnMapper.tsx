'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Loader2, FileSpreadsheet } from 'lucide-react';
import { ColumnMapping } from '@/lib/lead/import-parser';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

interface ImportColumnMapperProps {
  fileName?: string;
  rowCount: number;
  headers: string[];
  mapping: ColumnMapping;
  loading: boolean;
  isGoogleSheet?: boolean;
  onMappingChange: (mapping: ColumnMapping) => void;
  onBack: () => void;
  onProceed: () => void;
}

export default function ImportColumnMapper({
  fileName,
  rowCount,
  headers,
  mapping,
  loading,
  isGoogleSheet = false,
  onMappingChange,
  onBack,
  onProceed,
}: ImportColumnMapperProps) {
  const headerOptions = headers.map((h) => ({ value: h, label: h }));
  const requiredOptions = [{ value: '', label: 'Select Column...' }, ...headerOptions];
  const skipOptions = [{ value: '', label: 'Skip / Not Provided' }, ...headerOptions];
  const defaultSourceLabel = isGoogleSheet ? 'Default to "Google Sheets"' : 'Default to "File Import"';
  const sourceOptions = [{ value: '', label: defaultSourceLabel }, ...headerOptions];

  const canProceed = Boolean(mapping.nameCol && mapping.phoneCol);

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isGoogleSheet ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#2563EB]'}`} />
          <span className="truncate">
            {isGoogleSheet ? 'Sheet: ' : 'File: '}
            <span className="font-semibold text-foreground">{fileName}</span> ({rowCount.toLocaleString()} rows found)
          </span>
        </div>
        <button
          onClick={onBack}
          type="button"
          className="text-[11px] font-semibold text-[#2563EB] hover:underline shrink-0 ml-2 cursor-pointer"
        >
          Change Source
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Prospect Name Column <span className="text-destructive">*</span>
          </label>
          <ShadcnDropdownSelect
            value={mapping.nameCol}
            onValueChange={(val) => onMappingChange({ ...mapping, nameCol: val })}
            options={requiredOptions}
            placeholder="Select Prospect Name column..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Phone Number Column <span className="text-destructive">*</span>
          </label>
          <ShadcnDropdownSelect
            value={mapping.phoneCol}
            onValueChange={(val) => onMappingChange({ ...mapping, phoneCol: val })}
            options={requiredOptions}
            placeholder="Select Phone Number column..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Email Address Column</label>
          <ShadcnDropdownSelect
            value={mapping.emailCol || ''}
            onValueChange={(val) => onMappingChange({ ...mapping, emailCol: val || undefined })}
            options={skipOptions}
            placeholder="Skip / Not Provided"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Target Course / School</label>
          <ShadcnDropdownSelect
            value={mapping.companyCol || ''}
            onValueChange={(val) => onMappingChange({ ...mapping, companyCol: val || undefined })}
            options={skipOptions}
            placeholder="Skip / Not Provided"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Lead Source</label>
          <ShadcnDropdownSelect
            value={mapping.sourceCol || ''}
            onValueChange={(val) => onMappingChange({ ...mapping, sourceCol: val || undefined })}
            options={sourceOptions}
            placeholder={defaultSourceLabel}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Notes / Inquiries</label>
          <ShadcnDropdownSelect
            value={mapping.notesCol || ''}
            onValueChange={(val) => onMappingChange({ ...mapping, notesCol: val || undefined })}
            options={skipOptions}
            placeholder="Skip / Not Provided"
          />
        </div>
      </div>

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
          disabled={loading || !canProceed}
          onClick={onProceed}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Preview & Validate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
