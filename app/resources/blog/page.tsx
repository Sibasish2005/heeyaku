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
      category: 'Admission Strategy',
      readTime: '3 min read',
      summary: 'When a prospective student submits an inquiry form, their interest drops by 80% if they are not called within the first 10 minutes. Here is how top coaching centers organize instant callbacks.',
    },
    {
      title: 'How to stop course videos from leaking on Telegram',
      category: 'Student Content Security',
      readTime: '4 min read',
      summary: 'Unlisted YouTube and basic video links are easily downloaded and shared. Learn how dynamic watermarks with the student phone number and roll number deter screen-recording completely.',
    },
    {
      title: 'Managing 10+ telecallers without messy Excel sheets',
      category: 'Operations & Management',
      readTime: '4 min read',
      summary: 'How coaching owners track daily talk time, total connected calls, and follow-up reminders across multiple branches without relying on manual reporting.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 pt-32 pb-24">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-3">
            Practical Guides
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] mb-4">
            Guides for Institute Growth & Admissions
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
            Straightforward strategies on lead conversion, counselor management, and lecture security for institute directors and sales teams.
          </p>
        </div>

        {/* Clean Article Cards (Zero Icons, Zero Badges) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {articles.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:bg-white transition-colors"
            >
              <div>
                <div className="text-xs font-mono text-slate-500 font-semibold mb-3 flex items-center justify-between">
                  <span>{item.category}</span>
                  <span>{item.readTime}</span>
                </div>

                <h2 className="text-lg font-bold text-[#0B1F33] mb-3 leading-snug">
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
                <span>Read Full Guide →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Box */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">
              Want a system built specifically for your academy?
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Call us directly at <span className="text-white font-bold">+91 81318 38253</span> or book an interactive walkthrough.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+918131838253"
              className="px-5 py-2.5 rounded-xl bg-white text-[#0B1F33] text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Call Us
            </a>
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
