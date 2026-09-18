import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { Download, Smartphone, ShieldCheck, Zap, WifiOff, PhoneCall, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Download Mobile App | HEEYAKU CallTracker',
  description: 'Download the official HEEYAKU CallTracker Android APK for automated telecaller logging, offline synchronization, and real-time CRM lead updates.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Telephony Client</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            HEEYAKU <span className="text-[#2563EB]">CallTracker</span> for Android
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Empower your counseling and telecalling teams with real-time automatic call tracking, offline sync resilience, and instantaneous CRM disposition capture directly from their Android smartphones.
          </p>

          {/* Primary Download Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/api/download/apk"
              download="heeyaku-calltracker.apk"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-2xl shadow-xl shadow-blue-500/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              <span>Download Android APK</span>
            </a>

            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Version 1.0.4 • Direct Download • ~35 MB</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center mb-4">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Automated Call Capture</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Detects incoming, outgoing, missed, and rejected calls with exact timestamps and durations without telecallers needing manual data entry.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-4">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Offline Queue & Auto-Retry</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Calls made in basements or elevators are queued securely in native encrypted storage and auto-flushed the moment network connectivity returns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#2563EB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Instant Lead Dispositions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pops up mandatory outcome tags immediately after a call ends to categorize converted, interested, or callback leads directly in PostgreSQL.
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white dark:bg-[#0B1726] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33] dark:text-white mb-6 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>How to Install on Your Android Device</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1F33] dark:text-white mb-1">Download APK</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tap the button above from your Android phone browser to download <code className="text-[#2563EB] font-mono">heeyaku-calltracker.apk</code>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1F33] dark:text-white mb-1">Allow Unknown Sources</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open the downloaded file. When prompted by Android security, enable "Install unknown apps" for your browser.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1F33] dark:text-white mb-1">Log in & Grant Permissions</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sign in with your employee email and password. Grant Telephony & Call Log permissions to activate background synchronization.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Compatible with Android 8.0, 9.0, 10, 11, 12, 13, 14, 15, and 16</span>
            </div>
            <Link href="/" className="font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
              <span>Return to Web Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
