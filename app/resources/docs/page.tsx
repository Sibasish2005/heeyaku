import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { BookOpen, Terminal, Code2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const metadata = {
  title: 'Documentation & API Guides | HEEYAKU',
  description: 'Technical documentation for HEEYAKU: REST APIs, telecaller session tokens, webhook integration, and lead synchronization schemas.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Reference</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            HEEYAKU <span className="text-[#2563EB]">Developer Docs</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Integrate your existing ad funnels, webhooks, and telecaller endpoints with HEEYAKU's high-speed REST APIs and secure authentication tokens.
          </p>
        </div>

        {/* API Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-4">
              <KeyRound className="w-4 h-4" />
              <span>Authentication</span>
            </div>
            <h3 className="text-lg font-bold text-[#0B1F33] dark:text-white mb-2">HMAC Token Architecture</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Telecallers authenticate via <code className="font-mono text-[#2563EB]">/api/employee/auth/login</code> and receive a signed HMAC-SHA256 session token validated via constant-time timing-safe comparison.
            </p>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono overflow-x-auto">
              <code>Authorization: Bearer &lt;token&gt;</code>
            </pre>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">
              <Code2 className="w-4 h-4" />
              <span>Batch Synchronization</span>
            </div>
            <h3 className="text-lg font-bold text-[#0B1F33] dark:text-white mb-2">Call Sync Payload Schema</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Synchronize up to 50 call records per request with automatic deduplication, lead matching, and single-connected-call enforcement.
            </p>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono overflow-x-auto">
              <code>POST /api/employee/calls/sync</code>
            </pre>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Need a custom webhook or ERP integration?</h3>
            <p className="text-sm text-blue-200 max-w-xl">Our engineering team provides dedicated webhook integration assistance.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Contact Solutions Engineering</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
