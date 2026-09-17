import { LeadListItem } from './types';
import { downloadLeadsAsCsv, downloadLeadsAsXlsx } from '@/lib/lead/export';

export function exportLeadsDataset(
  format: 'xlsx' | 'csv', 
  dataset: LeadListItem[], 
  prefix: string
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const exportData = dataset.map((l) => ({
    leadCode: l.leadCode,
    name: l.name,
    phoneNumber: l.phoneNumber,
    email: l.email,
    company: l.company,
    source: l.source,
    status: l.status,
    assignedEmployeeCode: l.assignedEmployee?.employeeCode || null,
    assignedEmployeeName: l.assignedEmployee?.name || null,
    assignedAt: l.assignedAt,
    createdAt: l.createdAt,
    notes: l.notes,
  }));

  if (format === 'xlsx') {
    downloadLeadsAsXlsx(exportData, `HEEYAKU_Leads_${prefix}_${timestamp}.xlsx`);
  } else {
    downloadLeadsAsCsv(exportData, `HEEYAKU_Leads_${prefix}_${timestamp}.csv`);
  }
}
