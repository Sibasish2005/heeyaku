'use client';

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Bell, 
  ArrowUpRight, 
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();

  const stats = [
    { label: 'Total Leads', value: '2,845', change: '+14.2%', detail: 'vs. last month', icon: Users },
    { label: 'Active Students', value: '1,210', change: '+8.1%', detail: 'enrolled in LMS', icon: BookOpen },
    { label: 'Monthly Revenue', value: '₹4,20,000', change: '+22.5%', detail: 'gross collection', icon: DollarSign },
    { label: 'Conversion Rate', value: '18.4%', change: '+3.2%', detail: 'lead-to-admission', icon: TrendingUp },
  ];

  const recentLeads = [
    { id: 1, name: 'Ananya Sharma', email: 'ananya@gmail.com', course: 'NEET Master Bootcamp', status: 'Enrolled', value: '₹45,000', time: '10m ago' },
    { id: 2, name: 'Rahul Verma', email: 'rahul.v@outlook.com', course: 'JEE Advanced Batch 2026', status: 'Trial', value: '₹52,000', time: '35m ago' },
    { id: 3, name: 'Priya Roy', email: 'priya.roy@gmail.com', course: 'Foundation Class 10', status: 'Pending', value: '₹28,000', time: '2h ago' },
    { id: 4, name: 'Suman Das', email: 'suman.das@tech.in', course: 'Full Stack Academy', status: 'Enrolled', value: '₹60,000', time: '4h ago' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#0B1F33] selection:bg-[#2563EB] selection:text-white font-sans antialiased">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFBFD]/80 backdrop-blur-md border-b border-slate-200/60 px-6 sm:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900 transition-opacity hover:opacity-80 active:scale-[0.98]"
          >
            <span className="text-base tracking-tight">HEEYAKU</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Admin OS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-500">
            <span className="text-slate-900 font-bold border-b-2 border-[#2563EB] pb-1 -mb-1">Overview</span>
            <a href="#analytics" className="hover:text-slate-900 transition-colors">Analytics</a>
            <a href="#leads" className="hover:text-slate-900 transition-colors">Leads</a>
            <a href="#courses" className="hover:text-slate-900 transition-colors">Courses</a>
            <a href="#settings" className="hover:text-slate-900 transition-colors">Settings</a>
          </nav>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="pl-8 pr-3.5 py-1.5 text-xs bg-slate-200/50 hover:bg-slate-200/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg w-52 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <button 
            type="button" 
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all active:scale-[0.95] relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full absolute top-1.5 right-1.5" />
          </button>

          <div className="pl-2 border-l border-slate-200/80 flex items-center gap-2.5">
            {isLoaded && user && (
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-800">
                {user.firstName || 'Admin'}
              </span>
            )}
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-10 space-y-12">
        {/* Header Hero Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/40">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#2563EB] uppercase mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Telemetry Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {isLoaded && user?.firstName ? `Good afternoon, ${user.firstName}` : 'Executive Control Center'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              type="button" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-all active:scale-[0.97]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter View</span>
            </button>
            <button 
              type="button" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-lg transition-all active:scale-[0.97] shadow-2xs"
            >
              <span>+ New Admission</span>
            </button>
          </div>
        </div>

        {/* Clean Borderless Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="group space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-wide">{stat.label}</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  {stat.change}
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-[#2563EB] transition-colors">
                {stat.value}
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Lead Activity & Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
          {/* Main Lead Feed (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Live Admissions Feed</h2>
                <p className="text-xs text-slate-400 font-medium">Real-time sync from CRM and WhatsApp automation</p>
              </div>
              <button 
                type="button" 
                className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-0.5 group"
              >
                <span>View all leads</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
              {recentLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-xs text-slate-700 group-hover:bg-blue-50 group-hover:text-[#2563EB] group-hover:border-blue-200 transition-colors">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">{lead.name}</div>
                      <div className="text-[11px] font-medium text-slate-400">{lead.course}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        lead.status === 'Enrolled'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                          : lead.status === 'Trial'
                          ? 'text-blue-700 bg-blue-50 border border-blue-200/60'
                          : 'text-amber-700 bg-amber-50 border border-amber-200/60'
                      }`}>
                        {lead.status}
                      </span>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">{lead.time}</div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 min-w-[65px] text-right">
                      {lead.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Panel (1 col) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Infrastructure Health</h2>
              <p className="text-xs text-slate-400 font-medium">MetaBrain & security telemetry</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800">WhatsApp Gateway</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">DRM Video Stream</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Encrypted</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-800">CRM Sub-Second Sync</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">12ms</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800">Custom Domain Edge</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">99.99%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/60">
              <div className="text-xs font-bold text-slate-800 mb-1">System Integrity Normal</div>
              <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Lead pipelines, DRM watermarking keys, and WhatsApp webhooks are synchronized with zero dropped packets.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
