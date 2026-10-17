'use client';

import React, { useState, Suspense } from 'react';
import { Menu, LogOut, Eye } from 'lucide-react';
import SuperAdminSidebar from './SuperAdminSidebar';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';
import { useClerk } from '@clerk/nextjs';
import NavigationProgressBar from '@/components/NavigationProgressBar';
import { clearImpersonationAction } from '@/app/super-admin/actions';
import { toast } from 'sonner';

interface SuperAdminShellProps {
  superAdminEmail: string;
  impersonatingCompanyId?: string | null;
  pendingCount?: number;
  children: React.ReactNode;
}

export default function SuperAdminShell({
  superAdminEmail,
  impersonatingCompanyId = null,
  pendingCount = 0,
  children,
}: SuperAdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exitingGhost, setExitingGhost] = useState(false);
  const { signOut } = useClerk();

  const handleExitGhostMode = async () => {
    setExitingGhost(true);
    try {
      await clearImpersonationAction();
      toast.info('Exited Ghost Mode.');
      window.location.reload();
    } catch {
      setExitingGhost(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>

      {/* Super Admin Sidebar (Desktop pinned w-64, Mobile slide-over drawer) */}
      <SuperAdminSidebar
        superAdminEmail={superAdminEmail}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Floating Ghost Mode Banner (if active) */}
        {impersonatingCompanyId && (
          <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                Ghost Mode Active: Currently viewing workspace as Tenant CEO
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitGhostMode}
              disabled={exitingGhost}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-900 transition-colors text-[11px] font-bold cursor-pointer"
            >
              {exitingGhost ? 'Exiting...' : 'Exit Ghost Mode'}
            </button>
          </div>
        )}

        {/* Mobile Top Navbar with Hamburger */}
        <header className="sticky top-0 z-30 lg:hidden bg-background/80 backdrop-blur-xl border-b border-border/80 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/70 transition-colors duration-150 cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <HeeyakuLogo size={26} color="currentColor" dotColor="#2563EB" withText textColor="currentColor" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggler />
            <button
              type="button"
              onClick={() => {
                document.cookie = 'heeyaku_dev_session=; path=/; max-age=0;';
                document.cookie = 'heeyaku_impersonate_company_id=; path=/; max-age=0;';
                signOut({ redirectUrl: '/sign-in' });
              }}
              className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
