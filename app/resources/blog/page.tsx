'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export default function BlogPage() {
  const articles = [
    {
      title: 'Why calling a student within 60 seconds doubles your enrollments',
      category: 'ADMISSION STRATEGY',
      readTime: '3 min read',
      summary: 'When a prospective student submits an inquiry form, their interest drops by 80% if they are not called within the first 10 minutes. Here is how top coaching centers organize instant callbacks.',
      metric: '391% Higher Enrollments',
    },
    {
      title: 'How to stop course videos from leaking on Telegram',
      category: 'STUDENT CONTENT SECURITY',
      readTime: '4 min read',
      summary: 'Unlisted YouTube and basic video links are easily downloaded and shared. Learn how dynamic watermarks with the student phone number and roll number deter screen-recording completely.',
      metric: 'Zero Telegram Leaks',
    },
    {
      title: 'Managing 10+ telecallers without messy Excel sheets',
      category: 'OPERATIONS & MANAGEMENT',
      readTime: '4 min read',
      summary: 'How coaching owners track daily talk time, total connected calls, and follow-up reminders across multiple branches without relying on manual self-reporting.',
      metric: '100% Automatic Talk Time',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            PRACTICAL GUIDES & BENCHMARKS
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Guides for Institute Growth. <br />
            <span className="text-[#2563EB]">Admissions & Security.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Straightforward strategies on lead conversion, counselor management, and lecture security for institute directors, sales heads, and academic founders.
          </p>
        </div>

        {/* 3 Full-Scale Bento Article Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {articles.map((item, idx) => (
            <div
              key={idx}
              className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:bg-white transition-all space-y-6"
            >
              <div>
                <div className="text-xs font-mono text-slate-500 font-bold mb-3 flex items-center justify-between">
                  <span>{item.category}</span>
                  <span>{item.readTime}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] mb-3 leading-snug tracking-tight">
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  {item.summary}
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#2563EB]">
                  Key Result: {item.metric}
                </div>

                <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
                  Read Full Guide →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Want a system built specifically for your academy?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Call us directly at <span className="text-white font-bold">+91 81318 38253</span> or book an interactive walkthrough.
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
