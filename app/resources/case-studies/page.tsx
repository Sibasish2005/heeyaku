'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            REAL INSTITUTE CASE STUDIES
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Proven Results. <br />
            <span className="text-[#2563EB]">Real Academy Transformations.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            See how coaching institutes and training academies replaced messy spreadsheets and manual call logs with HEEYAKU to increase admissions and eliminate piracy.
          </p>
        </div>

        {/* 2 Full-Scale Bento Case Study Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Case Study 1 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                IIT-JEE & NEET COACHING • 14 COUNSELORS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                From 6-Hour Lead Delays to Under 1-Minute Callbacks
              </h2>
              
              <div className="p-4 rounded-2xl bg-white border border-slate-200 my-4 space-y-1 text-xs sm:text-sm text-slate-700">
                <div><strong>The Problem:</strong> Leads from Meta and Google ads sat in a shared Google Sheet. Counselors dialed hours later after the student had already inquired with other coaching centers.</div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                <strong>The HEEYAKU Solution:</strong> Installed the Android Calling App on all 14 counselor phones. New leads now ring counselors in under 60 seconds with equal lead sharing.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl font-extrabold text-[#2563EB]">58 Sec</div>
                  <div className="text-xs text-slate-500 mt-0.5">Average First Call</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl font-extrabold text-emerald-700">+42%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Enrollment Growth</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Zero Lost Inquiries in Batch 2026
            </div>
          </div>

          {/* Case Study 2 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                TECH BOOTCAMP • 1,200 STUDENTS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Stopping Telegram Video Piracy & Automating UPI Fees
              </h2>
              
              <div className="p-4 rounded-2xl bg-white border border-slate-200 my-4 space-y-1 text-xs sm:text-sm text-slate-700">
                <div><strong>The Problem:</strong> Lecture recordings hosted on unlisted YouTube links were ripped and leaked on Telegram channels, costing hundreds of lost course sales.</div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                <strong>The HEEYAKU Solution:</strong> Switched to HEEYAKU&apos;s protected video player with dynamic student watermarking. Screen recording was blocked, and fee payments automated via WhatsApp UPI links.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl font-extrabold text-emerald-700">0 Leaks</div>
                  <div className="text-xs text-slate-500 mt-0.5">Video Piracy Stopped</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl font-extrabold text-[#2563EB]">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Automated UPI Receipts</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Complete Protection of Academic IP
            </div>
          </div>

        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready for similar results at your institute?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Schedule a personalized walkthrough or call our team directly at <span className="text-white font-bold">+91 81318 38253</span>.
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
