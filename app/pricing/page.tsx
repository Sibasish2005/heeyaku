'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Shield, 
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Growth Academy',
      price: '₹14,999',
      period: '/month',
      description: 'Ideal for coaching academies scaling from 100 to 1,000 active students.',
      features: [
        'Up to 10 Telecaller Android App seats',
        'Custom Lead Management CRM',
        'Real-time automated call logging',
        'Single connected call deduplication',
        'Basic WhatsApp automated triggers',
        'Standard 99.9% uptime SLA',
      ],
      popular: false,
    },
    {
      name: 'Pro Institute',
      price: '₹34,999',
      period: '/month',
      description: 'For established training academies scaling multiple course batches simultaneously.',
      features: [
        'Up to 35 Telecaller Android App seats',
        'DRM Encrypted LMS Video Streaming',
        'Dynamic student watermark protection',
        'Advanced MetaBrain Conversion Analytics',
        'Automated multi-step WhatsApp sequences',
        'Sub-60s instant lead dialer routing',
        'Dedicated account manager & 24/7 support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise Scale',
      price: 'Custom',
      period: '',
      description: 'For national test prep chains and large-scale digital bootcamps.',
      features: [
        'Unlimited Telecaller Android App seats',
        'Dedicated Mumbai database cluster',
        'Custom ERP & payment gateway integration',
        'Multi-center tenant isolation',
        'Custom SSO & role-based permissions',
        '99.99% enterprise SLA guarantee',
      ],
      popular: false,
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
            <CreditCard className="w-3.5 h-3.5" />
            <span>TRANSPARENT ARCHITECTURE PRICING</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Predictable Pricing for <br />
            <span className="text-[#2563EB]">Scalable Growth</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Eliminate fragmented subscriptions for CRM, telecalling dialers, LMS hosting, and WhatsApp bots. One unified operating system with transparent tiers.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-8 sm:p-10 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
                tier.popular
                  ? 'bg-[#0B1F33] text-white shadow-2xl shadow-blue-500/20 ring-2 ring-[#2563EB] scale-105 relative z-10'
                  : 'bg-[#F8FAFC]/70 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:bg-white text-[#0B1F33]'
              }`}
            >
              <div>
                {tier.popular && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB] text-white text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3 h-3" />
                    <span>MOST POPULAR</span>
                  </div>
                )}

                <h3 className={`text-2xl font-extrabold mb-2 ${tier.popular ? 'text-white' : 'text-[#0B1F33]'}`}>
                  {tier.name}
                </h3>
                
                <p className={`text-xs mb-6 leading-relaxed font-medium ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tier.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                  <span className={`text-xs font-semibold ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                    {tier.period}
                  </span>
                </div>

                <div className={`h-px w-full mb-6 ${tier.popular ? 'bg-slate-700' : 'bg-slate-200/80'}`} />

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs font-medium">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.popular ? 'text-blue-400' : 'text-emerald-600'}`} />
                      <span className={tier.popular ? 'text-slate-200' : 'text-slate-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/book-demo"
                className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-center transition-all duration-150 active:scale-95 ${
                  tier.popular
                    ? 'bg-[#2563EB] hover:bg-blue-600 text-white shadow-md'
                    : 'bg-[#0B1F33] hover:bg-[#2563EB] text-white shadow-xs'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Security & Guarantee Note */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white text-xs font-medium text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-8 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>14-Day Full Migration Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2563EB]" />
            <span>Zero Long-Term Lock-in Contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Free Android App Installation</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
