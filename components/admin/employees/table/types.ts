import { Role } from '@prisma/client';

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  role?: Role;
  team: string | null;
  teamId?: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    leads: number;
    callLogs?: number;
  };
  totalCalls?: number;
  connectedCalls?: number;
  totalTalkTimeSeconds?: number;
}

export interface EmployeeTableProps {
  initialEmployees: EmployeeListItem[];
  totalEmployeesCount: number;
  initialTeams?: string[];
  canManageEmployees?: boolean;
  currentUserRole?: Role;
}
