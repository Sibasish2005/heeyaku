'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  Gauge, 
  Sparkles, 
  ShieldCheck, 
  Smartphone,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function WebSolutionPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Globe className="w-3.5 h-3.5" />
            <span>HIGH-CONVERTING WEB PLATFORMS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Sub-100ms TTFB. <br />
            <span className="text-[#2563EB]">High-Converting Interfaces</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Slow, template-based websites bleed marketing budget. HEEYAKU builds customized, server-rendered Next.js digital storefronts with 99+ Lighthouse scores and frictionless checkout.
          </p>
        </div>

        {/* 3-Pillar Architectural Canvas */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 items-stretch">
            
            {/* 1. Performance */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6">
                  <Gauge className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  SUB-100ms EDGE RENDERING
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Edge-rendered with Next.js Turbopack and globally distributed CDN caching so your course pages load instantly on 3G and 4G networks.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Lighthouse Performance</span>
                    <span className="text-emerald-600">99 / 100</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>First Contentful Paint</span>
                    <span className="text-emerald-600">0.4s</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Collocated Mumbai serverless compute</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic image & font optimization</li>
              </ul>
            </div>

            {/* 2. Micro-Interactions */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  AESTHETIC CRAFT
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Engineered with physical spring animations, subtle glassmorphism, and responsive feedback that captivate visitors and establish instant authority.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Bounce Rate Reduction</span>
                    <span className="text-[#2563EB]">-38% drop</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Average Session Length</span>
                    <span className="text-[#2563EB]">4.8 mins</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Native spring physics via Framer Motion</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Accessible contrast ratios and clean typography</li>
              </ul>
            </div>

            {/* 3. High-Converting Checkout */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-white/60 hover:bg-white transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mb-3">
                  FRICTIONLESS CHECKOUT
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  Single-step checkout flow with auto OTP autofill, native UPI payment intents, and zero redirect drops for instant enrollment confirmation.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Payment Completion Rate</span>
                    <span className="text-emerald-600">92.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Checkout Abandonment</span>
                    <span className="text-emerald-600">Below 8%</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Razorpay, Cashfree & Stripe native integrations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time webhook order fulfillment</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Upgrade your academy's web platform.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Get an engineering performance benchmark of your current site.
            </p>
          </div>
          <div>
            <BookDemoButton text="Book a Demo" href="#book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
