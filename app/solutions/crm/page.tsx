'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function SolutionsCRMPage() {
  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            ADMISSION CRM & TELEPHONY
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Call Students in Seconds. <br />
            <span className="text-[#2563EB]">Stop Losing Warm Leads.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            When a prospective student submits a course inquiry, their interest drops with every minute of delay. HEEYAKU rings your counselors in under 60 seconds with full student context.
          </p>
        </div>

        {/* 2 Full-Scale Architectural Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Card 1: Fast Distribution */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                SPEED-TO-LEAD AUTOMATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Fast Lead Routing to Counselors
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                Leads from Meta ads, Google campaigns, and landing page forms arrive on counselors&apos; phones within 30 seconds.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Sub-60s Response:</strong> Students are called while they are still looking at your course brochure online.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Equal Sharing:</strong> Automatic lead distribution prevents counselor disputes over new inquiries.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Ad Tracking:</strong> Clearly see which ad campaign or marketing channel brought in the enrolled student.</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Average Lead Contact Time:</span>
              <span className="font-bold text-[#2563EB]">1.4 Minutes</span>
            </div>
          </div>

          {/* Card 2: Anti-Piracy LMS */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STUDENT CONTENT PROTECTION
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Anti-Piracy Video Portal
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                Deliver recorded and live lectures without worrying about course materials getting leaked on Telegram or YouTube.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Dynamic Watermark:</strong> Student phone number and roll number float on screen, stopping screen recorders.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Batch Unlocking:</strong> Automatic syllabus access granted as soon as admission fees are settled.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#2563EB] font-bold font-mono text-base">•</span>
                  <span><strong>Attendance Tracking:</strong> Track video completion percentage and quiz submissions per student.</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Screen Recording Deterrence:</span>
              <span className="font-bold text-emerald-700">100% Protected</span>
            </div>
          </div>

        </div>

        {/* Bottom Callout Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to streamline your admissions?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Book an interactive demo or call our advisory team directly at <span className="text-white font-bold">+91 81318 38253</span>.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
