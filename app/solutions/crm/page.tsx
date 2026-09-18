'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Lock, 
  PlayCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function CrmSolutionPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>CUSTOM E-LEARNING OPERATING SYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Custom CRM & LMS for <br />
            <span className="text-[#2563EB]">High-Velocity Conversion</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Generic CRMs drop leads when webinar spikes occur. HEEYAKU unites high-throughput lead distribution with DRM video encryption and real-time counselor telephony.
          </p>
        </div>

        {/* Architectural 2-Column Showcase */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
            
            {/* Left Box: Conversion CRM Engine */}
            <div className="p-8 sm:p-12 space-y-8 bg-white/60 hover:bg-white transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                  REAL-TIME TELEMETRY
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  LEAD ROUTING & COUNSELOR METRICS
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Every inquiry is paired with available telecallers in under 60 seconds. Our native Android tracker logs exact talk durations directly into PostgreSQL.
                </p>
              </div>

              {/* Telemetry Mock Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-semibold">
                  <span>Counselor Pipeline Velocity</span>
                  <span className="text-emerald-600 font-bold">98.4% On-Time Dialing</span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-base font-extrabold text-[#0B1F33]">1.2 mins</div>
                    <div className="text-[11px] text-slate-500">First Response</div>
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-[#2563EB]">44 mins</div>
                    <div className="text-[11px] text-slate-500">Daily Talk Time</div>
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-emerald-600">32.8%</div>
                    <div className="text-[11px] text-slate-500">Lead Conversion</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated round-robin and performance-based lead queues</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Single-connected-call deduplication prevents repeat call counts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Collocated Mumbai data tier for sub-25ms dashboard refreshes</li>
              </ul>
            </div>

            {/* Right Box: DRM Encrypted LMS */}
            <div className="p-8 sm:p-12 space-y-8 bg-white/60 hover:bg-white transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ANTI-PIRACY DRM
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  PIRACY-PROOF COURSE PLAYBACK
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Protect proprietary lectures and masterclasses. Dynamic real-time watermarks display student email and phone number across randomized video coordinates.
                </p>
              </div>

              {/* DRM Video Mock Card */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Advanced System Design #14</span>
                  <span className="text-emerald-400">ENCRYPTED HLS</span>
                </div>
                <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                  <PlayCircle className="w-10 h-10 text-white/80" />
                  {/* Dynamic Watermark Stamp */}
                  <div className="absolute bottom-3 right-4 px-2 py-0.5 rounded bg-black/60 border border-white/20 text-[10px] font-mono text-white/70">
                    user_4981 • +91 98*** **321
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Screen recording and HDMI capture neutralization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-device concurrent login limits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Adaptive bitrate HLS streaming on low-bandwidth connections</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Signature Heeyaku Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to unify your academy's sales pipeline?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Join leading coaching academies and bootcamps running on HEEYAKU's custom architecture.
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
