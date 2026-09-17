'use client';

import React, { useState, Suspense } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import ThemeToggler from '@/components/ThemeToggler';
import { UserButton } from '@clerk/nextjs';
import NavigationProgressBar from '@/components/NavigationProgressBar';

interface AdminShellProps {
  adminEmail: string;
  adminName: string;
  children: React.ReactNode;
}

export default function AdminShell({
  adminEmail,
  adminName,
  children,
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      {/* Sidebar (Desktop pinned, Mobile slide-in drawer) */}
      <AdminSidebar
        adminEmail={adminEmail}
        adminName={adminName}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
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
            <UserButton />
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
