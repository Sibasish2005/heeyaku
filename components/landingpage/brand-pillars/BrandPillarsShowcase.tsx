'use client';

import React from 'react';
import Link from 'next/link';

export default function BrandPillarsShowcase() {
  return (
    <section className="relative w-full bg-white py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            Built for Admissions & Learning
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            Technology that connects today. <br />
            Growth that lasts tomorrow.
          </h2>
        </div>

        {/* 3 Clear Pillars (Zero Badges, Zero Icons) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <Link
            href="/solutions/crm"
            className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] hover:bg-white transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="text-xs font-mono text-slate-500 font-bold uppercase mb-4">
                Pillar 1 • Telecalling & Leads
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] group-hover:text-[#2563EB] transition-colors mb-3">
                Call interested students in under 60 seconds.
              </h3>

              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                When students fill out an inquiry form, route it instantly to counselors&apos; phones. Never let hot leads sit cold in a spreadsheet.
              </p>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Average Callback Speed:</span>
                  <span className="font-bold text-[#2563EB]">1.4 Minutes</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Call Logging:</span>
                  <span className="font-bold text-emerald-700">100% Automatic</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Explore Calling CRM →
            </div>
          </Link>

          {/* Pillar 2 */}
          <Link
            href="/platform"
            className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] hover:bg-white transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="text-xs font-mono text-slate-500 font-bold uppercase mb-4">
                Pillar 2 • One Central Platform
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] group-hover:text-[#2563EB] transition-colors mb-3">
                Calling app, website, and classes in one place.
              </h3>

              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                No need to pay for 5 different software tools. Your admission board, student video portal, and fee links stay synced automatically.
              </p>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Student Screen Watermark:</span>
                  <span className="font-bold text-emerald-700">Anti-Piracy Protected</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Fee Receipts:</span>
                  <span className="font-bold text-[#0B1F33]">Instant WhatsApp Delivery</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              View All Features →
            </div>
          </Link>

          {/* Pillar 3 */}
          <Link
            href="/solutions/automation"
            className="p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] hover:bg-white transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="text-xs font-mono text-slate-500 font-bold uppercase mb-4">
                Pillar 3 • Follow-ups
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1F33] group-hover:text-[#2563EB] transition-colors mb-3">
                Brochures and fee links sent on WhatsApp.
              </h3>

              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                Keep parents and students updated with automated WhatsApp messages for demo class schedules, syllabus details, and UPI fee links.
              </p>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Brochure Delivery:</span>
                  <span className="font-bold text-emerald-700">Instant on Inquiry</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Fee Collection:</span>
                  <span className="font-bold text-[#2563EB]">1-Tap UPI Payment</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 text-xs font-bold text-[#2563EB]">
              Explore Automations →
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
