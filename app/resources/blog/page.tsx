'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { BLOG_ARTICLES } from '@/lib/blog/articles';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'LOCAL BUSINESS TECH',
    'SALES OPERATIONS',
    'COST OPTIMIZATION',
    'PIPELINE AUTOMATION',
  ];

  const filteredArticles =
    selectedCategory === 'ALL'
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        {/* Hero Section */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            PRACTICAL GUIDES, RESEARCH & BENCHMARKS
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Insights on Telephony CRM & <br />
            <span className="text-[#2563EB]">Sales Pipeline Acceleration.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Data-driven strategies on lead conversion, eliminating fake telecaller dispositions, cutting runaway VoIP bills, and scaling inside-sales operations across India.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-slate-200/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0B1F33] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-[#0B1F33]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {filteredArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/blog/${article.slug}`}
              className="group p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:bg-white hover:border-[#2563EB]/40 hover:shadow-xl transition-all space-y-6"
            >
              <div>
                <div className="text-xs font-mono text-slate-500 font-bold mb-3 flex items-center justify-between">
                  <span className="text-[#2563EB]">{article.category}</span>
                  <span>{article.readTime}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] group-hover:text-[#2563EB] transition-colors mb-3 leading-snug tracking-tight">
                  {article.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  {article.summary}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/80">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                  <span>Verified Result:</span>
                  <span className="font-bold">{article.metric}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-medium text-slate-500">
                    By {article.author.name}
                  </div>
                  <div className="text-xs font-bold text-[#2563EB] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read Full Guide →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Full-Scale Action Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-3">
            <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              GET RECOGNIZED WITH HEEYAKU
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to modernize your sales operations?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Equip your sales team with an enterprise telecalling CRM with SIM-based hardware tracking, automated lead distribution, and zero VoIP overhead.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <BookDemoButton className="!bg-[#2563EB] hover:!bg-blue-600 text-white font-bold px-7 py-4 rounded-xl shadow-lg transition-all" />
            <Link
              href="/pricing"
              className="px-7 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 text-sm transition-all"
            >
              See Plans & Pricing →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
