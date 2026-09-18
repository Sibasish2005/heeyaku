'use client';

import React from 'react';

const INTEGRATIONS = [
  {
    name: 'WhatsApp Business',
    category: 'Student Communication',
    desc: 'Send brochures, class schedules, and fee receipts directly to parents and students.',
    bentoClass: 'md:col-span-2 lg:col-span-8',
  },
  {
    name: 'UPI & Payment Gateways',
    category: 'Fee Collection',
    desc: 'Collect fees through PhonePe, Google Pay, Paytm, credit cards, or split installment options.',
    bentoClass: 'md:col-span-1 lg:col-span-4',
  },
  {
    name: 'Facebook & Instagram Ads',
    category: 'Lead Capture',
    desc: 'New leads from Meta lead forms arrive on counselors’ phones in under 60 seconds.',
    bentoClass: 'md:col-span-1 lg:col-span-4',
  },
  {
    name: 'Google Ads & Search',
    category: 'Ad Attribution',
    desc: 'Track which keyword or campaign brought each prospective student inquiry.',
    bentoClass: 'md:col-span-1 lg:col-span-4',
  },
  {
    name: 'Excel & CSV Data Export',
    category: 'Reporting & Backups',
    desc: 'Download your entire student directory and counselor call records anytime with zero lock-in.',
    bentoClass: 'md:col-span-2 lg:col-span-4',
  },
];

export default function IntegrationsEcosystem() {
  return (
    <section id="integrations" className="relative w-full bg-white py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Header (Zero Badges, Zero Icons) */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            Connected With What You Already Use
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            Connects Directly to Your Existing Setup
          </h2>
          <p className="mt-3 text-base text-slate-600 font-medium">
            No complicated migration. Connect your ads, WhatsApp number, and payment accounts in a few clicks.
          </p>
        </div>

        {/* Clean Bento Grid (Zero Badges, Zero Icons) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className={`p-7 sm:p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:bg-white transition-colors ${item.bentoClass}`}
            >
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                  {item.category}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-2">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200/80 text-xs font-bold text-[#2563EB]">
                Instant Sync Available
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
