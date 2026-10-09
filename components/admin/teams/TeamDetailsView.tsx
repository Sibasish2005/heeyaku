'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  PhoneCall,
  Clock,
  Trophy,
  Edit,
  UserPlus,
  Trash2,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  Filter,
  Flame,
  Search,
  UserMinus,
  Sparkles,
} from 'lucide-react';
import { removeBdaFromTeamAction, deleteTeamAction } from '@/app/admin/employees/actions';
import EditTeamModal from './EditTeamModal';
import AddBdasToTeamModal from './AddBdasToTeamModal';
import { toast } from 'sonner';

export interface SquadMemberBda {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  totalLeads: number;
  convertedLeads: number;
  totalCalls: number;
  totalTalkTimeSeconds: number;
}

export interface SquadRecentLead {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  assignedEmployeeName: string | null;
  createdAt: string;
}

interface TeamDetailsViewProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    colorTag: string | null;
    createdAt: string;
    teamLead: {
      id: string;
      name: string;
      employeeCode: string;
      email: string;
      phoneNumber: string;
      isActive: boolean;
    } | null;
  };
  members: SquadMemberBda[];
  stats: {
    totalLeads: number;
    convertedLeads: number;
    pipelineLeads: number;
    conversionRate: number;
    totalCalls: number;
    connectedCalls: number;
    totalTalkTimeSeconds: number;
    rank: number;
    totalSquads: number;
  };
  recentLeads: SquadRecentLead[];
  canManage: boolean;
  currentUserRole: string;
}

export default function TeamDetailsView({
  team,
  members,
  stats,
  recentLeads,
  canManage,
  currentUserRole,
}: TeamDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'roster' | 'leads' | 'settings'>('roster');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddBdaOpen, setIsAddBdaOpen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTalkTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleRemoveBda = async (bdaId: string, bdaName: string) => {
    if (!confirm(`Are you sure you want to remove ${bdaName} from squad ${team.name}?`)) {
      return;
    }
    setRemovingId(bdaId);
    try {
      const res = await removeBdaFromTeamAction(team.id, bdaId);
      if (res.success) {
        toast.success(`Removed ${bdaName} from ${team.name}.`);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to remove BDA.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleDeleteSquad = async () => {
    const confirmName = prompt(
      `DANGER ZONE: Type "${team.name}" to confirm dissolving this squad. Leads and members will be safely unlinked.`
    );
    if (confirmName !== team.name) {
      if (confirmName !== null) toast.error('Squad name did not match.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteTeamAction(team.id);
      if (res.success) {
        toast.success(`Squad ${team.name} dissolved.`);
        router.push('/admin/teams');
      } else {
        toast.error(res.error || 'Failed to delete squad.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = rosterSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.employeeCode.toLowerCase().includes(q) ||
      m.phoneNumber.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/teams"
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Back to Teams Leaderboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: team.colorTag || '#2563EB' }}
              />
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {team.name}
              </h1>
              {stats.rank <= 3 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    stats.rank === 1
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : stats.rank === 2
                      ? 'bg-slate-400/15 text-slate-500 border border-slate-400/30'
                      : 'bg-amber-700/15 text-amber-700 border border-amber-700/30'
                  }`}
                >
                  #{stats.rank} in League
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {team.description}
              </p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddBdaOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add BDAs</span>
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-foreground bg-card border border-border hover:bg-muted rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </button>
          </div>
        )}
      </div>

      {/* Hero Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Team Lead Card */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Team Lead</span>
          </div>
          {team.teamLead ? (
            <div>
              <div className="font-extrabold text-foreground text-sm line-clamp-1">
                {team.teamLead.name}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {team.teamLead.employeeCode}
              </div>
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                {team.teamLead.phoneNumber}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic pt-1">
              Unassigned Lead
            </div>
          )}
        </div>

        {/* Active BDAs */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Active BDAs</span>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {members.length}
          </div>
          <div className="text-[10px] text-muted-foreground">
            In sales rotation
          </div>
        </div>

        {/* Total Leads & Pipeline */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-500" />
            <span>Assigned Leads</span>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {stats.totalLeads}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {stats.pipelineLeads} in active pipeline
          </div>
        </div>

        {/* Clients Acquired / Conversion */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Clients Acquired</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.convertedLeads}
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.conversionRate.toFixed(1)}% conversion
          </div>
        </div>

        {/* Telephony Velocity */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
            <span>Talk Time</span>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            {formatTalkTime(stats.totalTalkTimeSeconds)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {stats.totalCalls} total calls ({stats.connectedCalls} connected)
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative cursor-pointer ${
            activeTab === 'roster'
              ? 'text-[#2563EB] dark:text-blue-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Squad Roster ({members.length} BDAs)</span>
          {activeTab === 'roster' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative cursor-pointer ${
            activeTab === 'leads'
              ? 'text-[#2563EB] dark:text-blue-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Lead Pipeline ({stats.totalLeads} Leads)</span>
          {activeTab === 'leads' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
          )}
        </button>

        {canManage && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-bold transition-colors relative cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#2563EB] dark:text-blue-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Squad Settings</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
            )}
          </button>
        )}
      </div>

      {/* TAB 1: SQUAD ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search squad BDAs..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-input bg-card focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>

            {canManage && (
              <button
                onClick={() => setIsAddBdaOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add BDA</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Sales Associate (BDA)</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Assigned Leads</th>
                    <th className="py-3 px-4 text-center">Converted</th>
                    <th className="py-3 px-4 text-center">Calls</th>
                    <th className="py-3 px-4 text-center">Talk Time</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                        <div className="text-sm font-semibold text-foreground">
                          {members.length === 0 ? 'No BDAs in this squad yet' : 'No matching BDAs found'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {canManage && members.length === 0
                            ? 'Click "Add BDAs" above to assign sales reps to this squad.'
                            : 'Try adjusting your search criteria.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/employees/${m.id}`}
                            className="font-bold text-foreground hover:text-blue-600 transition-colors flex items-center gap-1.5"
                          >
                            <span>{m.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({m.employeeCode})
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 opacity-60" />
                            <span>{m.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                            <Mail className="w-3 h-3 opacity-60" />
                            <span>{m.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {m.totalLeads}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {m.convertedLeads}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {m.totalCalls}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {formatTalkTime(m.totalTalkTimeSeconds)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              m.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveBda(m.id, m.name)}
                              disabled={removingId === m.id}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Remove from squad"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAD PIPELINE */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">
              Recent Leads Assigned to {team.name}
            </h3>
            <Link
              href={`/admin/leads?teamId=${team.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
            >
              <span>Open in Full Leads Table</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned BDA</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                        <div className="text-sm font-semibold text-foreground">No leads assigned to this squad yet</div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Use the Leads page to assign sales opportunities to this squad.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">
                          {lead.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {lead.phoneNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.status === 'CONVERTED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : lead.status === 'INTERESTED'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {lead.assignedEmployeeName || (
                            <span className="italic text-[11px]">Unassigned Rep</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground font-mono text-[11px]">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SQUAD SETTINGS (CEO/HR ONLY) */}
      {activeTab === 'settings' && canManage && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-extrabold text-base text-foreground">
              Squad Information & Leadership
            </h3>
            <p className="text-xs text-muted-foreground">
              Modify the squad name, mandate description, color accent, or reassign team leadership.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Open Squad Editor</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-3">
            <h4 className="font-bold text-sm text-destructive flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone: Dissolve Squad</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Dissolving this squad will safely unassign all BDAs back to the general pool and clear the squad assignment on leads without deleting the lead records.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDeleteSquad}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-destructive hover:bg-destructive/90 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Dissolving...' : 'Dissolve Squad'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditTeamModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        team={{
          id: team.id,
          name: team.name,
          description: team.description,
          colorTag: team.colorTag,
          teamLeadId: team.teamLead ? team.teamLead.id : null,
        }}
        onUpdated={() => {
          router.refresh();
        }}
      />

      <AddBdasToTeamModal
        isOpen={isAddBdaOpen}
        onClose={() => setIsAddBdaOpen(false)}
        teamId={team.id}
        teamName={team.name}
        onAdded={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
