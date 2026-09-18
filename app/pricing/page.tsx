'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

const TIERS = [
  {
    name: 'Starter Academy',
    team: '1 to 5 Counselors',
    price: '₹2,499',
    period: '/ month',
    desc: 'Perfect for local coaching centers and small test-prep branches.',
    features: [
      'Android Call Tracker app for up to 5 counselors',
      'Automatic call duration and missed call logging',
      'Lead assignment board with sub-60s notification',
      'Post-call disposition notes (Interested, Callback, etc.)',
      'Standard WhatsApp brochure dispatch',
    ],
  },
  {
    name: 'Growth Institute',
    team: '6 to 20 Counselors',
    price: '₹5,999',
    period: '/ month',
    desc: 'For growing institutes with dedicated telecalling teams.',
    features: [
      'Android Call Tracker app for up to 20 counselors',
      'Round-robin and language-based lead distribution',
      'Automated WhatsApp follow-up drips & fee payment links',
      'Manager dashboard with daily call volume and talk time',
      'Uninterrupted offline sync queue',
    ],
  },
  {
    name: 'Multi-Branch Enterprise',
    team: '20+ Counselors',
    price: 'Custom',
    period: 'tailored pricing',
    desc: 'For multi-city coaching brands, university admissions, and large bootcamps.',
    features: [
      'Unlimited counselors across multiple branches',
      'Custom CRM data migration from your existing spreadsheets',
      'Direct API access and custom webhook integrations',
      'Piracy-protected video player with student roll-number watermark',
      'Dedicated support lead and staff onboarding training',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-32 pb-20">
        
        {/* Simple Non-Tech Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No hidden fees. Replace multiple messy subscriptions for calling apps, dialers, and spreadsheets with one unified system.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between space-y-6 ${
                idx === 1
                  ? 'bg-[#0B1F33] text-white border-[#0B1F33] shadow-lg'
                  : 'bg-slate-50/50 border-slate-200 text-[#0B1F33]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className={`text-xs font-mono font-bold uppercase tracking-wider ${idx === 1 ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {tier.team}
                  </div>
                  <h2 className="text-xl font-bold mt-1">
                    {tier.name}
                  </h2>
                  <p className={`text-xs mt-1 leading-relaxed ${idx === 1 ? 'text-slate-300' : 'text-slate-500'}`}>
                    {tier.desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold">
                    {tier.price}
                  </span>
                  <span className={`text-xs ${idx === 1 ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tier.period}
                  </span>
                </div>

                <div className={`pt-4 border-t space-y-2 text-xs ${idx === 1 ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <span className={idx === 1 ? 'text-[#38BDF8] font-bold' : 'text-[#2563EB] font-bold'}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/book-demo"
                className={`w-full py-3 rounded-xl text-center text-xs font-bold transition-colors ${
                  idx === 1
                    ? 'bg-[#2563EB] hover:bg-blue-600 text-white'
                    : 'bg-[#0B1F33] hover:bg-[#2563EB] text-white'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Direct Call Assistance Strip */}
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-[#0B1F33]">
              Need a custom plan for your counselors?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Talk directly to our sales lead. We will set up a trial plan tailored for your team size.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+918131838253"
              className="px-5 py-2.5 rounded-xl bg-[#0B1F33] text-white font-bold text-xs hover:bg-[#2563EB] transition-colors"
            >
              Call +91 81318 38253
            </a>
            <a
              href="https://wa.me/918131838253?text=Hi%20Heeyaku%2C%20I%20have%20a%20question%20about%20pricing%20plans%20for%20my%20institute."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20bd5a] transition-colors"
            >
              WhatsApp Support
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
