'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            How HEEYAKU Works
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            A single, connected system for coaching institutes and academies. From the first phone call to final fee payment, everything is organized in one place.
          </p>
        </div>

        {/* 3 Clear Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              1. Android Calling App
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Installed on counselor smartphones. Automatically tracks outgoing, incoming, and missed calls. Pops up right after each call to take quick disposition notes.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Works even without active internet.
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              2. Central Admission Board
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lead details from your ad campaigns reach counselors in 30 seconds. Institute owners can see daily call volume, talk time, and admissions won.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Zero manual spreadsheet updating.
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              3. WhatsApp & Fee Integration
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sends course materials and fee reminders straight to WhatsApp. Parents can click and pay directly via UPI (Google Pay, PhonePe) or cards.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Fees deposit directly into your bank.
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div className="p-8 rounded-2xl bg-[#0B1F33] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">
              Ready to streamline your institute&apos;s admissions?
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Call our engineering and sales desk directly at +91 81318 38253.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+918131838253"
              className="px-5 py-2.5 rounded-xl bg-white text-[#0B1F33] font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Call +91 81318 38253
            </a>
            <Link
              href="/book-demo"
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
