import { createColumnHelper } from '@tanstack/react-table';
import { LeadListItem } from './types';

const columnHelper = createColumnHelper<LeadListItem>();

export function getLeadTableColumns() {
  return [
    columnHelper.accessor('id', { header: 'Select' }),
    columnHelper.accessor('leadCode', { header: 'Code No' }),
    columnHelper.accessor('name', { header: 'Lead Name' }),
    columnHelper.accessor('phoneNumber', { header: 'Phone No' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('company', { header: 'Target Course / School' }),
    columnHelper.accessor('status', { header: 'Status' }),
    columnHelper.accessor((row) => row.assignedEmployee?.name || 'Unassigned', {
      id: 'associate',
      header: 'BDA',
    }),
    columnHelper.accessor('createdAt', { header: 'Added On' }),
    columnHelper.display({ id: 'action', header: 'Action' }),
  ];
}
