export type TimeFrame = 'TODAY' | 'MONTH' | 'LIFETIME';

export interface LeadCallLogSummary {
  id: string;
  phoneNumber?: string;
  durationSeconds: number;
  connected: boolean;
  startedAt: string;
  outcomeId: string | null;
  outcomeLabel: string | null;
  notes?: string | null;
}

export interface LeadItem {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  company: string | null;
  status: string;
  source: string;
  assignedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  callLogs?: LeadCallLogSummary[];
  totalCallDurationSeconds?: number;
  callCount?: number;
}

export const MOBILE_OUTCOMES = [
  { id: 'interested', key: 'INTERESTED', label: 'Interested', color: '#10B981', dotClass: 'bg-emerald-500' },
  { id: 'follow_up', key: 'FOLLOW_UP', label: 'Follow-up needed', color: '#3B82F6', dotClass: 'bg-blue-500' },
  { id: 'call_back', key: 'CALL_BACK', label: 'Call back later', color: '#06B6D4', dotClass: 'bg-cyan-500' },
  { id: 'not_interested', key: 'NOT_INTERESTED', label: 'Not interested', color: '#EF4444', dotClass: 'bg-red-500' },
  { id: 'no_answer', key: 'NO_ANSWER', label: 'No answer', color: '#F59E0B', dotClass: 'bg-amber-500' },
  { id: 'busy', key: 'BUSY', label: 'Busy', color: '#EA580C', dotClass: 'bg-orange-600' },
  { id: 'wrong_number', key: 'WRONG_NUMBER', label: 'Wrong number', color: '#64748B', dotClass: 'bg-slate-500' },
  { id: 'converted', key: 'CONVERTED', label: 'Converted', color: '#059669', dotClass: 'bg-emerald-600' },
  { id: 'not_qualified', key: 'NOT_QUALIFIED', label: 'Not qualified', color: '#F97316', dotClass: 'bg-orange-500' },
  { id: 'other', key: 'OTHER', label: 'Other', color: '#8B5CF6', dotClass: 'bg-purple-500' },
];

export interface PipelineStatusConfig {
  key: string;
  label: string;
  dotClass: string;
}

export const PIPELINE_STATUSES: PipelineStatusConfig[] = [
  { key: 'NEW', label: 'New', dotClass: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'ASSIGNED', label: 'Assigned', dotClass: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'CONTACTED', label: 'Contacted', dotClass: 'bg-[#2563EB] dark:bg-blue-400' },
  { key: 'INTERESTED', label: 'Interested', dotClass: 'bg-[#2563EB] dark:bg-blue-400' },
  { key: 'FOLLOW_UP', label: 'Follow-up', dotClass: 'bg-[#2563EB] dark:bg-blue-400' },
  { key: 'CALL_BACK', label: 'Call back', dotClass: 'bg-[#2563EB] dark:bg-blue-400' },
  { key: 'NO_ANSWER', label: 'No answer', dotClass: 'bg-amber-500' },
  { key: 'BUSY', label: 'Busy', dotClass: 'bg-amber-500' },
  { key: 'NOT_INTERESTED', label: 'Not interested', dotClass: 'bg-red-500' },
  { key: 'WRONG_NUMBER', label: 'Wrong number', dotClass: 'bg-red-500' },
  { key: 'NOT_QUALIFIED', label: 'Not qualified', dotClass: 'bg-red-500' },
  { key: 'CONVERTED', label: 'Converted', dotClass: 'bg-emerald-500' },
  { key: 'OTHER', label: 'Other', dotClass: 'bg-slate-400 dark:bg-slate-500' },
];

export const STATUS_BADGE_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  ASSIGNED: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  CONTACTED: 'bg-muted text-foreground border-border',
  INTERESTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  FOLLOW_UP: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  CALL_BACK: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  NOT_INTERESTED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  NO_ANSWER: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  BUSY: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  WRONG_NUMBER: 'bg-muted text-muted-foreground border-border',
  CONVERTED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-extrabold',
  NOT_QUALIFIED: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  OTHER: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

export interface CallLogItem {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  callType: string;
  durationSeconds: number;
  connected: boolean;
  outcomeId: string | null;
  outcomeLabel: string | null;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  lead?: {
    id: string;
    name: string;
    leadCode: string;
  } | null;
}

export function formatSecondsDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

