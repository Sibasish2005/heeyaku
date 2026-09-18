'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function SolutionsWebPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            HIGH-CONVERTING ADMISSION WEBSITES
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Fast Course Websites. <br />
            <span className="text-[#2563EB]">Built for Mobile Enrollments.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Slow websites lose student inquiries. We build mobile-optimized landing pages and course catalogs that load in under 1 second, showcase your teachers, and collect student applications directly.
          </p>
        </div>

        {/* 3 Full-Scale Bento Feature Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                MOBILE PERFORMANCE
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Sub-Second Mobile Loading
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Over 85% of prospective students and parents visit your site from mobile phones. Our pages open instantly without sluggish loading spinners.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• Loads under 1 second even on 4G connections.</div>
                <div>• Clean course syllabus and fee comparison tables.</div>
                <div>• Optimized for Google and Meta Ads conversion tracking.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Under 1s Mobile Load Time
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                FEE CHECKOUT
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Simple UPI & Card Checkout
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Allow parents to pay seat reservation deposits or full fees directly on your website using PhonePe, Google Pay, Paytm, or Net Banking.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• Direct payment into your institute bank account.</div>
                <div>• Instant branded GST payment receipts sent to parents.</div>
                <div>• Supports split fee installments and early-bird discounts.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Direct Bank Settlement
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                DIRECT CRM CONNECTION
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Connected to Calling CRM
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Every inquiry form, brochure download, and webinar registration lands straight into counselors&apos; daily calling queues within 30 seconds.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• Zero CSV exports or manual spreadsheet copying.</div>
                <div>• Immediate automated WhatsApp syllabus sent to student.</div>
                <div>• Counselors alerted on Android app to call immediately.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Zero Lost Inquiries
            </div>
          </div>

        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready for a high-converting website?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Schedule a consultation or call our team directly at <span className="text-white font-bold">+91 81318 38253</span>.
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
