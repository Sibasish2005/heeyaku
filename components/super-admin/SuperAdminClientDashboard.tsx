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
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Settings2,
  Trash2,
  Search,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';

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
  const { signOut } = useClerk();
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Ghost Mode Active Banner */}
      {impersonatingCompanyId && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-8 py-3 flex items-center justify-between text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="font-semibold text-xs sm:text-sm">
              Currently in Ghost Mode (Viewing tenant workspace as CEO)
            </span>
          </div>
          <button
            onClick={handleExitGhostMode}
            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            Exit Ghost Mode
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-border/80 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <HeeyakuLogo size={28} color="currentColor" dotColor="#2563EB" withText textColor="currentColor" />
              <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 text-[#2563EB] dark:text-blue-400 text-[11px] font-bold font-mono tracking-wide uppercase">
                Platform Governance
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Systems
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Tenant Directory & Workspace Control Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Cross-tenant licensing, caller quotas, 1-click company kill-switches, and CEO ghost mode.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-medium text-muted-foreground">Authenticated Owner</div>
              <div className="text-xs font-mono font-bold text-foreground">{superAdminEmail}</div>
            </div>

            <ThemeToggler />

            <a
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/60 transition text-xs font-semibold shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Primary Workspace</span>
            </a>

            <button
              type="button"
              onClick={() => {
                document.cookie = 'heeyaku_dev_session=; path=/; max-age=0;';
                document.cookie = 'heeyaku_impersonate_company_id=; path=/; max-age=0;';
                signOut({ redirectUrl: '/sign-in' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition text-xs font-semibold cursor-pointer active:scale-95 shadow-2xs"
              title="Sign out of Heeyaku Super Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Unified Metric Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
            <div className="text-xs font-semibold text-muted-foreground">Total Workspaces</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
              {stats.totalCompanies}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.activeCompanies} Active</span> · {stats.suspendedCompanies} Suspended
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
            <div className="text-xs font-semibold text-muted-foreground">Pending Approvals</div>
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${pendingCompanies.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {pendingCompanies.length}
            </div>
            <div className="text-[11px] text-muted-foreground">Awaiting Super Admin review</div>
          </div>

          <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
            <div className="text-xs font-semibold text-muted-foreground">Active Telecallers</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] dark:text-blue-400 font-mono tracking-tight">
              {stats.totalActiveBdas}
            </div>
            <div className="text-[11px] text-muted-foreground">Licensed BDA mobile app users</div>
          </div>

          <div className="p-4 sm:p-5 space-y-1 hover:bg-muted/20 transition-colors duration-150">
            <div className="text-xs font-semibold text-muted-foreground">Total Platform Leads</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
              {stats.totalPlatformLeads.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Across all tenant pipelines</div>
          </div>
        </div>

        {/* PENDING VERIFICATIONS QUEUE (If any exist) */}
        {pendingCompanies.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-card overflow-hidden shadow-2xs">
            <div className="px-5 sm:px-6 py-3.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>Pending Workspace Approvals ({pendingCompanies.length})</span>
              </div>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                Action required before clients can log in
              </span>
            </div>

            <div className="divide-y divide-border">
              {pendingCompanies.map((comp) => (
                <div
                  key={comp.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-foreground">{comp.name}</h3>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {comp.slug}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
                        Requested {comp.requestedBdas} BDAs
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                      {comp.ceoEmail && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{comp.ceoEmail}</span>
                        </span>
                      )}
                      {comp.phoneNumber && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{comp.phoneNumber}</span>
                        </span>
                      )}
                      {comp.industry && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{comp.industry}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Registered {new Date(comp.createdAt).toLocaleDateString()}</span>
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition active:scale-95 cursor-pointer"
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
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Active Tenant Directory</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Instant 1-click company kill-switches, caller license quotas, and 30-day trial status.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, slug, or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-5">Company & Workspace</th>
                  <th className="py-3 px-5">CEO Contact</th>
                  <th className="py-3 px-5 text-center">BDA Seats</th>
                  <th className="py-3 px-5 text-center">Trial Status</th>
                  <th className="py-3 px-5 text-center">1-Click Kill-Switch</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No matching companies found.
                    </td>
                  </tr>
                ) : (
                  filteredActive.map((comp) => {
                    const isSuspended = comp.status === 'SUSPENDED_BY_ADMIN';
                    return (
                      <tr
                        key={comp.id}
                        className={`hover:bg-muted/40 transition-[background-color] duration-150 ${
                          isSuspended ? 'bg-red-500/5' : ''
                        }`}
                      >
                        {/* Company Info */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
                            {comp.name}
                            {comp.slug === 'heeyaku-primary' && (
                              <span className="text-[10px] font-mono uppercase bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 border border-[#2563EB]/25 px-1.5 py-0.5 rounded font-bold">
                                Root Org
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px] mt-0.5">
                            {comp.slug} · {comp.totalLeadsCount.toLocaleString()} leads
                          </div>
                        </td>

                        {/* CEO Contact */}
                        <td className="py-3.5 px-5">
                          <div className="text-foreground font-medium">{comp.ceoName || 'Unassigned'}</div>
                          <div className="text-muted-foreground text-[11px] font-mono">{comp.ceoEmail || 'No email linked'}</div>
                        </td>

                        {/* BDA Seats */}
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border font-mono text-foreground font-bold text-xs">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {comp.activeBdasCount} / {comp.maxBdas}
                          </span>
                        </td>

                        {/* Trial Status */}
                        <td className="py-3.5 px-5 text-center">
                          {comp.isTrialExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px]">
                              Trial Expired
                            </span>
                          ) : comp.trialDaysRemaining !== null ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                                comp.trialDaysRemaining <= 5
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {comp.trialDaysRemaining} days left
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[11px]">Permanent</span>
                          )}
                        </td>

                        {/* 1-Click Kill-Switch Toggle */}
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => handleToggleSuspension(comp)}
                            disabled={isPending || comp.slug === 'heeyaku-primary'}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-hidden disabled:opacity-40 cursor-pointer ${
                              isSuspended ? 'bg-red-500/30 border border-red-500/50' : 'bg-emerald-600'
                            }`}
                            title={
                              isSuspended
                                ? 'Workspace currently SUSPENDED. Click to restore access.'
                                : 'Workspace currently ACTIVE. Click to instantly lock down.'
                            }
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-xs ${
                                isSuspended ? 'translate-x-1 bg-red-400' : 'translate-x-5.5'
                              }`}
                            />
                          </button>
                          <div className="text-[10px] mt-1 font-bold uppercase tracking-wider">
                            {isSuspended ? (
                              <span className="text-red-600 dark:text-red-400">Suspended</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                            )}
                          </div>
                        </td>

                        {/* Manage Drawer Button */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setSelectedCompany(comp)}
                            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition flex items-center gap-1.5 ml-auto shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Manage</span>
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
      </main>

      {/* MANAGE SLIDE-OVER DRAWER */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl text-foreground">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedCompany.name}</h3>
                  <div className="text-xs font-mono text-muted-foreground">{selectedCompany.slug}</div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Ghost Mode */}
              <div className="my-6 space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Workspace State</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {selectedCompany.status === 'ACTIVE' ? '🟢 Operational' : '🔴 Suspended'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSuspension(selectedCompany)}
                    disabled={selectedCompany.slug === 'heeyaku-primary'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                      selectedCompany.status === 'ACTIVE'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {selectedCompany.status === 'ACTIVE' ? 'Suspend Access' : 'Restore Access'}
                  </button>
                </div>

                {/* Ghost Mode Button */}
                <button
                  onClick={() => handleImpersonate(selectedCompany)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  View as CEO (Ghost Mode)
                </button>
              </div>

              {/* Seat Quota Stepper */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border my-4">
                <div className="text-xs font-bold text-foreground">BDA Caller Seat Allocation</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Currently using {selectedCompany.activeBdasCount} of {selectedCompany.maxBdas} allowed callers.
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => handleUpdateSeats(selectedCompany.id, Math.max(1, selectedCompany.maxBdas - 1))}
                    disabled={selectedCompany.maxBdas <= 1}
                    className="h-8 w-8 rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono text-base font-extrabold text-foreground">
                    {selectedCompany.maxBdas} BDAs
                  </div>
                  <button
                    onClick={() => handleUpdateSeats(selectedCompany.id, selectedCompany.maxBdas + 1)}
                    className="h-8 w-8 rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Trial Period Extensions */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border my-4">
                <div className="text-xs font-bold text-foreground">30-Day Trial Window</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {selectedCompany.trialDaysRemaining !== null
                    ? `${selectedCompany.trialDaysRemaining} days remaining`
                    : 'Permanent license'}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleExtendTrial(selectedCompany.id, 15)}
                    className="flex-1 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer shadow-2xs"
                  >
                    +15 Days
                  </button>
                  <button
                    onClick={() => handleExtendTrial(selectedCompany.id, 30)}
                    className="flex-1 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer shadow-2xs"
                  >
                    +30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone: Delete Company */}
            {selectedCompany.slug !== 'heeyaku-primary' && (
              <div className="pt-6 border-t border-border mt-6">
                <button
                  onClick={() => {
                    setDeleteModalCompany(selectedCompany);
                    setDeleteConfirmName('');
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl text-foreground">
            <h3 className="text-lg font-bold text-foreground">Approve & Activate Company</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Verify and approve <strong className="text-foreground">{approveModalCompany.name}</strong> for live access.
            </p>

            <div className="my-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Approved Caller (BDA) Seats
                </label>
                <input
                  type="number"
                  min={1}
                  value={approvedBdasInput}
                  onChange={(e) => setApprovedBdasInput(parseInt(e.target.value) || 1)}
                  className="w-full mt-1.5 px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  CEO requested {approveModalCompany.requestedBdas} seats.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={trialDaysInput}
                  onChange={(e) => setTrialDaysInput(parseInt(e.target.value) || 30)}
                  className="w-full mt-1.5 px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setApproveModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl text-foreground">
            <h3 className="text-lg font-bold text-foreground">Reject Company Application</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Are you sure you want to reject <strong className="text-foreground">{rejectModalCompany.name}</strong>?
            </p>

            <div className="my-4">
              <label className="text-xs font-semibold text-foreground">Rejection Reason</label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="e.g. Unverified business phone number or duplicate submission."
                rows={3}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-red-500/30 rounded-2xl p-6 shadow-2xl text-foreground">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete <strong className="text-foreground">{deleteModalCompany.name}</strong> and all associated staff, teams, leads, and call records.
            </p>

            <div className="my-4">
              <label className="text-xs text-muted-foreground">
                Type <strong className="text-foreground">{deleteModalCompany.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteModalCompany.name}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-red-500 rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium text-foreground"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteModalCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={isPending || deleteConfirmName.trim().toLowerCase() !== deleteModalCompany.name.trim().toLowerCase()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
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
