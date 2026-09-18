'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  Building2, 
  Sparkles,
  BarChart3,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>MEASURABLE STUDENT & REVENUE ROI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Real Academies. <br />
            <span className="text-[#2563EB]">Measurable Growth</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Discover how leading coaching institutes, test-prep academies, and bootcamps eliminated lead loss and scaled enrollment with HEEYAKU.
          </p>
        </div>

        {/* 2 Featured Architectural Case Study Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Case 1 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                  Test Prep Academy • 4,200 Students
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  +280% ROI
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  Apex Engineering: 3.4x Increase in Connected Calls
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Before HEEYAKU, counselors were double-dialing leads from shared Google Sheets. Implementing the Android CallTracker and sub-60s instant lead routing dramatically improved conversion.
                </p>
              </div>

              {/* Metric Callouts Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="text-xl font-extrabold text-[#2563EB]">+340%</div>
                  <div className="text-[11px] font-medium text-slate-500">Connected Leads</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-emerald-600">42 mins</div>
                  <div className="text-[11px] font-medium text-slate-500">Daily Talk Time</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0B1F33]">0%</div>
                  <div className="text-[11px] font-medium text-slate-500">Lead Over-Count</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 italic">
              "The single-connected-call rule ended all disputes between counselors and gave us total transparency."
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white transition-colors flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider">
                  Full-Stack Bootcamp • 1,800 Cohort
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 font-bold">
                  ₹24L+ RECOVERED
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  DevMastery: 100% Video DRM Protection & Fee Recovery
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Combated course lecture piracy with dynamic student email watermarking while deploying automated WhatsApp payment installment triggers to collect overdue tuition.
                </p>
              </div>

              {/* Metric Callouts Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="text-xl font-extrabold text-emerald-600">Zero</div>
                  <div className="text-[11px] font-medium text-slate-500">Video Leaks</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#2563EB]">₹24.8L</div>
                  <div className="text-[11px] font-medium text-slate-500">Fees Collected</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0B1F33]">98.2%</div>
                  <div className="text-[11px] font-medium text-slate-500">Student Retention</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 italic">
              "HEEYAKU's automated WhatsApp triggers recovered tuition payments that had been delayed for over 4 months."
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Calculate your academy's conversion potential.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              We will benchmark your current lead pipeline against our top-performing clients.
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
