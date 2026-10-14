'use client';

import React, { useState, useTransition } from 'react';
import {
  CompanyAdminItem,
  SuperAdminDashboardStats,
  toggleCompanySuspensionAction,
  approveCompanyAction,
  rejectCompanyAction,
  updateCompanySeatsAction,
  extendCompanyTrialAction,
  impersonateCompanyAction,
  clearImpersonationAction,
  deleteCompanyAction,
} from '@/app/super-admin/actions';
import {
  Building2,
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Settings2,
  Trash2,
  Search,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowUpRight,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  initialStats: SuperAdminDashboardStats;
  initialPending: CompanyAdminItem[];
  initialActive: CompanyAdminItem[];
  impersonatingCompanyId: string | null;
  superAdminEmail: string;
}

export default function SuperAdminClientDashboard({
  initialStats,
  initialPending,
  initialActive,
  impersonatingCompanyId,
  superAdminEmail,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stats, setStats] = useState(initialStats);
  const [pendingCompanies, setPendingCompanies] = useState(initialPending);
  const [activeCompanies, setActiveCompanies] = useState(initialActive);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyAdminItem | null>(null);

  // Modal States
  const [approveModalCompany, setApproveModalCompany] = useState<CompanyAdminItem | null>(null);
  const [approvedBdasInput, setApprovedBdasInput] = useState(5);
  const [trialDaysInput, setTrialDaysInput] = useState(30);

  const [rejectModalCompany, setRejectModalCompany] = useState<CompanyAdminItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const [deleteModalCompany, setDeleteModalCompany] = useState<CompanyAdminItem | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // 1-Click Master Kill-Switch Toggle
  const handleToggleSuspension = async (company: CompanyAdminItem) => {
    startTransition(async () => {
      const res = await toggleCompanySuspensionAction(company.id);
      if (res.success && res.status) {
        toast.success(
          res.status === 'ACTIVE'
            ? `Workspace "${company.name}" has been restored and activated.`
            : `Workspace "${company.name}" has been suspended immediately.`
        );
        setActiveCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? { ...c, status: res.status! } : c))
        );
        if (selectedCompany?.id === company.id) {
          setSelectedCompany((prev) => (prev ? { ...prev, status: res.status! } : null));
        }
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to toggle suspension.');
      }
    });
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!approveModalCompany) return;
    startTransition(async () => {
      const res = await approveCompanyAction(approveModalCompany.id, approvedBdasInput, trialDaysInput);
      if (res.success) {
        toast.success(`Approved "${approveModalCompany.name}" with ${approvedBdasInput} BDA seats!`);
        setPendingCompanies((prev) => prev.filter((c) => c.id !== approveModalCompany.id));
        setActiveCompanies((prev) => [
          {
            ...approveModalCompany,
            status: 'ACTIVE',
            maxBdas: approvedBdasInput,
            trialDaysRemaining: trialDaysInput,
            isTrialExpired: false,
          },
          ...prev,
        ]);
        setApproveModalCompany(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to approve company.');
      }
    });
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectModalCompany) return;
    startTransition(async () => {
      const res = await rejectCompanyAction(rejectModalCompany.id, rejectReasonInput);
      if (res.success) {
        toast.info(`Company application for "${rejectModalCompany.name}" rejected.`);
        setPendingCompanies((prev) => prev.filter((c) => c.id !== rejectModalCompany.id));
        setRejectModalCompany(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to reject application.');
      }
    });
  };

  // Handle Seats Update
  const handleUpdateSeats = async (companyId: string, newMax: number) => {
    startTransition(async () => {
      const res = await updateCompanySeatsAction(companyId, newMax);
      if (res.success) {
        toast.success(`Updated caller seats to ${newMax}.`);
        setActiveCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, maxBdas: newMax } : c))
        );
        if (selectedCompany?.id === companyId) {
          setSelectedCompany((prev) => (prev ? { ...prev, maxBdas: newMax } : null));
        }
      } else {
        toast.error(res.error || 'Failed to update seats.');
      }
    });
  };

  // Handle Trial Extension
  const handleExtendTrial = async (companyId: string, extraDays: number) => {
    startTransition(async () => {
      const res = await extendCompanyTrialAction(companyId, extraDays);
      if (res.success) {
        toast.success(`Trial extended by ${extraDays} days!`);
        setActiveCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  trialDaysRemaining: (c.trialDaysRemaining || 0) + extraDays,
                  isTrialExpired: false,
                }
              : c
          )
        );
        if (selectedCompany?.id === companyId) {
          setSelectedCompany((prev) =>
            prev
              ? {
                  ...prev,
                  trialDaysRemaining: (prev.trialDaysRemaining || 0) + extraDays,
                  isTrialExpired: false,
                }
              : null
          );
        }
      } else {
        toast.error(res.error || 'Failed to extend trial.');
      }
    });
  };

  // Ghost Mode Impersonation
  const handleImpersonate = async (company: CompanyAdminItem) => {
    startTransition(async () => {
      const res = await impersonateCompanyAction(company.id);
      if (res.success) {
        toast.success(`Entered Ghost Mode for "${company.name}". Redirecting...`);
        window.location.href = '/admin/dashboard';
      } else {
        toast.error(res.error || 'Failed to enter ghost mode.');
      }
    });
  };

  const handleExitGhostMode = async () => {
    startTransition(async () => {
      await clearImpersonationAction();
      toast.info('Exited Ghost Mode.');
      window.location.reload();
    });
  };

  // Delete Company
  const handleDeleteCompany = async () => {
    if (!deleteModalCompany) return;
    startTransition(async () => {
      const res = await deleteCompanyAction(deleteModalCompany.id, deleteConfirmName);
      if (res.success) {
        toast.success(`Company "${deleteModalCompany.name}" deleted.`);
        setActiveCompanies((prev) => prev.filter((c) => c.id !== deleteModalCompany.id));
        setPendingCompanies((prev) => prev.filter((c) => c.id !== deleteModalCompany.id));
        if (selectedCompany?.id === deleteModalCompany.id) setSelectedCompany(null);
        setDeleteModalCompany(null);
        setDeleteConfirmName('');
      } else {
        toast.error(res.error || 'Confirmation name did not match.');
      }
    });
  };

  const filteredActive = activeCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ceoEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Ghost Mode Active Banner */}
      {impersonatingCompanyId && (
        <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold text-sm">
              Currently in Ghost Mode (Impersonating a tenant workspace)
            </span>
          </div>
          <button
            onClick={handleExitGhostMode}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition"
          >
            Exit Ghost Mode
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold tracking-wide uppercase">
              Platform Super Admin
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All Systems Live
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-2">
            Heeyaku Multi-Tenant Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global client directory, instant 1-click company kill-switches, and seat licensing.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right">
            <div className="text-xs text-slate-400">Authenticated Platform Owner</div>
            <div className="text-sm font-mono font-medium text-slate-200">{superAdminEmail}</div>
          </div>
          <a
            href="/admin/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition text-xs font-semibold"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            Primary Workspace
          </a>
        </div>
      </div>

      {/* 4 KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Workspaces</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalCompanies}</div>
            <div className="text-xs text-slate-400 mt-1">
              <span className="text-emerald-400 font-medium">{stats.activeCompanies} Active</span> · {stats.suspendedCompanies} Suspended
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCompanies.length}</div>
            <div className="text-xs text-slate-400 mt-1">Awaiting Super Admin verification</div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Telecallers</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalActiveBdas}</div>
            <div className="text-xs text-slate-400 mt-1">Licensed BDA mobile app users</div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Platform Leads</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalPlatformLeads.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">Across all tenant pipelines</div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* PENDING VERIFICATIONS QUEUE (If any exist) */}
      {pendingCompanies.length > 0 && (
        <div className="mb-10 rounded-2xl bg-slate-900/80 border border-amber-500/30 overflow-hidden shadow-lg">
          <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Pending Company Onboarding Verification ({pendingCompanies.length})</span>
            </div>
            <span className="text-xs text-amber-300/80">Action required before clients can log in</span>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingCompanies.map((comp) => (
              <div key={comp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{comp.name}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {comp.slug}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      Requested {comp.requestedBdas} BDAs
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                    {comp.ceoEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {comp.ceoEmail}
                      </span>
                    )}
                    {comp.phoneNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {comp.phoneNumber}
                      </span>
                    )}
                    {comp.industry && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {comp.industry}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Registered {new Date(comp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setApproveModalCompany(comp);
                      setApprovedBdasInput(comp.requestedBdas || 5);
                      setTrialDaysInput(30);
                    }}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Activate
                  </button>
                  <button
                    onClick={() => {
                      setRejectModalCompany(comp);
                      setRejectReasonInput('');
                    }}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE & REGISTERED WORKSPACES TABLE */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Active Tenant Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant 1-click company kill-switches, caller license quotas, and 30-day trial status.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, slug, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-6">Company & Workspace</th>
                <th className="py-3 px-6">CEO Contact</th>
                <th className="py-3 px-6 text-center">BDA Seats</th>
                <th className="py-3 px-6 text-center">Trial Status</th>
                <th className="py-3 px-6 text-center">1-Click Kill-Switch</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredActive.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching companies found.
                  </td>
                </tr>
              ) : (
                filteredActive.map((comp) => {
                  const isSuspended = comp.status === 'SUSPENDED_BY_ADMIN';
                  return (
                    <tr
                      key={comp.id}
                      className={`hover:bg-slate-800/30 transition ${
                        isSuspended ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Company Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          {comp.name}
                          {comp.slug === 'heeyaku-primary' && (
                            <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                              Root Org
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {comp.slug} · {comp.totalLeadsCount.toLocaleString()} leads
                        </div>
                      </td>

                      {/* CEO Contact */}
                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-medium">{comp.ceoName || 'Unassigned'}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{comp.ceoEmail || 'No email linked'}</div>
                      </td>

                      {/* BDA Seats */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-slate-200 font-semibold">
                          <Users className="w-3 h-3 text-indigo-400" />
                          {comp.activeBdasCount} / {comp.maxBdas}
                        </span>
                      </td>

                      {/* Trial Status */}
                      <td className="py-4 px-6 text-center">
                        {comp.isTrialExpired ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-[11px]">
                            Trial Expired
                          </span>
                        ) : comp.trialDaysRemaining !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] border ${
                              comp.trialDaysRemaining <= 5
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {comp.trialDaysRemaining} days left
                          </span>
                        ) : (
                          <span className="text-slate-400">Permanent</span>
                        )}
                      </td>

                      {/* 1-Click Kill-Switch Toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleSuspension(comp)}
                          disabled={isPending || comp.slug === 'heeyaku-primary'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                            isSuspended ? 'bg-rose-950 border border-rose-800' : 'bg-emerald-600'
                          }`}
                          title={
                            isSuspended
                              ? 'Workspace currently SUSPENDED. Click to restore access.'
                              : 'Workspace currently ACTIVE. Click to instantly lock down.'
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isSuspended ? 'translate-x-1 bg-rose-400' : 'translate-x-6'
                            }`}
                          />
                        </button>
                        <div className="text-[10px] mt-1 font-semibold uppercase tracking-wider">
                          {isSuspended ? (
                            <span className="text-rose-400">Suspended</span>
                          ) : (
                            <span className="text-emerald-400">Active</span>
                          )}
                        </div>
                      </td>

                      {/* Manage Drawer Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedCompany(comp)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
                        >
                          <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANAGE SLIDE-OVER DRAWER */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCompany.name}</h3>
                  <div className="text-xs font-mono text-slate-400">{selectedCompany.slug}</div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Ghost Mode */}
              <div className="my-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Current Workspace State</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {selectedCompany.status === 'ACTIVE' ? '🟢 Operational' : '🔴 Suspended'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSuspension(selectedCompany)}
                    disabled={selectedCompany.slug === 'heeyaku-primary'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedCompany.status === 'ACTIVE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {selectedCompany.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
                  </button>
                </div>

                {/* Ghost Mode Button */}
                <button
                  onClick={() => handleImpersonate(selectedCompany)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Eye className="w-4 h-4" />
                  View as CEO (Ghost Mode)
                </button>
              </div>

              {/* Seat Quota Stepper */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 my-4">
                <div className="text-xs font-semibold text-slate-200">BDA Caller Seat Allocation</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Currently using {selectedCompany.activeBdasCount} of {selectedCompany.maxBdas} allowed callers.
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => handleUpdateSeats(selectedCompany.id, Math.max(1, selectedCompany.maxBdas - 1))}
                    disabled={selectedCompany.maxBdas <= 1}
                    className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-40"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono text-lg font-bold text-white">
                    {selectedCompany.maxBdas} BDAs
                  </div>
                  <button
                    onClick={() => handleUpdateSeats(selectedCompany.id, selectedCompany.maxBdas + 1)}
                    className="h-9 w-9 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Trial Period Extensions */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 my-4">
                <div className="text-xs font-semibold text-slate-200">30-Day Trial Window</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedCompany.trialDaysRemaining !== null
                    ? `${selectedCompany.trialDaysRemaining} days remaining`
                    : 'Permanent license'}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleExtendTrial(selectedCompany.id, 15)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    +15 Days
                  </button>
                  <button
                    onClick={() => handleExtendTrial(selectedCompany.id, 30)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    +30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone: Delete Company */}
            {selectedCompany.slug !== 'heeyaku-primary' && (
              <div className="pt-6 border-t border-slate-800 mt-6">
                <button
                  onClick={() => {
                    setDeleteModalCompany(selectedCompany);
                    setDeleteConfirmName('');
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Company (Test Cleanup)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Approve & Activate Company</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify and approve <strong className="text-white">{approveModalCompany.name}</strong> for live access.
            </p>

            <div className="my-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Approved Caller (BDA) Seats
                </label>
                <input
                  type="number"
                  min={1}
                  value={approvedBdasInput}
                  onChange={(e) => setApprovedBdasInput(parseInt(e.target.value) || 1)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500">CEO requested {approveModalCompany.requestedBdas} seats.</span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={trialDaysInput}
                  onChange={(e) => setTrialDaysInput(parseInt(e.target.value) || 30)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setApproveModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Reject Company Application</h3>
            <p className="text-xs text-slate-400 mt-1">
              Are you sure you want to reject <strong className="text-white">{rejectModalCompany.name}</strong>?
            </p>

            <div className="my-4">
              <label className="text-xs font-medium text-slate-300">Rejection Reason</label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="e.g. Unverified business phone number or spam submission."
                rows={3}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              This will permanently delete <strong className="text-white">{deleteModalCompany.name}</strong> and all associated staff, teams, leads, and call records.
            </p>

            <div className="my-4">
              <label className="text-xs text-slate-400">
                Type <strong>{deleteModalCompany.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteModalCompany.name}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={isPending || deleteConfirmName.trim().toLowerCase() !== deleteModalCompany.name.trim().toLowerCase()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
