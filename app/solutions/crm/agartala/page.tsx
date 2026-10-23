import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';

export const metadata: Metadata = {
  title: 'Best CRM Company in Agartala, Tripura | HEEYAKU Telephony CRM',
  description:
    'Looking for the best CRM software company in Agartala, Tripura? HEEYAKU provides enterprise SIM-based telephony CRM, automated lead distribution, and zero VoIP fees for businesses in Agartala and Northeast India.',
  keywords: [
    'Best CRM company in Agartala',
    'Best CRM in Agartala',
    'CRM software in Agartala',
    'CRM company in Agartala Tripura',
    'Top software company in Agartala',
    'Tripura IT Park software company',
    'Insyssky alternative Agartala',
    'Hembro Infotech alternative',
    'Telecalling CRM Agartala',
    'Lead management software Tripura',
    'Sales CRM Northeast India',
  ],
  alternates: {
    canonical: 'https://heeyaku.com/solutions/crm/agartala',
  },
  openGraph: {
    title: 'Best CRM Company in Agartala, Tripura | HEEYAKU',
    description:
      'The #1 Sales Telephony CRM designed in Agartala, Tripura. Cut ₹50,000/mo VoIP costs, eliminate fake calls, and automate your sales pipeline.',
    url: 'https://heeyaku.com/solutions/crm/agartala',
    type: 'website',
  },
};

export default function AgartalaCRMPage() {
  const localHubs = [
    { name: 'Tripura IT Park (RK Nagar)', desc: 'Emerging tech & software center' },
    { name: 'Battala & Melarmath', desc: 'Commercial distribution & retail trade' },
    { name: 'Bodhjungnagar Industrial Zone', desc: 'Manufacturing & supply-chain units' },
    { name: 'Kunjaban & Banamalipur', desc: 'Healthcare, clinic & institutional services' },
    { name: 'Ujjayanta & Central City', desc: 'Services, academies & startup ventures' },
  ];

  const comparisonPoints = [
    {
      feature: 'Calling Infrastructure',
      localAgencies: 'Expensive landline VoIP or manual unlogged dials',
      heeyaku: 'Native Android SIM Calling (Unlimited free carrier packs)',
    },
    {
      feature: 'Disposition Accuracy',
      localAgencies: 'Honor system (reps fake Contacted status)',
      heeyaku: 'Hardware KPI Gating (verified talk duration only)',
    },
    {
      feature: 'Speed-to-Lead Response',
      localAgencies: 'Manual Excel copy-pasting taking hours',
      heeyaku: 'Sub-second automated round-robin lead routing',
    },
    {
      feature: 'Data Leakage Protection',
      localAgencies: 'Open spreadsheets prone to rep theft',
      heeyaku: 'Strict 4-tier RBAC (CEO-only lead CSV export)',
    },
    {
      feature: 'Cost Model',
      localAgencies: 'Lump-sum legacy dev fees + recurring maintenance',
      heeyaku: 'Predictable low-cost SaaS ($0 cloud infrastructure bill)',
    },
  ];

  const faqs = [
    {
      q: 'Why is HEEYAKU the best CRM company in Agartala, Tripura?',
      a: 'Unlike traditional software vendors that build outdated desktop applications, HEEYAKU is a next-generation cloud telephony CRM. It pairs native Android SIM calling with an enterprise Next.js dashboard, enabling local businesses to track sales calls, manage customer pipelines, and eliminate agent fraud without paying expensive per-minute VoIP bills.',
    },
    {
      q: 'Can Agartala businesses integrate their existing Google Sheets with HEEYAKU?',
      a: 'Yes. HEEYAKU features automated bi-directional Google Sheets sync and custom API webhooks, allowing inquiries from Facebook Ads, websites, and offline forms to flow directly into sales reps’ Android calling queues in milliseconds.',
    },
    {
      q: 'Do sales reps need expensive laptops or VoIP headsets?',
      a: 'No. HEEYAKU’s mobile-first architecture allows sales representatives (BDAs) to operate directly from their standard Android smartphones using their existing SIM cards, saving businesses thousands in hardware and telephony infrastructure.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Local Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            #1 CRM SOFTWARE COMPANY IN AGARTALA, TRIPURA
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            The #1 CRM Company in Agartala. <br />
            <span className="text-[#2563EB]">Built for High-Velocity Sales.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Empower your sales and telecalling teams in Tripura with native Android SIM-based calling, verified talk-time telemetry, automated lead distribution, and zero VoIP bills.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <BookDemoButton className="!bg-[#2563EB] hover:!bg-blue-600 text-white font-bold px-7 py-4 rounded-xl shadow-lg transition-all" />
            <Link
              href="/pricing"
              className="px-7 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F33] font-bold text-sm transition-all"
            >
              Explore Pilot Pricing (₹19,999 Flat) →
            </Link>
          </div>
        </div>

        {/* Local Commercial Coverage */}
        <div className="mb-16 p-8 rounded-3xl bg-[#F8FAFC] border border-slate-200/90 shadow-sm space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33]">
              Serving Businesses Across Agartala & Tripura
            </h2>
            <p className="text-sm text-slate-600">
              From enterprise tech hubs to busy retail and distribution corridors, HEEYAKU equips local founders with modern sales automation:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {localHubs.map((hub, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-[#0B1F33]">{hub.name}</div>
                <div className="text-slate-500">{hub.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-20 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
              HEAD-TO-HEAD COMPARISON
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F33] tracking-tight">
              Why Agartala Startups Are Upgrading to HEEYAKU
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              See how modern SIM-telephony CRM compares to legacy local agencies and out-of-the-box global tools:
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0B1F33] text-white">
                <tr>
                  <th className="p-4 sm:p-5 font-bold">Sales Capability</th>
                  <th className="p-4 sm:p-5 font-bold">Traditional Local Agencies & Excel</th>
                  <th className="p-4 sm:p-5 font-bold text-blue-300">HEEYAKU Telephony CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {comparisonPoints.map((pt, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-4 sm:p-5 font-bold text-[#0B1F33]">{pt.feature}</td>
                    <td className="p-4 sm:p-5 text-slate-600">{pt.localAgencies}</td>
                    <td className="p-4 sm:p-5 font-semibold text-[#2563EB] bg-blue-50/30">
                      {pt.heeyaku}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local FAQs Section for Google PAA (People Also Ask) */}
        <div className="mb-20 space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
              CRM Software in Agartala & Tripura
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-[#0B1F33]">
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final Conversion Banner */}
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0B1F33] text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-3">
            <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              SCHEDULE A LOCAL WORKSPACE DEMO
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to scale your Agartala sales team?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Get an instant walkthrough of HEEYAKU with our team. Automate your leads, verify caller talk times, and grow your business today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <BookDemoButton className="!bg-[#2563EB] hover:!bg-blue-600 text-white font-bold px-7 py-4 rounded-xl shadow-lg transition-all" />
            <Link
              href="/resources/blog/best-crm-software-agartala-tripura"
              className="px-7 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 text-sm transition-all"
            >
              Read Local Agartala Guide →
            </Link>
          </div>
        </div>

        {/* Legal Fair Use & Telephony Regulatory Notice */}
        <div className="mt-14 pt-6 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong>Fair Use & Trademark Notice:</strong> Any references to regional software providers or third-party CRM products on this page are made solely for nominative identification, benchmarking, and fair comparative analysis under Section 30 of the Indian Trade Marks Act, 1999. All trademarks and brand names are the exclusive property of their respective holders. HEEYAKU operates independently with zero third-party affiliation or endorsement. SIM calling features rely on the user&apos;s authorized cellular service contract in full compliance with TRAI telecommunication and DND guidelines.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
