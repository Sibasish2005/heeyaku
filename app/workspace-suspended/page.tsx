import React from 'react';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ShieldAlert, Mail, LogOut, ArrowRight } from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import { SignOutButton } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default async function WorkspaceSuspendedPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getAuthenticatedUser();

  // If Super Admin, route directly to the Super Admin governance portal
  if (user?.isSuperAdmin) {
    redirect('/super-admin');
  }

  // If user company is active, send them back to dashboard
  if (user?.companyStatus === 'ACTIVE') {
    redirect('/admin/dashboard');
  }

  // If company is in pending review, send to verification-pending
  if (user?.companyStatus === 'PENDING_VERIFICATION') {
    redirect('/verification-pending');
  }

  // Fetch suspend reason if available
  let suspendReason: string | null = null;
  let companyName = user?.companyName || 'Workspace';
  let companySlug = user?.companySlug || '';

  if (user?.companyId) {
    const comp = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { name: true, slug: true, suspendReason: true },
    });
    if (comp) {
      companyName = comp.name;
      companySlug = comp.slug;
      suspendReason = comp.suspendReason;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-red-600 selection:text-white">
      <div className="relative w-full max-w-lg">
        {/* Amber/red background aura */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <HeeyakuLogo size={34} color="#FFFFFF" dotColor="#EF4444" withText textColor="#FFFFFF" />
          </div>

          {/* Red Alert Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide">
              <ShieldAlert className="w-4 h-4" />
              <span>Workspace Administrative Hold</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Workspace Suspended
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Access to this company workspace has been temporarily suspended by the platform administrator.
            </p>
          </div>

          {/* Workspace Info Card */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Company</span>
              <span className="font-semibold text-slate-200">{companyName}</span>
            </div>
            {companySlug && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Workspace Slug</span>
                <span className="font-mono text-slate-400">/{companySlug}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Dialer & API Status</span>
              <span className="text-red-400 font-semibold font-mono">0ms Lockdown (403)</span>
            </div>

            {suspendReason && (
              <div className="pt-2 border-t border-slate-800/80 text-red-300">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Notice:</span>
                <p className="italic bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  {suspendReason}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <a
              href="mailto:platform-admin@heeyaku.com?subject=Workspace%20Suspension%20Inquiry%20-%20"
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 cursor-pointer active:scale-[0.99]"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Platform Support</span>
            </a>

            {user?.isSuperAdmin && (
              <Link
                href="/super-admin"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Access Super Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <div className="text-slate-500 text-[11px] truncate max-w-[200px]">
                {user?.email}
              </div>

              <SignOutButton redirectUrl="/sign-in">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
