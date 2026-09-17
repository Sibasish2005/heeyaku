'use client';

import React, { useRef } from 'react';
import { Upload, Download } from 'lucide-react';

interface ImportDropzoneProps {
  onFileSelect: (file: File) => void;
  onDownloadSample: () => void;
}

export default function ImportDropzone({
  onFileSelect,
  onDownloadSample,
}: ImportDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-[#2563EB] hover:bg-[#2563EB]/5 bg-muted/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-xs font-semibold text-foreground">
          Click to upload or drag & drop CSV or Excel spreadsheet
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          .CSV, .XLSX, or .XLS files (up to 25,000 rows per batch)
        </p>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Need a starting template?</div>
          <div className="text-[11px] text-muted-foreground">Download a pre-formatted sample spreadsheet.</div>
        </div>
        <button
          type="button"
          onClick={onDownloadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted/60 rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Download Sample</span>
        </button>
      </div>
    </div>
  );
}
