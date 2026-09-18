import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { Globe, CheckCircle2, ArrowRight, Gauge, Sparkles, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'High-Converting Web Interfaces | HEEYAKU',
  description: 'Custom, blazing-fast web platforms engineered with Next.js, sub-100ms TTFB, modern aesthetic micro-interactions, and conversion-optimized checkout funnels.',
};

export default function WebSolutionPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Globe className="w-3.5 h-3.5" />
            <span>High-Performance Web</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            High-Converting <span className="text-[#2563EB]">Web Interfaces</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Slow landing pages destroy ad spend ROI. HEEYAKU builds next-generation, server-rendered web applications with 99+ Google Lighthouse scores, frictionless checkout, and rich design aesthetics.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center mb-4">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Sub-100ms TTFB</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Edge-rendered with Next.js Turbopack and globally distributed CDN caching so pages load instantly on 3G/4G networks.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Micro-Interactions</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Physical spring physics, glassmorphism, and responsive interactive elements that captivate prospective students and build brand trust.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-2">Checkout Funnels</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Frictionless 1-step checkout flows with auto OTP verification, instant payment status callbacks, and zero drop-off loops.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Transform your academy's digital storefront</h3>
            <p className="text-sm text-blue-200 max-w-xl">Get a custom web architecture audit and speed benchmark.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Request Web Audit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
