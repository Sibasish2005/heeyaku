'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Link2,
  ArrowRight,
  Loader2,
  Info,
  X,
  ClipboardPaste,
  FileText,
} from 'lucide-react';

interface ImportDropzoneProps {
  mode: 'file' | 'sheets';
  onFileSelect: (file: File) => void;
  onGoogleSheetSubmit: (url: string) => Promise<void>;
  onTextSubmit?: (text: string) => void;
  onDownloadSample: () => void;
  loading?: boolean;
}

export default function ImportDropzone({
  mode,
  onFileSelect,
  onGoogleSheetSubmit,
  onTextSubmit,
  onDownloadSample,
  loading = false,
}: ImportDropzoneProps) {
  // For file/manual mode: allow file drop/browse OR direct text paste
  const [manualSubTab, setManualSubTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // For sheets mode
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSheetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = sheetUrl.trim();
    if (!cleanUrl) {
      setSheetError('Please paste your Google Sheet link.');
      return;
    }
    if (!cleanUrl.includes('docs.google.com/spreadsheets')) {
      setSheetError('Invalid URL. Please provide a valid Google Sheets URL (https://docs.google.com/spreadsheets/...)');
      return;
    }
    setSheetError(null);
    await onGoogleSheetSubmit(cleanUrl);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSheetUrl(text.trim());
        setSheetError(null);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  const handlePastedTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pastedText.trim();
    if (!clean) {
      setManualError('Please paste tabular or CSV text.');
      return;
    }
    setManualError(null);
    if (onTextSubmit) {
      onTextSubmit(clean);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      {/* MODE 1: Google Sheet Import */}
      {mode === 'sheets' && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">Import from Google Sheet</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect and import prospect data directly from a public Google Sheets document.
              </p>
            </div>
          </div>

          {sheetError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {sheetError}
            </div>
          )}

          {/* URL Input Form */}
          <form onSubmit={handleSheetSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Google Spreadsheet URL <span className="text-destructive">*</span></span>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste from clipboard</span>
                </button>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    if (sheetError) setSheetError(null);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/1b4y4a0PKJGuzSuR.../edit#gid=0"
                  disabled={loading}
                  className="w-full pl-9 pr-8 py-2.5 bg-background border border-border focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors"
                />
                {sheetUrl && (
                  <button
                    type="button"
                    onClick={() => setSheetUrl('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !sheetUrl.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Google Sheet Data...</span>
                </>
              ) : (
                <>
                  <span>Fetch & Map Leads</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Guide Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
              <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>How to make sure your Google Sheet is accessible:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Open your spreadsheet in Google Sheets.</li>
              <li>Click the green/blue <strong>Share</strong> button in the top-right corner.</li>
              <li>Under General access, select <strong>&quot;Anyone with the link&quot;</strong> as <strong>Viewer</strong>.</li>
              <li>Copy and paste the URL from your browser address bar into the field above.</li>
              <li>Ensure the first row has column headers (e.g. <em>Name, Phone, Email, Course</em>).</li>
            </ol>
          </div>
        </div>
      )}

      {/* MODE 2: Manual Import (File Upload or Raw Data Paste) */}
      {mode === 'file' && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          {/* Sub-tab Switcher: Upload File vs Paste Data */}
          <div className="p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setManualSubTab('upload');
                setManualError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                manualSubTab === 'upload'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#2563EB]" />
              <span>Upload File (.csv, .xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setManualSubTab('paste');
                setManualError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                manualSubTab === 'paste'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span>Paste CSV / Text Data</span>
            </button>
          </div>

          {manualError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {manualError}
            </div>
          )}

          {manualSubTab === 'upload' ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-[#2563EB] hover:bg-[#2563EB]/5 bg-muted/20 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
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

              <div className="p-3.5 sm:p-4 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-foreground">Need a starting template?</div>
                  <div className="text-[11px] text-muted-foreground truncate">Download a pre-formatted sample spreadsheet.</div>
                </div>
                <button
                  type="button"
                  onClick={onDownloadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted/60 rounded-xl transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Download Sample</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Paste Tabular or CSV Data (with Headers)</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const txt = await navigator.clipboard.readText();
                        if (txt) setPastedText(txt);
                      } catch {}
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste from clipboard</span>
                  </button>
                </label>
                <textarea
                  rows={7}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (manualError) setManualError(null);
                  }}
                  placeholder={'Name, Phone, Email, Course\nRahul Sharma, 9876543210, rahul@example.com, Full Stack\nPriya Patel, 9876543211, priya@example.com, Data Science'}
                  className="w-full p-3 font-mono text-xs bg-background border border-border focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-xl text-foreground placeholder:text-muted-foreground/50 transition-colors resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handlePastedTextSubmit}
                disabled={loading || !pastedText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing Pasted Data...</span>
                  </>
                ) : (
                  <>
                    <span>Process & Map Leads</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
