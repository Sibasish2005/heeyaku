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
            Access Denied
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your signed-in account is not authorized to access the HEEYAKU Admin Operations Panel. Please sign in with an account configured in <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-mono">ADMIN_EMAIL</code>.
          </p>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <UserButton />
            <span className="text-xs font-semibold text-slate-600">Switch account or sign out</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell adminEmail={admin.email} adminName={admin.name}>
      {children}
    </AdminShell>
  );
}
