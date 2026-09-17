export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  team: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    leads: number;
    callLogs?: number;
  };
  totalCalls?: number;
  totalTalkTimeSeconds?: number;
}


export interface EmployeeTableProps {
  initialEmployees: EmployeeListItem[];
  totalEmployeesCount: number;
  initialTeams?: string[];
}
