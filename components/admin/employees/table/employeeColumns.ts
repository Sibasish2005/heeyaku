import { createColumnHelper } from '@tanstack/react-table';
import { EmployeeListItem } from './types';

const columnHelper = createColumnHelper<EmployeeListItem>();

export const employeeColumns = [
  columnHelper.accessor('name', { header: 'Staff Member' }),
  columnHelper.accessor('phoneNumber', { header: 'Contact Info' }),
  columnHelper.accessor('team', { header: 'Role' }),
  columnHelper.accessor('isActive', { header: 'Account Status' }),
  columnHelper.accessor((row) => row._count.leads, { id: 'leads', header: 'Assigned Leads' }),
  columnHelper.accessor('createdAt', { header: 'Joined Date' }),
  columnHelper.display({ id: 'actions', header: 'Actions' }),
];
