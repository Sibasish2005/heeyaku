'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function SolutionsAutomationPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            WHATSAPP & PAYMENT AUTOMATIONS
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Automate Follow-Ups. <br />
            <span className="text-[#2563EB]">Collect Fees Faster.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Stop forcing admission counselors to copy-paste messages all day. Automatically send course brochures, demo class invites, and 1-tap UPI fee links directly on WhatsApp.
          </p>
        </div>

        {/* 3 Full-Scale Bento Feature Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                BROCHURE DISPATCH
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Instant Course Brochures
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                When a student submits an inquiry on your website or social media ads, their official syllabus PDF and fee structure is sent to their WhatsApp within 10 seconds.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• Zero waiting: student gets immediate information.</div>
                <div>• Personalized with the student&apos;s name and course.</div>
                <div>• Prompts them to pick a convenient counselor call slot.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Instant Delivery on Form Submit
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                CALENDAR SYNC
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Demo & Class Reminders
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Up to 40% of students forget scheduled demo classes. Automated WhatsApp reminders sent 1 hour and 15 minutes before the session dramatically increase attendance.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• 1-click meeting join link directly inside the chat.</div>
                <div>• Automatic reschedule options if the student is busy.</div>
                <div>• Notifies the counselor when the student confirms attendance.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              +40% Demo Class Attendance
            </div>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                UPI INTEGRATION
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                1-Tap Fee Payment Links
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                Counselors can send customized payment links for registration fees, full tuition, or monthly installments. Parents pay via PhonePe, Google Pay, or cards.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-700 font-medium">
                <div>• Official branded payment receipt sent automatically.</div>
                <div>• Automatic course access unlock upon fee confirmation.</div>
                <div>• Eliminates manual checking of bank screenshot proofs.</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Direct to Your Institute Bank Account
            </div>
          </div>

        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to automate your follow-ups?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Schedule an interactive walkthrough or call our team directly at <span className="text-white font-bold">+91 81318 38253</span>.
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
