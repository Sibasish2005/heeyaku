'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Zap, 
  Clock, 
  Workflow, 
  PhoneForwarded,
  Sparkles
} from 'lucide-react';

export default function AutomationSolutionPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Cpu className="w-3.5 h-3.5" />
            <span>OPERATIONAL WORKFLOW AUTOMATION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Zero Operational Leakage. <br />
            <span className="text-[#2563EB]">100% Automated Pipelines</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Stop losing student enrollments to delayed follow-ups and manual administrative friction. HEEYAKU triggers sub-60s counselor dialing, WhatsApp sequences, and automated installment recovery.
          </p>
        </div>

        {/* 3-Pillar Architectural Canvas */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 items-stretch">
            
            {/* 1. Sub-60s Instant Dialing */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6">
                  <PhoneForwarded className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  SUB-60s SPEED-TO-LEAD
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  When a prospective student fills a lead form, the inquiry instantly rings available telecaller Android devices with automated 1-click dialing.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-slate-500 font-bold">
                    <span>Lead Response Latency</span>
                    <span className="text-emerald-600">48 seconds avg</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[85%]" />
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated round-robin routing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> WhatsApp backup if unanswered</li>
              </ul>
            </div>

            {/* 2. Official WhatsApp Cloud API */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  WHATSAPP NURTURE LOOPS
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Conversational reminders triggered across webinar countdowns, batch commencement dates, and syllabus brochure deliveries.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-slate-500 font-bold">
                    <span>Message Open & Read Rate</span>
                    <span className="text-blue-600">96.2% delivered</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[96%]" />
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official WhatsApp Cloud API (zero ban risk)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic Razorpay fee link injection</li>
              </ul>
            </div>

            {/* 3. Automated Installment Recovery */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  INSTALLMENT COLLECTION
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Automate pending tuition reminders with auto-generated payment links, real-time webhook status confirmation, and automated invoice PDFs.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-slate-500 font-bold">
                    <span>Fee Recovery Delta</span>
                    <span className="text-emerald-600">+42% collected</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[78%]" />
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated LMS access freeze on default</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant unfreeze on payment webhook</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Eliminate operational overhead today.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Schedule an automation architecture session with our engineering team.
            </p>
          </div>
          <div>
            <BookDemoButton text="Book a Demo" href="#book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
