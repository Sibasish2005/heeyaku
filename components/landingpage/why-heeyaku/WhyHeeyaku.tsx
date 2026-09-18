'use client';

import React from 'react';

const COMPARISONS = [
  {
    feature: 'Lead Dialing Speed',
    generic: 'Inquiries sit in spreadsheets for 4 to 8 hours before a counselor dials.',
    heeyaku: 'New leads arrive on counselors’ phones in under 60 seconds.',
  },
  {
    feature: 'Call Tracking & Notes',
    generic: 'Counselors manually type call duration or forget to update statuses.',
    heeyaku: 'Android app automatically logs talk time, call timestamp, and outcomes.',
  },
  {
    feature: 'Student Follow-Ups',
    generic: 'Manual copy-pasting of brochures and demo links across personal WhatsApp.',
    heeyaku: 'Automated WhatsApp delivery for course brochures, demo reminders, and fee links.',
  },
  {
    feature: 'Recorded Lecture Security',
    generic: 'Unlisted YouTube or basic videos easily downloaded and shared on Telegram.',
    heeyaku: 'Student phone number and roll number float on screen to block video theft.',
  },
  {
    feature: 'Fee Collection',
    generic: 'Chasing parents for bank receipts and manual account approvals.',
    heeyaku: '1-tap UPI payment links with instant WhatsApp receipts and automated batch unlock.',
  },
];

export default function WhyHeeyaku() {
  return (
    <section id="comparison" className="relative w-full bg-[#FAFCFF] py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            Clear Comparison
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            Generic Tools vs. HEEYAKU
          </h2>
          <p className="mt-3 text-base text-slate-600 font-medium">
            See the practical difference between disconnected spreadsheets and a dedicated coaching system.
          </p>
        </div>

        {/* Table (Zero Badges, Zero Icons) */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-6 bg-[#F8FAFC] border-b border-slate-200 text-xs font-mono font-bold uppercase text-slate-500">
            <div className="md:col-span-4">Operational Area</div>
            <div className="md:col-span-4 mt-2 md:mt-0">Generic Software / Spreadsheets</div>
            <div className="md:col-span-4 mt-2 md:mt-0 text-[#2563EB]">HEEYAKU Platform</div>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-slate-100">
            {COMPARISONS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-1 md:grid-cols-12 p-6 items-start gap-4 md:gap-6 hover:bg-slate-50/60 transition-colors"
              >
                <div className="md:col-span-4">
                  <div className="text-base font-bold text-[#0B1F33]">
                    {row.feature}
                  </div>
                </div>

                <div className="md:col-span-4 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                  <span className="md:hidden font-bold text-slate-400 block mb-1">Generic Stack:</span>
                  {row.generic}
                </div>

                <div className="md:col-span-4 text-xs sm:text-sm text-[#0B1F33] leading-relaxed font-semibold">
                  <span className="md:hidden font-bold text-[#2563EB] block mb-1">HEEYAKU:</span>
                  {row.heeyaku}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
