import { LeadStatus } from '@prisma/client';

export interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

export interface LeadListItem {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  assignedEmployeeId: string | null;
  assignedAt: string | null;
  createdAt: string;
  assignedEmployee: {
    id: string;
    employeeCode: string;
    name: string;
  } | null;
}

export const LEAD_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-blue-50 text-blue-700 border-blue-200/80' },
  ASSIGNED: { label: 'Assigned', className: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' },
  CONTACTED: { label: 'Contacted', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  INTERESTED: { label: 'Interested', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
  FOLLOW_UP: { label: 'Follow-up needed', className: 'bg-blue-50 text-blue-700 border-blue-200/80' },
  CALL_BACK: { label: 'Call back later', className: 'bg-cyan-50 text-cyan-700 border-cyan-200/80' },
  NOT_INTERESTED: { label: 'Not interested', className: 'bg-red-50 text-red-700 border-red-200/80' },
  NO_ANSWER: { label: 'No answer', className: 'bg-amber-50 text-amber-700 border-amber-200/80' },
  BUSY: { label: 'Busy', className: 'bg-orange-50 text-orange-700 border-orange-200/80' },
  WRONG_NUMBER: { label: 'Wrong number', className: 'bg-slate-100 text-slate-600 border-slate-300' },
  CONVERTED: { label: 'Converted', className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold' },
  NOT_QUALIFIED: { label: 'Not qualified', className: 'bg-orange-50 text-orange-800 border-orange-200/80' },
  OTHER: { label: 'Other', className: 'bg-purple-50 text-purple-700 border-purple-200/80' },
};
