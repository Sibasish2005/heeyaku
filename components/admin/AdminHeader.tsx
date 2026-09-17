'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { 
  Users, 
  UserCheck, 
  LayoutDashboard, 
  ShieldCheck,
  Building2
} from 'lucide-react';

interface AdminHeaderProps {
  adminEmail: string;
  adminName: string;
}

export default function AdminHeader({ adminEmail, adminName }: AdminHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/admin/employees', icon: UserCheck },
    { label: 'Leads CRM', href: '/admin/leads', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAFBFD]/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-10 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-2.5 font-extrabold tracking-tight text-slate-900 transition-opacity hover:opacity-85"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0B1F33] flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900">HEEYAKU</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                Admin OS
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <div className="flex items-center justify-end gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">{adminName}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
            {adminEmail}
          </span>
        </div>

        <div className="pl-3 border-l border-slate-200/80 flex items-center gap-2">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
