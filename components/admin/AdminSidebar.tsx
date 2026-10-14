'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserCheck, Users, X, ShieldCheck, LogOut, Home, ArrowUpRight, Building2, Target } from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';
import { useClerk } from '@clerk/nextjs';
import { Role } from '@prisma/client';
import { Sparkles, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface AdminSidebarProps {
  adminEmail: string;
  adminName: string;
  role?: Role;
  teamName?: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isSuperAdmin?: boolean;
  trialDaysRemaining?: number | null;
  isTrialExpired?: boolean;
}

export default function AdminSidebar({
  adminEmail,
  adminName,
  role = Role.CEO,
  teamName = null,
  mobileOpen,
  onCloseMobile,
  isSuperAdmin = false,
  trialDaysRemaining = null,
  isTrialExpired = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  // Dynamic role-based navigation
  const navItems = React.useMemo(() => {
    let items = [];
    if (role === Role.HR) {
      items = [
        { label: 'Staff', href: '/admin/employees', icon: UserCheck },
        { label: 'Teams', href: '/admin/teams', icon: Building2 },
      ];
    } else if (role === Role.TEAM_LEAD) {
      items = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Prospects', href: '/admin/prospects', icon: Target },
        { label: 'Leads', href: '/admin/leads', icon: Users },
        { label: 'My Team', href: '/admin/teams', icon: Building2 },
        { label: 'Staff', href: '/admin/employees', icon: UserCheck },
      ];
    } else {
      // CEO has universal omni-privilege access
      items = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Prospects', href: '/admin/prospects', icon: Target },
        { label: 'Leads', href: '/admin/leads', icon: Users },
        { label: 'Teams', href: '/admin/teams', icon: Building2 },
        { label: 'Staff', href: '/admin/employees', icon: UserCheck },
      ];
    }

    if (isSuperAdmin) {
      items.push({ label: 'Super Admin', href: '/super-admin', icon: ShieldAlert });
    }

    return items;
  }, [role, isSuperAdmin]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-card text-card-foreground border-r border-border flex flex-col justify-between transition-transform duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/dashboard"
              onClick={onCloseMobile}
              className="flex items-center gap-3 transition-opacity duration-150 hover:opacity-90"
            >
              <HeeyakuLogo
                size={34}
                color="currentColor"
                dotColor="#2563EB"
                withText
                textColor="currentColor"
              />
            </Link>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Trial Countdown Pill */}
          {trialDaysRemaining !== null && !isSuperAdmin && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isTrialExpired
                ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
                : trialDaysRemaining <= 5
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              {isTrialExpired ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold text-[11px] truncate">Trial Concluded</span>
                </>
              ) : trialDaysRemaining <= 5 ? (
                <>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold text-[11px] truncate">Trial: {trialDaysRemaining}d left</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold text-[11px] truncate">30d Trial ({trialDaysRemaining}d left)</span>
                </>
              )}
            </div>
          )}

          <div className="pt-2 space-y-5">
            {/* Website Section */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Website
              </div>
              <nav className="space-y-1">
                <Link
                  href="/"
                  prefetch={false}
                  onClick={onCloseMobile}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors" />
                    <span>Home Page</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/70 group-hover:text-foreground flex items-center gap-0.5">
                    Visit <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              </nav>
            </div>

            {/* Menu */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Menu
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={onCloseMobile}
                      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-[color,background-color] duration-150 ${
                        isActive
                          ? 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Footer Admin Identity & Theme Switcher */}
        <div className="p-4 border-t border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Appearance</span>
            <ThemeToggler />
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-[#2563EB]/20 select-none">
                {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-foreground truncate">{adminName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                    role === Role.CEO
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : role === Role.HR
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {role === Role.CEO ? 'CEO' : role === Role.HR ? 'HR' : teamName ? `TL • ${teamName}` : 'Team Lead'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{adminEmail}</p>
              </div>
            </div>
          </div>

          {/* Clean Standalone Sign Out Button */}
          <button
            type="button"
            onClick={() => {
              document.cookie = 'heeyaku_dev_session=; path=/; max-age=0;';
              signOut({ redirectUrl: '/sign-in' });
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-border/80 hover:border-destructive/40 text-muted-foreground hover:text-destructive hover:bg-destructive/5 active:scale-[0.98] transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
