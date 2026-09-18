'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  PhoneCall, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Sparkles,
  PhoneForwarded,
  Activity,
  Cpu
} from 'lucide-react';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      {/* Global Navbar */}
      <Navbar />

      {/* Ambient Aurora / Light Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Section Pill Badge & Tagline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Smartphone className="w-3.5 h-3.5" />
            <span>NATIVE ANDROID TELEPHONY CLIENT • v1.0.4</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Call tracking that <span className="text-[#2563EB]">never sleeps</span>. <br />
            Data that <span className="text-[#0284C7]">never drops</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            The dedicated Android companion app for HEEYAKU telecallers and counselors. Automated background call logging, offline queue resilience, and instant lead disposition capture.
          </p>
        </div>

        {/* Hero Two-Column Grid: Download Card + Live Mobile App Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-20">
          
          {/* Left Column: Download Controller */}
          <div className="lg:col-span-7 space-y-8">
            <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md p-8 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Direct Distribution
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Production Ready
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  Download HEEYAKU CallTracker
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Install directly onto any counselor device running Android 8.0 to Android 16. Includes automatic background sync and single connected call enforcement.
                </p>
              </div>

              {/* Download Action Area */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="/api/download/apk"
                  download="heeyaku-calltracker.apk"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-full transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.97] cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                  <span>{downloading ? 'Downloading APK...' : 'Download Official APK'}</span>
                </a>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 justify-center sm:justify-start">
                  <span>37.9 MB</span>
                  <span>•</span>
                  <span>SHA-256 Verified</span>
                  <span>•</span>
                  <span>Android 8+</span>
                </div>
              </div>

              {/* Key Architecture Metrics Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#0B1F33]">Sub-25ms</div>
                  <div className="text-xs font-medium text-slate-500">Mumbai Sync SLA</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-600">100%</div>
                  <div className="text-xs font-medium text-slate-500">Offline Resilience</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-[#2563EB]">Single</div>
                  <div className="text-xs font-medium text-slate-500">Connected Rule</div>
                </div>
              </div>
            </div>

            {/* Quick 3-Step Setup Guide */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                3-Step Rapid Onboarding
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Download APK directly from your mobile browser</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Allow installation from unknown sources</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Sign in with your employee code and dial</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live App Device Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[300px] sm:w-[320px] rounded-[42px] p-3.5 bg-slate-900 border-4 border-slate-800 shadow-2xl shadow-slate-900/20">
              {/* Speaker / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>

              {/* Device Screen Canvas */}
              <div className="relative rounded-[32px] bg-slate-950 text-white overflow-hidden p-5 pt-8 space-y-5 font-sans">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>10:45 AM</span>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>5G • 98%</span>
                  </div>
                </div>

                {/* App Brand Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>HEEYAKU TRACKER</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Listening to active telephony</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    ONLINE
                  </span>
                </div>

                {/* Active Dialing Target Lead Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">NEXT QUEUED LEAD</span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">
                      HIGH INTENT
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Ananya Sharma</div>
                    <div className="text-xs text-slate-400 font-mono">+91 98765 43210</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">Full Stack Web Batch</span>
                    <button className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs">
                      <PhoneCall className="w-3 h-3" />
                      <span>Dial Now</span>
                    </button>
                  </div>
                </div>

                {/* Live Call Telemetry Log List */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Recent Session Logs</div>
                  
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Vikram Rao</div>
                      <div className="text-[10px] text-emerald-400">Connected • 4m 12s</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      INTERESTED
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Priya Patel</div>
                      <div className="text-[10px] text-slate-400">No Answer • 0s</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      CALL BACK
                    </span>
                  </div>
                </div>

                {/* Offline Resilience Indicator */}
                <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[10px] text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Automatic background offline queue active</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Signature Architecture Canvas: 3 Pillars of Mobile Telephony */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 items-stretch">
            
            {/* PILLAR 1 */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6">
                  <PhoneForwarded className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  AUTOMATED CALL LOGGING
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Eliminate manual spreadsheet logging. Every dialed, received, or missed interaction is automatically timestamped and paired with the respective student lead.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Exact duration counting</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Phone number 10-digit normalization</li>
              </ul>
            </div>

            {/* PILLAR 2 */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  PERSISTENT OFFLINE QUEUE
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Calls made in cellular dead-zones, basements, or during transit are saved to encrypted local SQLite storage and safely retried on network recovery.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero dropped call logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Exponential backoff auto-flush</li>
              </ul>
            </div>

            {/* PILLAR 3 */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors duration-200">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center mb-6">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  SINGLE CONNECTED RULE
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Strict business logic ensures that once a lead connects with a counselor, repeat calls are not over-counted in conversion KPIs.
                </p>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Watermarked lead contact cards</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Accurate counselor talk time analytics</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Security & Integrity Note */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0B1F33] flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0B1F33]">Enterprise Privacy & Telephony Permissions</h4>
              <p className="text-xs text-slate-500">The app only monitors calls associated with assigned leads. Personal calls are isolated.</p>
            </div>
          </div>
          <Link
            href="/resources/docs"
            className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Review Security Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
