'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function PlatformPage() {
  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            UNIFIED ACADEMY ARCHITECTURE
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            How HEEYAKU Works. <br />
            <span className="text-[#2563EB]">One Unified System.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            A single, connected platform for coaching institutes and academies. From the first student phone call to final fee payment, everything is organized in one place without manual spreadsheets.
          </p>
        </div>

        {/* 3 Full-Scale Bento Architecture Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Pillar 1 */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                MODULE 01 • TELEPHONY
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                1. Android Calling App
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Installed directly on counselor smartphones. Automatically logs outgoing, incoming, and missed calls with exact talk time. Pops up right after each call to tag quick disposition notes.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Offline Storage:</span>
                  <span className="font-bold text-emerald-700">Syncs when reconnected</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Talk Time Logs:</span>
                  <span className="font-bold text-[#2563EB]">100% Automatic</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Works even without active internet.
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                MODULE 02 • ADMISSION CRM
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                2. Central Admission Board
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Student inquiries from your ad campaigns reach counselors in 30 seconds. Institute owners and branch heads see daily call volume, connected talk time, and enrollments won in real time.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>First Dial Speed:</span>
                  <span className="font-bold text-[#2563EB]">Under 2 Minutes</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Fair Distribution:</span>
                  <span className="font-bold text-emerald-700">Equal counselor share</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Zero manual spreadsheet updating.
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                MODULE 03 • AUTOMATIONS & PAYMENTS
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                3. WhatsApp & Fee Links
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Sends course brochures, demo class invites, and fee reminders straight to WhatsApp. Parents can tap and pay directly through UPI (Google Pay, PhonePe, Paytm) or cards.
              </p>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Fee Settlement:</span>
                  <span className="font-bold text-emerald-700">Direct to your bank</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Fee Receipts:</span>
                  <span className="font-bold text-[#0B1F33]">Instant on WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Fees deposit directly into your bank.
            </div>
          </div>

        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to see the platform in action?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Schedule a personalized walkthrough or call our team directly at <span className="text-white font-bold">+91 81318 38253</span>.
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
