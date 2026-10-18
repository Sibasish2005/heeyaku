import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface LeadExportData {
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  assignedEmployeeCode?: string | null;
  assignedEmployeeName?: string | null;
  assignedAt?: string | Date | null;
  createdAt: string | Date;
  notes?: string | null;
  totalCallDuration?: string | null;
  eachCallDurations?: string | null;
  callCount?: number | null;
}

/**
 * Sanitizes spreadsheet cell content to prevent CSV/Formula injection attacks (CWE-1236).
 * Prepends a single quote if string begins with dangerous formula trigger characters (=, +, -, @, tab, CR).
 *
 * @param val - The cell value to sanitize
 * @returns {string} Sanitized string safe for spreadsheet insertion
 */
function sanitizeCell(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  const trimmed = str.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Transforms raw database lead records into sanitized, formatted rows for spreadsheet export.
 * Formats timestamps to Indian locale (en-IN), resolves unassigned employee placeholders,
 * and escapes formulas.
 *
 * @param leads - Array of LeadExportData objects
 * @returns {Array<Record<string, string>>} Sanitized export-ready row objects with friendly column names
 */
export function formatLeadsForExport(leads: LeadExportData[]) {
  return leads.map((lead) => ({
    'Lead ID': sanitizeCell(lead.leadCode),
    'Prospect Name': sanitizeCell(lead.name),
    'Phone Number': sanitizeCell(lead.phoneNumber),
    'Email Address': sanitizeCell(lead.email),
    'Target Course / School': sanitizeCell(lead.company),
    'Pipeline Status': sanitizeCell(lead.status),
    'Call Count': lead.callCount !== undefined && lead.callCount !== null ? String(lead.callCount) : '',
    'Total Talk Time': sanitizeCell(lead.totalCallDuration),
    'Each Call Duration': sanitizeCell(lead.eachCallDurations),
    'Lead Source': sanitizeCell(lead.source),
    'Assigned Staff ID': sanitizeCell(lead.assignedEmployeeCode || 'Unassigned'),
    'Assigned Staff Name': sanitizeCell(lead.assignedEmployeeName || 'Unassigned'),
    'Assigned Date': lead.assignedAt ? new Date(lead.assignedAt).toLocaleDateString('en-IN') : '',
    'Date Registered': new Date(lead.createdAt).toLocaleDateString('en-IN'),
    'Notes / Remarks': sanitizeCell(lead.notes),
  }));
}

/**
 * Generates an Excel (.xlsx) spreadsheet workbook from lead data and triggers browser file download.
 * Automatically computes appropriate column widths.
 *
 * @param leads - Array of lead data objects
 * @param filename - Base or complete filename for the downloaded file (e.g. 'Heeyaku_Leads_2026')
 */
export async function downloadLeadsAsXlsx(leads: LeadExportData[], filename: string): Promise<void> {
  const formatted = formatLeadsForExport(leads);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  if (formatted.length > 0) {
    const headers = Object.keys(formatted[0]);
    worksheet.columns = headers.map((key) => ({
      header: key,
      key: key,
      width: Math.max(key.length + 2, 14),
    }));

    for (const row of formatted) {
      worksheet.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a comma-separated values (.csv) file from lead data and triggers browser file download.
 * Creates an in-memory Blob and triggers download via programmatic anchor element click.
 *
 * @param leads - Array of lead data objects
 * @param filename - Base or complete filename for the downloaded file
 */
export function downloadLeadsAsCsv(leads: LeadExportData[], filename: string): void {
  const formatted = formatLeadsForExport(leads);
  const csv = Papa.unparse(formatted);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
