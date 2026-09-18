'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function CrmSolutionPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            Counselor Lead CRM
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Built for education and coaching sales teams. Connect fresh student inquiries to available counselors in seconds, track talk time, and stop losing leads in spreadsheets.
          </p>
        </div>

        {/* 2 Clear Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Card 1: Fast Lead Calling */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <h2 className="text-xl font-bold text-[#0B1F33]">
              Fast Lead Distribution
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When a parent or student fills a form on your Facebook or Google ads, the lead shows up on your counselor&apos;s phone immediately.
            </p>
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
              <div>• <strong>Under 60-Second Response:</strong> Counselors call leads while interest is hot.</div>
              <div>• <strong>Fair Lead Sharing:</strong> Leads are distributed evenly so every counselor gets equal opportunities.</div>
              <div>• <strong>Automatic Call Duration:</strong> Track which counselors are talking to students and for how long.</div>
            </div>
          </div>

          {/* Card 2: Student Video Protection */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <h2 className="text-xl font-bold text-[#0B1F33]">
              Piracy-Protected Class Videos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When students enroll, they get access to your video classes with built-in screen recording deterrents.
            </p>
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
              <div>• <strong>Student Name on Screen:</strong> The student&apos;s name and roll number float across the video.</div>
              <div>• <strong>No Video Piracy:</strong> Students cannot record and share your expensive coaching lectures on Telegram or YouTube.</div>
              <div>• <strong>Instant Access:</strong> Course videos unlock the moment their fee payment is confirmed.</div>
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div className="p-8 rounded-2xl bg-[#0B1F33] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">
              Want to see how it works for your team?
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Call us directly at +91 81318 38253 or book a 15-minute walkthrough.
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
