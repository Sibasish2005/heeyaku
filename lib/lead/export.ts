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
}

/**
 * Formats lead records into clean, user-friendly rows for CSV/XLSX export.
 * Excludes all sensitive internal IDs and hashes.
 */
export function formatLeadsForExport(leads: LeadExportData[]) {
  return leads.map((lead) => ({
    'Lead ID': lead.leadCode,
    'Prospect Name': lead.name,
    'Phone Number': lead.phoneNumber,
    'Email Address': lead.email || '',
    'Target Course / School': lead.company || '',
    'Pipeline Status': lead.status,
    'Lead Source': lead.source,
    'Assigned Staff ID': lead.assignedEmployeeCode || 'Unassigned',
    'Assigned Staff Name': lead.assignedEmployeeName || 'Unassigned',
    'Assigned Date': lead.assignedAt ? new Date(lead.assignedAt).toLocaleDateString('en-IN') : '',
    'Date Registered': new Date(lead.createdAt).toLocaleDateString('en-IN'),
    'Notes / Remarks': lead.notes || '',
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
