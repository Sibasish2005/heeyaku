'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            Download HEEYAKU for Android
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            The calling app for your admission counselors. Automatically tracks student calls, talk times, and follow-ups. No manual spreadsheet work.
          </p>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          
          {/* Left: Download Details */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-6">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Version 1.0.4 • Direct APK
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
                Install on Counselor Phones
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Works on any Android phone (Android 8 and above). Counselors make calls normally, and the app records the call duration and reminds them to take notes.
              </p>
            </div>

            {/* Direct Download Button */}
            <div className="space-y-2">
              <a
                href="/api/download/apk"
                download="heeyaku-calltracker.apk"
                onClick={handleDownload}
                className="inline-block w-full sm:w-auto text-center px-8 py-3.5 text-sm font-bold text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-xl transition-colors shadow-sm"
              >
                {downloading ? 'Starting Download...' : 'Download Android APK (38 MB)'}
              </a>
              <div className="text-[11px] text-slate-500">
                Direct file download. Safe and verified for your staff.
              </div>
            </div>

            {/* 3 Quick Features in Plain English */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">1.</span>
                <span><strong>No Manual Logging:</strong> Incoming, outgoing, and missed calls are recorded automatically with exact talk times.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">2.</span>
                <span><strong>Works Without Internet:</strong> If a counselor is in an elevator or basement, calls save on the phone and sync automatically once internet returns.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">3.</span>
                <span><strong>Quick Notes After Every Call:</strong> When a call ends, counselors tap one button to tag the lead as Interested, Call Back, or Enrolled.</span>
              </div>
            </div>
          </div>

          {/* Right: Clean Phone Screen Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[280px] rounded-[36px] bg-[#0B1F33] p-3 shadow-xl">
              <div className="rounded-[28px] bg-white p-4 space-y-4 text-left">
                {/* Phone Header */}
                <div className="flex justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-100">
                  <span>10:42 AM</span>
                  <span className="text-emerald-600 font-bold">Online</span>
                </div>

                {/* Counselor Status */}
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Counselor</div>
                  <div className="font-bold text-xs text-[#0B1F33]">Sarah Sharma</div>
                  <div className="text-[11px] text-slate-500">32 Calls Made Today (2h 14m)</div>
                </div>

                {/* Active Call Card */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <div className="text-[10px] font-mono text-[#2563EB] font-bold uppercase">Last Connected Call</div>
                  <div className="font-bold text-xs text-[#0B1F33]">Rahul Verma</div>
                  <div className="text-[11px] text-slate-600">Duration: 4m 18s</div>
                </div>

                {/* Quick Tagging Prompt */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Mark Call Result</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-center">
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Interested</span>
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Call Back</span>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Enrolled</span>
                    <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">No Answer</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-center text-slate-400 font-mono">
                  HEEYAKU CallTracker v1.0.4
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 3 Step Setup Guide */}
        <div className="pt-12 border-t border-slate-200">
          <h2 className="text-xl font-bold text-[#0B1F33] mb-6 text-center sm:text-left">
            How to Set Up in 3 Minutes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">Step 1: Download & Open</div>
              <p>Download the APK directly onto your counselor&apos;s phone and tap Install.</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">Step 2: Sign In</div>
              <p>Enter the staff code provided by your institute admin.</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">Step 3: Call Normally</div>
              <p>Counselors call students as usual. Everything logs automatically to your central dashboard.</p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
