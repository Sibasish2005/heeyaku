import { Role } from '@prisma/client';

export interface SquadLeaderboardItem {
  id: string;
  name: string;
  description: string | null;
  colorTag: string;
  teamLead: {
    id: string;
    name: string;
    employeeCode: string;
    email: string;
  } | null;
  activeMemberCount: number;
  totalLeads: number;
  convertedLeads: number;
  pipelineLeads: number;
  conversionRate: number;
  totalCalls: number;
  connectedCalls: number;
  totalTalkTimeSeconds: number;
  rank: number;
}

export interface TeamsLeaderboardProps {
  squads: SquadLeaderboardItem[];
  canManageTeams: boolean;
  currentUserRole: Role;
  currentTeamId?: string | null;
}
