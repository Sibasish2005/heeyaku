'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            Customer Stories
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            See how coaching centers and training bootcamps use HEEYAKU to improve counselor calling speed, stop video leaks, and enroll more students.
          </p>
        </div>

        {/* 2 Clear Case Stories */}
        <div className="space-y-8 mb-16">
          
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Competitive Exam Prep • Kota, Rajasthan
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33] mt-1">
                Apex Career Classes: From 6-Hour Delays to 1-Minute Response
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed pt-2">
              <div className="space-y-2">
                <div className="font-bold text-[#0B1F33] text-sm">The Problem:</div>
                <p>
                  14 telecallers were manually copy-pasting student inquiries from Facebook ad lead forms into shared Google Sheets. Leads sat untouched for 4 to 8 hours before counselors dialed. Many students had already enrolled with other coaching centers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#0B1F33] text-sm">The Result with HEEYAKU:</div>
                <p>
                  Installed HEEYAKU CallTracker on all 14 Android phones. Fresh ad leads now ring on counselor phones in under 60 seconds. Talk times and follow-up notes are recorded automatically. Enrolled 34% more students in their NEET crash course.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                IT & Coding Bootcamp • Bangalore, Karnataka
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33] mt-1">
                SkillEdge Bootcamp: Stopping Course Video Piracy & Collecting Fees
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed pt-2">
              <div className="space-y-2">
                <div className="font-bold text-[#0B1F33] text-sm">The Problem:</div>
                <p>
                  Their live and recorded software engineering lectures were being screen-recorded by enrolled students and shared across Telegram groups, resulting in massive revenue losses.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-[#0B1F33] text-sm">The Result with HEEYAKU:</div>
                <p>
                  Switched to HEEYAKU video player. The student&apos;s full name, phone number, and roll number float dynamically across class videos. Screen-recording leaks stopped immediately, and direct course enrollments grew by ₹14 Lakhs in two months.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div className="p-8 rounded-2xl bg-[#0B1F33] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">
              Ready to see similar results at your academy?
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Call our team directly at +91 81318 38253.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+918131838253"
              className="px-5 py-2.5 rounded-xl bg-white text-[#0B1F33] font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Call +91 81318 38253
            </a>
            <Link
              href="/book-demo"
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-600 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
