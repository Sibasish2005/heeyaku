import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { CreditCard, CheckCircle2, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Transparent Pricing & Enterprise Tiers | HEEYAKU',
  description: 'Predictable, all-inclusive pricing for coaching institutes, training academies, and edtech scale-ups. No hidden seat fees.',
};

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Transparent Investment</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            Predictable Pricing for <span className="text-[#2563EB]">Scalable Growth</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Eliminate separate subscriptions for CRM, telecalling software, LMS hosting, and WhatsApp bots. One unified platform, predictable pricing.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
                tier.popular
                  ? 'bg-[#0B1F33] text-white shadow-2xl shadow-blue-500/20 ring-2 ring-[#2563EB] scale-105 relative z-10'
                  : 'bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div>
                {tier.popular && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB] text-white text-[11px] font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-[#0B1F33] dark:text-white'}`}>
                  {tier.name}
                </h3>
                <p className={`text-xs mb-6 leading-relaxed ${tier.popular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tier.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                  <span className={`text-xs font-semibold ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.period}</span>
                </div>

                <div className={`h-px w-full mb-6 ${tier.popular ? 'bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'}`} />

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.popular ? 'text-blue-400' : 'text-emerald-500'}`} />
                      <span className={tier.popular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/#book-demo"
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider text-center transition-all active:scale-95 ${
                  tier.popular
                    ? 'bg-[#2563EB] hover:bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-[#0B1F33] hover:text-white text-[#0B1F33] dark:text-slate-200'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Security & Guarantee Note */}
        <div className="text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>14-Day Full Migration Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2563EB]" />
            <span>Zero Long-Term Lock-in Contracts</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
