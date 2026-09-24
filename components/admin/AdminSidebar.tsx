'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserCheck, Users, X, ShieldCheck, LogOut, Home, ArrowUpRight } from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';
import { UserButton, useClerk } from '@clerk/nextjs';

export interface AdminSidebarProps {
  adminEmail: string;
  adminName: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  adminEmail,
  adminName,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [isConfirmingSignOut, setIsConfirmingSignOut] = React.useState(false);

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/admin/employees', icon: UserCheck },
    { label: 'Leads CRM', href: '/admin/leads', icon: Users },
  ];

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

          <div className="pt-2 space-y-5">
            {/* Home / Website Section */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Home
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
                    <span>Landing Page</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/70 group-hover:text-foreground flex items-center gap-0.5">
                    View <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              </nav>
            </div>

            {/* Main Operations */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Main Operations
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
              <UserButton />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-foreground truncate">{adminName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{adminEmail}</p>
              </div>
            </div>
          </div>

          {/* Sign Out Button with Confirmation Prompt */}
          {!isConfirmingSignOut ? (
            <button
              type="button"
              onClick={() => setIsConfirmingSignOut(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-border/80 hover:border-destructive/40 text-muted-foreground hover:text-destructive hover:bg-destructive/5 active:scale-[0.98] transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2 animate-in fade-in duration-150">
              <p className="text-[11px] font-semibold text-center text-foreground">
                Are you sure you want to sign out?
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsConfirmingSignOut(false)}
                  className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/80 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="px-2 py-1.5 text-[11px] font-bold text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
