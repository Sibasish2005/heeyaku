'use client';

import React, { useState, Suspense } from 'react';
import { Menu, LogOut, Eye, X, AlertTriangle, ArrowRight } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';
import { useClerk } from '@clerk/nextjs';
import NavigationProgressBar from '@/components/NavigationProgressBar';
import { clearImpersonationAction } from '@/app/super-admin/actions';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { toast } from 'sonner';

interface AdminShellProps {
  adminEmail: string;
  adminName: string;
  role?: Role;
  teamName?: string | null;
  isRealCeo?: boolean;
  simulatedRole?: Role | null;
  isSuperAdmin?: boolean;
  isImpersonating?: boolean;
  companyName?: string | null;
  trialDaysRemaining?: number | null;
  isTrialExpired?: boolean;
  children: React.ReactNode;
}

export default function AdminShell({
  adminEmail,
  adminName,
  role = Role.CEO,
  teamName = null,
  isRealCeo = false,
  simulatedRole = null,
  isSuperAdmin = false,
  isImpersonating = false,
  companyName = null,
  trialDaysRemaining = null,
  isTrialExpired = false,
  children,
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exitingGhost, setExitingGhost] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleExitGhostMode = async () => {
    setExitingGhost(true);
    try {
      await clearImpersonationAction();
      toast.info('Exited Ghost Mode.');
      router.push('/super-admin');
      router.refresh();
    } catch {
      setExitingGhost(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>

      {/* Sidebar (Desktop pinned, Mobile slide-in drawer) */}
      <AdminSidebar
        adminEmail={adminEmail}
        adminName={adminName}
        role={role}
        teamName={teamName}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isSuperAdmin={isSuperAdmin}
        trialDaysRemaining={trialDaysRemaining}
        isTrialExpired={isTrialExpired}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Floating Ghost Mode Impersonation Banner */}
        {isImpersonating && (
          <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                Ghost Mode: Viewing as <span className="underline">{companyName || 'Tenant Organization'}</span> (Platform Super Admin)
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

        {/* Trial Expired Alert Banner */}
        {isTrialExpired && !isSuperAdmin && !isImpersonating && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-xs flex items-center justify-between text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>
                <strong>Your 30-Day Heeyaku Trial Has Concluded.</strong> All your leads and team rosters are safely preserved.
              </span>
            </div>
            <a
              href="mailto:platform-sales@heeyaku.com?subject=Upgrade%20Trial%20Account"
              className="font-bold underline hover:opacity-80 flex items-center gap-1 shrink-0"
            >
              <span>Upgrade Plan</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Mobile Top Navbar with Hamburger */}
        <header className="sticky top-0 z-30 lg:hidden bg-background/80 backdrop-blur-xl border-b border-border/80 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/70 transition-colors duration-150"
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
