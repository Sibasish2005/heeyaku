import React from 'react';
import Link from 'next/link';
import { Users, PlusCircle } from 'lucide-react';

interface DashboardHeaderProps {
  adminName?: string;
}

export default function DashboardHeader({ adminName }: DashboardHeaderProps) {
  const firstName = adminName ? adminName.split(' ')[0] : 'Admin';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Overview & Telemetry
          </h1>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Live PostgreSQL
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Welcome back, <span className="font-semibold text-slate-800">{firstName}</span>. Real-time operations and Business Development Associates performance.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link 
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs active:scale-[0.98]"
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Business Development Associates</span>
        </Link>
        <Link 
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-lg transition-colors active:scale-[0.98] shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Leads CRM</span>
        </Link>
      </div>
    </div>
  );
}
