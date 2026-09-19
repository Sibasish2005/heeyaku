'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            TRANSPARENT ADMISSION PRICING
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Simple, Honest Pricing. <br />
            <span className="text-[#2563EB]">No Hidden Setup Fees.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Choose the right plan for your coaching institute, academy, or multi-branch setup. Every plan includes full setup support and Android tracking.
          </p>
        </div>

        {/* 3 Full-Scale Pricing Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-stretch">
          
          {/* Tier 1: Starter */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-8">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STARTER ACADEMY
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] mb-1">
                ₹2,499
                <span className="text-sm font-normal text-slate-500"> / month</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                Best for single-branch coaching centers getting started with telecalling.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Up to 5 Counselor Android App Accounts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Automatic Call Duration & Talk-Time Tracking</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Centralized Lead Dashboard with 2-Tap Notes</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>WhatsApp Brochure & Demo Reminders</span>
                </div>
              </div>
            </div>

            <Link
              href="/book-demo"
              className="block w-full text-center py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-[#2563EB] text-slate-800 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Tier 2: Growth (Featured) */}
          <div className="p-8 sm:p-10 rounded-3xl border-2 border-[#2563EB] bg-white shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-8 relative">
            <div>
              <div className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-2">
                MOST POPULAR • GROWTH INSTITUTE
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] mb-1">
                ₹5,999
                <span className="text-sm font-normal text-slate-500"> / month</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                For growing institutes with active counselors and lecture delivery.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Up to 15 Counselor Android App Accounts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Direct Facebook & Google Ads Integration (Under 60s)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Anti-Piracy Video Portal with Student Watermark</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Automated WhatsApp Fee Installment Links</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Dedicated Onboarding Manager via Phone & WhatsApp</span>
                </div>
              </div>
            </div>

            <Link
              href="/book-demo"
              className="block w-full text-center py-3.5 rounded-2xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors shadow-md shadow-blue-500/20"
            >
              Start With Growth
            </Link>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-8">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                MULTI-BRANCH ENTERPRISE
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] mb-1">
                Custom
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                For academies with 15+ telecallers across multiple cities or franchises.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Unlimited Counselor & Faculty Accounts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Multi-Branch Permission Hierarchies</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Custom Admission Website on Your Domain</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Custom CRM Fields, Batch Schedules & Reporting</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>Priority 24/7 Hotline & WhatsApp Support</span>
                </div>
              </div>
            </div>

            <a
              href="tel:+918131838253"
              className="block w-full text-center py-3.5 rounded-2xl bg-[#0B1F33] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
            >
              Call for Custom Quote
            </a>
          </div>

        </div>

        {/* Bottom Contact Strip */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Have questions about pricing or customization?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Call our advisory desk directly at <span className="text-white font-bold">+91 81318 38253</span> or book an interactive walkthrough.
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
