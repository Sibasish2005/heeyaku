import { LeadStatus } from '@prisma/client';

export interface ProspectItem {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  isProspect: boolean;
  promotedToProspectAt: string | null;
  createdAt: string;
  updatedAt: string;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    colorTag: string | null;
  } | null;
  assignedEmployeeId: string | null;
  assignedEmployee: {
    id: string;
    employeeCode: string;
    name: string;
    role: string;
  } | null;
  originalBdaId: string | null;
  originalBda: {
    id: string;
    employeeCode: string;
    name: string;
  } | null;
  recentCallLogs: Array<{
    id: string;
    durationSeconds: number;
    connected: boolean;
    startedAt: string;
    outcomeLabel: string | null;
    notes: string | null;
  }>;
}

export interface TeamLeadSummary {
  id: string;
  name: string;
  employeeCode: string;
  teamName: string | null;
  teamId: string | null;
  totalProspects: number;
  inPipeline: number;
  converted: number;
  conversionRate: string;
}

export const PROSPECT_STATUS_META: Record<
  string,
  { label: string; badgeClass: string; dotClass: string; description: string }
> = {
  INTERESTED: {
    label: 'Interested',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    description: 'Lead expressed initial interest. Ready for callback or demo.',
  },
  CALL_BACK: {
    label: 'Call Back Later',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
    dotClass: 'bg-cyan-500',
    description: 'Requested scheduled discussion at a specific date/time.',
  },
  FOLLOW_UP: {
    label: 'Follow-Up Needed',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    dotClass: 'bg-blue-500',
    description: 'Requires brochure or commercial terms follow-up.',
  },
  CONVERTED: {
    label: 'Converted / Won',
    badgeClass: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30',
    dotClass: 'bg-emerald-600 animate-pulse',
    description: 'Successfully closed! Deal won.',
  },
  NOT_INTERESTED: {
    label: 'Not Interested',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    dotClass: 'bg-red-500',
    description: 'Declined after Team Lead pitch.',
  },
  NOT_QUALIFIED: {
    label: 'Not Qualified',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500',
    description: 'Budget or eligibility criteria not met.',
  },
  OTHER: {
    label: 'Other',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    dotClass: 'bg-purple-500',
    description: 'Custom status or special consideration.',
  },
};
