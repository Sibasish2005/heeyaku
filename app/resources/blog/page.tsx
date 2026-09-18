import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { Newspaper, ArrowRight, Calendar, Clock } from 'lucide-react';

export const metadata = {
  title: 'Insights & Engineering Blog | HEEYAKU',
  description: 'Deep dives on e-learning conversion rate optimization, telecalling latency engineering, offline sync algorithms, and academy growth strategies.',
};

export default function BlogPage() {
  const posts = [
    {
      title: 'Eliminating N+1 Roundtrips in Telephony Call Log Synchronization',
      category: 'Engineering',
      date: 'Sep 2026',
      readTime: '6 min read',
      excerpt: 'How we transitioned from sequential loop queries to batched Postgres lookups with in-memory single-connected call constraint resolution.',
    },
    {
      title: 'The Sub-60-Second Lead Response Rule: Why Speed Is Everything',
      category: 'Conversion',
      date: 'Aug 2026',
      readTime: '4 min read',
      excerpt: 'Calling a prospective student within 1 minute of a form fill increases live enrollment rates by 391% compared to a 30-minute delay.',
    },
    {
      title: 'Architecting an Offline-First Call Tracker on Android with React Native',
      category: 'Architecture',
      date: 'Aug 2026',
      readTime: '8 min read',
      excerpt: 'Designing native SQLite and SharedPreferences queues with auto-retry backoff to ensure telecallers never drop a lead record.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Newspaper className="w-3.5 h-3.5" />
            <span>HEEYAKU Insights</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            Insights & <span className="text-[#2563EB]">Engineering Blog</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Practical strategies, technical case studies, and engineering breakdowns for modern academy founders, operators, and developers.
          </p>
        </div>

        {/* Blog Post List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-bold text-[#2563EB] uppercase tracking-wider">{post.category}</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0B1F33] dark:text-white mb-3 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                <span>Read Full Article</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Want to receive our bi-weekly engineering breakdowns?</h3>
            <p className="text-sm text-blue-200 max-w-xl">Join 4,500+ edtech leaders and academy founders.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Subscribe to Newsletter</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
