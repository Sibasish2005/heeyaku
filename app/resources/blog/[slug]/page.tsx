import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { BLOG_ARTICLES, BlogArticle } from '@/lib/blog/articles';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: 'Article Not Found | HEEYAKU CRM',
    };
  }

  return {
    title: `${article.title} | HEEYAKU Insights`,
    description: article.summary,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: '2026-10-23T00:00:00.000Z',
      authors: [article.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const otherArticles = BLOG_ARTICLES.filter((a) => a.slug !== slug).slice(0, 2);

  // Structured Data for Google Article Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.summary,
    author: {
      '@type': 'Organization',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'HEEYAKU',
      logo: {
        '@type': 'ImageObject',
        url: 'https://heeyaku.com/icon.svg',
      },
    },
    datePublished: '2026-10-23',
    dateModified: '2026-10-23',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://heeyaku.com/resources/blog/${article.slug}`,
    },
    keywords: article.keywords.join(', '),
  };

  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      {/* Schema Markup Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[400px] bg-gradient-to-r from-blue-100/40 via-sky-100/30 to-indigo-100/30 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 pt-32 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/resources/blog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2563EB] hover:underline"
          >
            ← Back to All Guides & Articles
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-4 mb-10 pb-8 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              {article.category}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500">{article.readTime}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500">Published {article.publishedAt}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-[1.15]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            {article.summary}
          </p>

          {/* Author & Benchmark Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0B1F33] text-white flex items-center justify-center font-bold text-sm">
                H
              </div>
              <div>
                <div className="text-sm font-bold text-[#0B1F33]">{article.author.name}</div>
                <div className="text-xs text-slate-500">{article.author.role}</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Impact: {article.metric}
            </div>
          </div>
        </header>

        {/* Article Body Content */}
        <article className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-base sm:text-lg">
          {/* Introduction */}
          <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
            {article.content.introduction}
          </p>

          {/* Dynamic Content Sections */}
          {article.content.sections.map((section, idx) => (
            <section key={idx} className="space-y-4 pt-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
                {section.heading}
              </h2>

              <div className="space-y-4">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-slate-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Optional Callout Box */}
              {section.callout && (
                <div className="p-6 my-6 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-blue-950 space-y-2">
                  <div className="font-bold text-sm text-[#2563EB] uppercase tracking-wider flex items-center gap-2">
                    <span>💡</span> {section.callout.title}
                  </div>
                  <p className="text-sm sm:text-base text-blue-900 leading-relaxed font-medium">
                    {section.callout.text}
                  </p>
                </div>
              )}

              {/* Optional Comparison Table */}
              {section.table && (
                <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#0B1F33] text-white">
                      <tr>
                        {section.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3.5 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3.5 font-medium text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          {/* Conclusion */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] mb-3">
              Summary & Next Steps
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {article.content.conclusion}
            </p>
          </div>
        </article>

        {/* In-Article Conversion Banner */}
        <div className="my-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0B1F33] to-[#1E3A5F] text-white space-y-6 shadow-xl">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              ENTERPRISE TELEPHONY FOR INDIAN SALES TEAMS
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to eliminate fake calls and scale your sales team?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Join high-velocity teams using HEEYAKU to automate lead assignment, verify agent talk time via native SIM calling, and stop revenue leakage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <BookDemoButton className="!bg-[#2563EB] hover:!bg-blue-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all" />
            <Link
              href="/pricing"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 text-sm transition-all"
            >
              View Pilot Plans (₹19,999 Flat) →
            </Link>
          </div>
        </div>

        {/* Read Next Section */}
        {otherArticles.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-extrabold text-[#0B1F33]">
              Recommended Guides & Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherArticles.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/resources/blog/${item.slug}`}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-[#2563EB]/40 bg-[#F8FAFC] hover:bg-white transition-all space-y-3 group"
                >
                  <div className="text-xs font-mono text-[#2563EB] font-bold">
                    {item.category} • {item.readTime}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#0B1F33] group-hover:text-[#2563EB] transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="text-xs font-bold text-[#2563EB] pt-2 flex items-center gap-1">
                    Read Article →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Legal Editorial Disclaimer */}
        <div className="mt-14 pt-6 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong>Editorial & Trademark Disclaimer:</strong> All third-party company names, product names, trademarks, and logos mentioned in this article (such as Zoho®, HubSpot®, Exotel®, Twilio®, Insyssky®, and Hembro Infotech®) are the exclusive property of their respective owners. Their mention is strictly for comparative educational analysis, industry review, and nominative identification under Section 30 of the Indian Trade Marks Act, 1999 (Nominative Fair Use). HEEYAKU operates independently with zero commercial affiliation, endorsement, or sponsorship from any referenced entity.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
