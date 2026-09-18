'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 pt-32 pb-24">
        {/* Simple Sales-Friendly Header */}
        <div className="mb-14">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-3">
            Setup Guide & System Overview
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] mb-4">
            How HEEYAKU Works With Your Institute
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
            Everything your admission team, telecallers, and academic coordinators need to know in plain English. No programming required.
          </p>
        </div>

        {/* 4 Core Setup Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* 1. Lead Routing */}
          <div className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC]">
            <div className="text-xs font-mono text-slate-500 font-bold mb-2 uppercase">
              Step 1
            </div>
            <h2 className="text-xl font-bold text-[#0B1F33] mb-3">
              Lead Capture & Distribution
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
              When students fill out an inquiry form on Facebook, Instagram, Google Ads, or your website, their contact details arrive directly on your counselors&apos; screens in under 60 seconds.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>• Fair lead sharing: distribute new inquiries evenly across counselors.</li>
              <li>• Ad campaign tracking: know exactly which ad brought in the lead.</li>
              <li>• Zero duplicate leads: automatically merges repeat inquiries.</li>
            </ul>
          </div>

          {/* 2. Android Telecalling */}
          <div className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC]">
            <div className="text-xs font-mono text-slate-500 font-bold mb-2 uppercase">
              Step 2
            </div>
            <h2 className="text-xl font-bold text-[#0B1F33] mb-3">
              Counselor Calling App
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
              Counselors install our Android app on their phones. They tap to call directly from their daily student list without manually typing numbers.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>• Automatic call tracking: logs talk time, call outcome, and time of day.</li>
              <li>• Works offline: stores call data locally if network drops and syncs later.</li>
              <li>• 2-tap notes: counselors select Interested, Callback, or Enrolled immediately.</li>
            </ul>
          </div>

          {/* 3. WhatsApp Follow-ups */}
          <div className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC]">
            <div className="text-xs font-mono text-slate-500 font-bold mb-2 uppercase">
              Step 3
            </div>
            <h2 className="text-xl font-bold text-[#0B1F33] mb-3">
              WhatsApp & Payment Links
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
              Keep interested students warm without counselors having to copy-paste messages all day.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>• Send course brochures and fee structures with one click.</li>
              <li>• Automated reminders for upcoming demo classes.</li>
              <li>• Direct UPI and card payment links sent directly to parents&apos; WhatsApp.</li>
            </ul>
          </div>

          {/* 4. Reporting & Student Portal */}
          <div className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC]">
            <div className="text-xs font-mono text-slate-500 font-bold mb-2 uppercase">
              Step 4
            </div>
            <h2 className="text-xl font-bold text-[#0B1F33] mb-3">
              Reports & Student Portal
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
              Institute owners get full transparency over team performance and course material security.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>• Daily performance board: see talk time and conversion rate per counselor.</li>
              <li>• Download complete Excel/CSV data anytime with zero lock-in.</li>
              <li>• Anti-piracy lecture portal: student phone number floats over recorded classes.</li>
            </ul>
          </div>

        </div>

        {/* Sales Help CTA Box */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">
              Have questions about connecting your setup?
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Speak directly with our onboarding team at <span className="text-white font-bold">+91 81318 38253</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+918131838253"
              className="px-5 py-2.5 rounded-xl bg-white text-[#0B1F33] text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Call Us
            </a>
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
