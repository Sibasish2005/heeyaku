import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { Layers, ArrowRight, ShieldCheck, Database, Server, Smartphone, Activity } from 'lucide-react';

export const metadata = {
  title: 'Platform Architecture & Engine | HEEYAKU',
  description: 'Explore the HEEYAKU architecture: MetaBrain intelligence layer, collocated Mumbai database, real-time telephony telemetry, and enterprise security.',
};

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Server className="w-3.5 h-3.5" />
            <span>Infrastructure & Core Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            The HEEYAKU <span className="text-[#2563EB]">Unified Platform</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Engineered from the ground up for high-throughput operational reliability. Built on collocated Mumbai edge compute, PostgreSQL indexing, real-time Android telephony listeners, and strict role-based access.
          </p>
        </div>

        {/* Technical Architecture Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] dark:text-white">Collocated Mumbai Data Tier</h3>
                <p className="text-xs text-slate-500">Sub-25ms Query Latency</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Functions execute directly in Mumbai (<code className="text-[#2563EB] font-mono">bom1</code>) adjacent to the PostgreSQL database cluster with optimized composite indexes on lead activity and employee talk time.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] dark:text-white">Real-Time Telephony Listener</h3>
                <p className="text-xs text-slate-500">Native Android Integration</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Background Android service listens to telephony events, enforces the single-connected-call constraint, and maintains an offline retry queue ensuring zero dropped records.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] dark:text-white">Enterprise Security & Whitelisting</h3>
                <p className="text-xs text-slate-500">Cloudflare-Grade Hardening</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Fail-closed admin whitelist, constant-time HMAC token verification with <code className="text-[#2563EB] font-mono">crypto.timingSafeEqual</code>, sliding-window rate limiters, and CSV injection sanitization.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] dark:text-white">MetaBrain Analytics Engine</h3>
                <p className="text-xs text-slate-500">Live Team Telemetry</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Aggregates conversion velocity, connected call ratios, and telecaller talk times using native PostgreSQL <code className="text-[#2563EB] font-mono">groupBy</code> without server memory spikes.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Explore the complete architecture</h3>
            <p className="text-sm text-blue-200 max-w-xl">Deep dive into our engineering benchmarks and infrastructure roadmap.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Request Platform Walkthrough</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
