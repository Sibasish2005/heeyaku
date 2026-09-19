import * as XLSX from 'xlsx';

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

function sanitizeCell(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Formats lead records into clean, user-friendly rows for CSV/XLSX export.
 * Neutralizes spreadsheet formula injection and excludes internal hashes.
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
 * Generates and triggers browser download of an XLSX file.
 */
export function downloadLeadsAsXlsx(leads: LeadExportData[], filename: string) {
  const formatted = formatLeadsForExport(leads);
  const worksheet = XLSX.utils.json_to_sheet(formatted);

  // Auto-size column widths
  const colWidths = Object.keys(formatted[0] || {}).map((key) => ({
    wch: Math.max(key.length, 14),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Generates and triggers browser download of a CSV file.
 */
export function downloadLeadsAsCsv(leads: LeadExportData[], filename: string) {
  const formatted = formatLeadsForExport(leads);
  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
