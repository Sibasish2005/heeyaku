'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

export default function AutomationSolutionPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            WhatsApp & Follow-Up Automation
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Stop losing students who go cold after the first call. Send course brochures, trial class reminders, and fee payment links on WhatsApp automatically.
          </p>
        </div>

        {/* 3 Simple Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              1. Instant Course Brochures
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a student fills an inquiry form, they receive your syllabus PDF and institute welcome message on WhatsApp within 10 seconds.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Keeps students engaged before competitors even dial them.
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              2. Demo & Class Reminders
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Send automated WhatsApp reminders 1 hour before scheduled demo sessions or counselor calls so students don&apos;t forget to attend.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Improves demo show-up rates by up to 40%.
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F33]">
              3. 1-Tap Fee Payment Links
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a student agrees to join or installment fees are due, send a direct UPI and card payment link with the exact balance amount.
            </p>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Parents pay instantly via Google Pay, PhonePe, or credit card.
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div className="p-8 rounded-2xl bg-[#0B1F33] text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">
              Ready to automate your student follow-ups?
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Call our sales desk directly at +91 81318 38253.
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
