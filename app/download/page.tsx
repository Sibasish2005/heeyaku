'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('Interested');

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            ANDROID TELEPHONY CLIENT (V1.0.4)
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Calling App for Counselors. <br />
            <span className="text-[#2563EB]">Zero Spreadsheet Work.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Install directly on your admission counselors&apos; Android smartphones. Automatically tracks student call duration, time of day, and quick notes without manual logging.
          </p>
        </div>

        {/* Main Action Grid (Landing Page Scale) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          
          {/* Left: Download Details */}
          <div className="lg:col-span-7 p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-8">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                OFFICIAL ANDROID APK • VERSION 1.0.4
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
                Install on Counselor Phones
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed font-medium">
                Compatible with all Android devices (Android 8.0 and above). Counselors dial normally from their daily student list, and the app logs the exact talk time automatically.
              </p>
            </div>

            {/* Direct Download Action */}
            <div className="space-y-3">
              <a
                href="/api/download/apk"
                download="heeyaku-calltracker.apk"
                onClick={handleDownload}
                className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-4 text-sm font-bold tracking-wider uppercase text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-2xl transition-all duration-150 shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              >
                {downloading ? 'Starting Download...' : 'Download Android APK (38 MB)'}
              </a>
              <div className="text-xs font-mono text-slate-500">
                Direct APK download. Safe, verified, and ready for your team.
              </div>
            </div>

            {/* 3 Value Points in Plain English */}
            <div className="pt-6 border-t border-slate-200 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <span className="font-bold text-[#2563EB] font-mono text-base">•</span>
                <span><strong>No Manual Logging:</strong> Outgoing, incoming, and missed calls are recorded automatically with exact talk times.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-[#2563EB] font-mono text-base">•</span>
                <span><strong>Works Without Internet:</strong> If a counselor is in a basement or elevator, calls save locally on the phone and sync automatically when internet returns.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-[#2563EB] font-mono text-base">•</span>
                <span><strong>Quick Notes After Every Call:</strong> When a call ends, counselors tap one button to tag the lead as Interested, Call Back, or Enrolled.</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Android Phone Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[310px] sm:w-[330px] rounded-[44px] bg-[#0B1F33] p-4 shadow-2xl border-4 border-slate-800">
              <div className="rounded-[32px] bg-white p-5 space-y-5 text-left">
                {/* Status Bar */}
                <div className="flex justify-between text-[11px] font-mono text-slate-500 pb-2 border-b border-slate-100">
                  <span>10:42 AM</span>
                  <span className="text-emerald-700 font-bold">● Sync Active</span>
                </div>

                {/* Simulated Incoming / Completed Call Card */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Call Ended • Auto-Logged</div>
                  <div className="text-base font-extrabold text-[#0B1F33]">Aditi Sharma</div>
                  <div className="text-xs font-mono text-slate-600">+91 98765 43210</div>
                  <div className="text-xs text-[#2563EB] font-bold pt-1">Talk Time: 4 min 12 sec</div>
                </div>

                {/* Instant Disposition Outcome Selector */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-slate-600 uppercase">
                    Select Call Outcome:
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {['Interested', 'Callback', 'Closed'].map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => setSelectedOutcome(outcome)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          selectedOutcome === outcome
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {outcome}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input Field */}
                <div>
                  <div className="text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
                    Quick Note:
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    Student asked for fee installment plan. Demo class scheduled for tomorrow 4 PM.
                  </div>
                </div>

                {/* Save Note Button */}
                <div className="pt-1">
                  <div className="w-full py-2.5 rounded-xl bg-[#0B1F33] text-white text-xs font-bold text-center">
                    ✓ Saved to Central Lead Board
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Sales Help Hotline Strip */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">
              Need assistance installing on multiple counselor phones?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Speak directly with our technical support team at <span className="text-white font-bold">+91 81318 38253</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+918131838253"
              className="px-6 py-3 rounded-full bg-white text-[#0B1F33] text-xs font-bold tracking-wider uppercase hover:bg-slate-100 transition-colors"
            >
              Call +91 81318 38253
            </a>
            <Link
              href="/book-demo"
              className="px-6 py-3 rounded-full bg-[#2563EB] text-white text-xs font-bold tracking-wider uppercase hover:bg-blue-600 transition-colors"
            >
              Book Walkthrough
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
