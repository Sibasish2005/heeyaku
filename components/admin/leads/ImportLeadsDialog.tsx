'use client';

import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { parseImportFile, autoDetectColumnMapping, ColumnMapping, RawImportRow } from '@/lib/lead/import-parser';
import { validateAndPreviewImportAction, executeImportAction, fetchGoogleSheetDataAction, ImportPreviewResult } from '@/app/admin/leads/import-actions';
import ImportDropzone from './import/ImportDropzone';
import ImportColumnMapper from './import/ImportColumnMapper';
import ImportPreviewTabs from './import/ImportPreviewTabs';
import ImportCompleteCard from './import/ImportCompleteCard';

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

interface ImportLeadsDialogProps {
  isOpen: boolean;
  activeEmployees: ActiveEmployee[];
  onClose: () => void;
  onImportSuccess?: () => void;
}

type Step = 'DROPZONE' | 'MAPPING' | 'PREVIEW' | 'DONE';

export default function ImportLeadsDialog({
  isOpen,
  activeEmployees,
  onClose,
  onImportSuccess,
}: ImportLeadsDialogProps) {
  const [step, setStep] = useState<Step>('DROPZONE');
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [isGoogleSheet, setIsGoogleSheet] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawImportRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ nameCol: '', phoneCol: '' });
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [importSummary, setImportSummary] = useState<{ count: number; assignedEmployee?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('DROPZONE');
    setFile(null);
    setSourceName('');
    setIsGoogleSheet(false);
    setHeaders([]); setRawRows([]); setMapping({ nameCol: '', phoneCol: '' });
    setPreviewResult(null); setAssignedEmployeeId(''); setImportSummary(null); setError(null);
  };

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setLoading(true); setError(null);
      const parsed = await parseImportFile(selectedFile);
      if (!parsed.headers.length || !parsed.rows.length) throw new Error('Spreadsheet appears empty.');
      setFile(selectedFile);
      setSourceName(selectedFile.name);
      setIsGoogleSheet(false);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(autoDetectColumnMapping(parsed.headers));
      setStep('MAPPING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally { setLoading(false); }
  };

  const handleGoogleSheetSubmit = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchGoogleSheetDataAction(url);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch data from Google Sheet.');
      }
      setFile(null);
      setSourceName(res.data.sheetTitle);
      setIsGoogleSheet(true);
      setHeaders(res.data.headers);
      setRawRows(res.data.rows);
      setMapping(autoDetectColumnMapping(res.data.headers));
      setStep('MAPPING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPreview = async () => {
    if (!mapping.nameCol || !mapping.phoneCol) {
      setError('Please map both Name and Phone Number columns.'); return;
    }
    try {
      setLoading(true); setError(null);
      const defaultSource = isGoogleSheet ? 'Google Sheets' : 'File Import';
      const mappedRows = rawRows.map((r, i) => ({
        rowNumber: i + 2,
        name: String(r[mapping.nameCol] || ''),
        phoneNumber: String(r[mapping.phoneCol] || ''),
        email: mapping.emailCol ? String(r[mapping.emailCol] || '') : undefined,
        company: mapping.companyCol ? String(r[mapping.companyCol] || '') : undefined,
        source: mapping.sourceCol ? String(r[mapping.sourceCol] || '') : defaultSource,
        notes: mapping.notesCol ? String(r[mapping.notesCol] || '') : undefined,
      }));
      const res = await validateAndPreviewImportAction(mappedRows);
      if (!res.success || !res.data) throw new Error(res.error || 'Preview failed.');
      setPreviewResult(res.data); setStep('PREVIEW');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed.');
    } finally { setLoading(false); }
  };

  const handleExecute = async () => {
    if (!previewResult || !previewResult.validRows.length) return;
    try {
      setLoading(true); setError(null);
      const res = await executeImportAction({ leads: previewResult.validRows, assignedEmployeeId: assignedEmployeeId || undefined });
      if (!res.success || !res.data) throw new Error(res.error || 'Import failed.');
      setImportSummary({ count: res.data.insertedCount, assignedEmployee: res.data.assignedEmployeeName });
      setStep('DONE');
      onImportSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally { setLoading(false); }
  };

  const handleDownloadSample = () => {
    const csv = 'data:text/csv;charset=utf-8,Name,Phone,Email,Course/Interest,Source,Notes\nRahul Sharma,9876543210,rahul@example.com,Full Stack Web Dev,Facebook Ads,Morning batch\n';
    const a = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: 'leads_sample_template.csv' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Bulk Import Leads</h3>
              <p className="text-xs text-muted-foreground font-medium truncate">
                {step === 'DROPZONE' && 'Upload CSV, Excel, or link a Google Sheet'}
                {step === 'MAPPING' && 'Match your spreadsheet columns'}
                {step === 'PREVIEW' && 'Review validation results before import'}
                {step === 'DONE' && 'Import complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        {step === 'DROPZONE' && (
          <ImportDropzone
            onFileSelect={handleFileSelect}
            onGoogleSheetSubmit={handleGoogleSheetSubmit}
            onDownloadSample={handleDownloadSample}
            loading={loading}
          />
        )}
        {step === 'MAPPING' && (
          <ImportColumnMapper
            fileName={sourceName || file?.name || 'Spreadsheet'}
            rowCount={rawRows.length}
            headers={headers}
            mapping={mapping}
            loading={loading}
            isGoogleSheet={isGoogleSheet}
            onMappingChange={setMapping}
            onBack={() => setStep('DROPZONE')}
            onProceed={handleProceedToPreview}
          />
        )}
        {step === 'PREVIEW' && previewResult && (
          <ImportPreviewTabs
            previewResult={previewResult}
            activeEmployees={activeEmployees}
            assignedEmployeeId={assignedEmployeeId}
            loading={loading}
            onAssignedEmployeeChange={setAssignedEmployeeId}
            onBack={() => setStep('MAPPING')}
            onExecuteImport={handleExecute}
          />
        )}
        {step === 'DONE' && importSummary && (
          <ImportCompleteCard
            count={importSummary.count}
            assignedEmployee={importSummary.assignedEmployee}
            onReset={handleReset}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
