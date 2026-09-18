'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  Server, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  Smartphone, 
  ShieldCheck, 
  Activity, 
  Lock,
  Cpu
} from 'lucide-react';

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Server className="w-3.5 h-3.5" />
            <span>INFRASTRUCTURE & CORE ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Architected for <span className="text-[#2563EB]">Zero Downtime</span>. <br />
            Engineered for <span className="text-[#0284C7]">Scale</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            The technical foundations of the HEEYAKU platform: Collocated Mumbai compute, high-speed PostgreSQL composite indexing, native Android telephony listeners, and enterprise role whitelisting.
          </p>
        </div>

        {/* 4-Card Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Card 1: Collocated Mumbai Data Tier */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                SUB-25ms LATENCY
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-2">
                Collocated Mumbai Edge & Database Tier
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Serverless compute executes directly in Vercel Mumbai (<code className="text-[#2563EB] font-mono">bom1</code>), adjacent to our Supabase PostgreSQL cluster (<code className="text-[#2563EB] font-mono">ap-south-1</code>), eliminating cross-continental network latency.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500">
                <span>Database Roundtrip Transit</span>
                <span className="text-emerald-600 font-bold">&lt; 25ms avg</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Query Plan Optimization</span>
                <span className="text-emerald-600 font-bold">Index Scan (O(log N))</span>
              </div>
            </div>
          </div>

          {/* Card 2: Native Android Telephony Engine */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ZERO-DROP SYNC
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-2">
                Native Android Telephony Listener
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Background Android telephony listener captures exact call events, validates the single-connected-call constraint, and stores unsent logs in an encrypted native SQLite retry queue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500">
                <span>Offline Queue Recovery</span>
                <span className="text-emerald-600 font-bold">100% Reliable</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Background Sync Cadence</span>
                <span className="text-emerald-600 font-bold">Every 25 seconds</span>
              </div>
            </div>
          </div>

          {/* Card 3: Cloudflare-Grade Security */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                FAIL-CLOSED ACCESS
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-2">
                Fail-Closed Whitelist Authorization
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Admin routes enforce static email whitelisting, constant-time HMAC verification via <code className="text-[#2563EB] font-mono">crypto.timingSafeEqual</code>, and sliding-window brute-force rate limiters.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500">
                <span>Timing Attack Defense</span>
                <span className="text-indigo-600 font-bold">Constant-Time SHA256</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Rate Limit Protection</span>
                <span className="text-indigo-600 font-bold">10 req / 15 mins</span>
              </div>
            </div>
          </div>

          {/* Card 4: MetaBrain Telemetry Engine */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0284C7] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                POSTGRES AGGREGATIONS
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-2">
                Real-Time MetaBrain Analytics
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Replaced memory-heavy in-process lead loops with native PostgreSQL <code className="text-[#2563EB] font-mono">groupBy</code> and parallel count aggregations, cutting memory consumption by 95%.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500">
                <span>Serverless Heap Footprint</span>
                <span className="text-cyan-700 font-bold">O(N_employees)</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Dashboard Refresh Latency</span>
                <span className="text-cyan-700 font-bold">&lt; 120ms</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Review our infrastructure benchmarks.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Schedule a technical deep-dive with our infrastructure engineering lead.
            </p>
          </div>
          <div>
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
