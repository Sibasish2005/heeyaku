import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import AdminShell from '@/components/admin/AdminShell';
import { ShieldAlert } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export const metadata = {
  title: 'HEEYAKU Admin OS — Control Center',
  description: 'Operations, lead management, and employee administration.',
};

import { Role } from '@prisma/client';
import { Smartphone } from 'lucide-react';
import RoleSwitcherBar from '@/components/admin/RoleSwitcherBar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-[#0B1F33]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Access Restricted
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have permission to access this page. Please sign in with an authorized account or contact support.
          </p>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <UserButton />
            <span className="text-xs font-semibold text-slate-600">Switch account or sign out</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is a BDA (Android Field Sales Associate), guide them to mobile app
  if (admin.role === Role.BDA) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-[#0B1F33]">
        {admin.isRealCeo && (
          <div className="fixed top-0 left-0 right-0 z-50">
            <RoleSwitcherBar
              currentRole={admin.role}
              isRealCeo={true}
              simulatedRole={admin.simulatedRole}
            />
          </div>
        )}
        <div className="max-w-md w-full bg-white rounded-2xl border border-blue-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Sales Associate Portal
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Welcome, {admin.name}! Sales Associates conduct lead outreach and telephony calling via the dedicated Android Call Tracker mobile app.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <a
              href="/download"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Download Android Call Tracker
            </a>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3">
              <UserButton />
              <span className="text-xs font-semibold text-slate-600">Sign out or switch account</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      adminEmail={admin.email}
      adminName={admin.name}
      role={admin.role}
      teamName={admin.ledTeamName || admin.teamName || null}
      isRealCeo={admin.isRealCeo}
      simulatedRole={admin.simulatedRole}
    >
      {children}
    </AdminShell>
  );
}
