'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  Newspaper, 
  ArrowRight, 
  Clock, 
  Sparkles,
  Zap,
  Terminal,
  TrendingUp
} from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: 'Eliminating N+1 Roundtrips in Telephony Call Log Synchronization',
      category: 'ENGINEERING',
      tagColor: 'text-[#2563EB] bg-blue-50 border-blue-200',
      date: 'Sep 2026',
      readTime: '6 min read',
      excerpt: 'How we transitioned from sequential loop queries to batched Postgres lookups with in-memory single-connected call constraint resolution.',
    },
    {
      title: 'The Sub-60-Second Lead Response Rule: Why Speed Is Everything',
      category: 'CONVERSION',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      date: 'Aug 2026',
      readTime: '4 min read',
      excerpt: 'Calling a prospective student within 1 minute of a form fill increases live enrollment rates by 391% compared to a 30-minute delay.',
    },
    {
      title: 'Architecting an Offline-First Call Tracker on Android with React Native',
      category: 'ARCHITECTURE',
      tagColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      date: 'Aug 2026',
      readTime: '8 min read',
      excerpt: 'Designing native SQLite and SharedPreferences queues with auto-retry backoff to ensure telecallers never drop a lead record.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <Newspaper className="w-3.5 h-3.5" />
            <span>ENGINEERING INSIGHTS & BENCHMARKS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Insights on Growth, <br />
            <span className="text-[#2563EB]">Latency & Telephony</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Practical strategies, technical case studies, and engineering breakdowns for modern academy founders, operators, and developers.
          </p>
        </div>

        {/* Blog Post List (Architectural Bento Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className="p-8 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:bg-white transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${post.tagColor}`}>
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="text-lg font-extrabold tracking-tight text-[#0B1F33] mb-3 leading-snug group-hover:text-[#2563EB] transition-colors">
                  {post.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-[#2563EB] group-hover:translate-x-1 transition-transform">
                <span>Read Technical Deep Dive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Get our bi-weekly architecture breakdowns.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Join 4,500+ edtech founders, engineering leads, and academy operators.
            </p>
          </div>
          <div>
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
