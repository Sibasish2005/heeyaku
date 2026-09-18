import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { Layers, CheckCircle2, ArrowRight, Users, Database, Shield, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Custom CRM & LMS Solutions | HEEYAKU',
  description: 'Built specifically for high-volume e-learning and coaching institutes. Unified lead conversion CRM, DRM video LMS, and telecalling analytics.',
};

export default function CrmSolutionPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Solution Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            Custom CRM & LMS for <span className="text-[#2563EB]">E-Learning Scale</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Generic CRMs fail when handling thousands of student inquiries and live webinar spikes. HEEYAKU provides an end-to-end custom operating system engineered to maximize student conversion and prevent revenue leakage.
          </p>
        </div>

        {/* Feature Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F33] dark:text-white mb-3">Instant Telecaller Lead Routing</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Distribute leads by team capacity, course vertical, or historical conversion rates. Telecallers receive leads instantly on their Android CallTracker app with 1-click dialing.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-round-robin distribution</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Single connected call deduplication rule</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time talk time benchmarking</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F33] dark:text-white mb-3">DRM Encrypted LMS</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Protect your proprietary course videos with dynamic watermarking, screen recording detection, and multi-device session prevention.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dynamic student email watermarks on video playback</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Encrypted HLS adaptive streaming</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Concurrent login restrictions</li>
            </ul>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Ready to scale your academy's sales pipeline?</h3>
            <p className="text-sm text-blue-200 max-w-xl">Deploy HEEYAKU's custom CRM & LMS architecture tailored to your team's workflow.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Schedule Architecture Call</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
