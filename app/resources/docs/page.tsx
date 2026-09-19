'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            SETUP GUIDE & SYSTEM ARCHITECTURE
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            How HEEYAKU Works. <br />
            <span className="text-[#2563EB]">Plain-English Setup Guide.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Everything your admission counselors, academic heads, and institute managers need to understand our system. No technical background or programming required.
          </p>
        </div>

        {/* 4 Full-Scale Architecture Bento Blocks (2x2 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Block 1 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 01 • INBOUND PIPELINE
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Lead Capture & Instant Distribution
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                When students fill out an inquiry form on Facebook, Instagram, Google Ads, or your website, their contact details land directly on your counselors&apos; screens in under 60 seconds.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div>• <strong>Fair lead sharing:</strong> Distributes new student inquiries evenly across counselors.</div>
                <div>• <strong>Ad campaign tracking:</strong> Know exactly which ad campaign brought each enrolled student.</div>
                <div>• <strong>Zero duplicates:</strong> Automatically merges repeat inquiries from the same phone number.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Lead Response Time:</span>
              <span className="font-bold text-[#2563EB]">Under 60 Seconds</span>
            </div>
          </div>

          {/* Block 2 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 02 • TELEPHONY APP
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Counselor Android Calling App
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                Counselors install our Android APK directly on their smartphones. They make calls normally, and the app tracks call duration and reminds them to take notes.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div>• <strong>Automatic call tracking:</strong> Logs talk time, timestamp, and connected/missed status.</div>
                <div>• <strong>Works offline:</strong> Stores call records locally if internet drops and syncs later.</div>
                <div>• <strong>2-tap notes:</strong> Counselors tag Interested, Callback, or Enrolled immediately.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Counselor Logging Accuracy:</span>
              <span className="font-bold text-emerald-700">100% Automatic</span>
            </div>
          </div>

          {/* Block 3 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 03 • WHATSAPP & UPI
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                WhatsApp Nurturing & Fee Links
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                Keep interested students warm without counselors copying messages manually. Send brochures, meeting links, and UPI payment links directly.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div>• <strong>Instant brochures:</strong> Send official course curriculum PDFs with one tap.</div>
                <div>• <strong>Class reminders:</strong> Automated reminders sent 1 hour before scheduled demo classes.</div>
                <div>• <strong>1-tap UPI payments:</strong> PhonePe and Google Pay links sent straight to parents on WhatsApp.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Fee Settlement:</span>
              <span className="font-bold text-emerald-700">Direct Bank Deposit</span>
            </div>
          </div>

          {/* Block 4 */}
          <div className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 04 • SECURITY & REPORTS
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                Reports & Anti-Piracy Lecture Portal
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium mb-6">
                Institute owners get complete transparency over counselor talk times and students watch lecture recordings with dynamic watermark protection.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
                <div>• <strong>Daily performance board:</strong> See talk time and conversion rate per counselor.</div>
                <div>• <strong>Zero lock-in export:</strong> Download complete Excel and CSV records anytime.</div>
                <div>• <strong>Floating watermarks:</strong> Student phone number floats across videos to stop Telegram leaks.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
              <span>Lecture Security:</span>
              <span className="font-bold text-[#2563EB]">Anti-Piracy Protected</span>
            </div>
          </div>

        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Have questions about connecting your setup?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Speak directly with our onboarding team at <span className="text-white font-bold">+91 81318 38253</span> or book an interactive walkthrough.
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
