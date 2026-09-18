'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const PILLARS = [
  {
    id: 'crm',
    title: 'Counselor CRM & Android App',
    tagline: 'Track every student call, talk time, and follow-up without messy Excel files.',
    highlights: [
      'Inquiries from Facebook, Instagram, and Google arrive in under 60 seconds.',
      'Counselors tap to call from Android phones; call duration is logged automatically.',
      'Fair lead distribution ensures equal opportunity across your counseling team.',
    ],
    metric1: '< 60 sec',
    metric1Label: 'First Call Speed',
    metric2: '100%',
    metric2Label: 'Call Logs Tracked',
    previewNote: 'Counselors log calls in 2 taps: Interested, Callback, or Enrolled.',
  },
  {
    id: 'lms',
    title: 'Student Portal & Anti-Piracy Video',
    tagline: 'Deliver recorded and live lectures without students leaking videos on Telegram.',
    highlights: [
      'Dynamic watermark shows the student name & phone number floating across the video.',
      'Screen recording and browser video downloaders are blocked automatically.',
      'Batch management with syllabus unlock after fee milestone verification.',
    ],
    metric1: 'Anti-Piracy',
    metric1Label: 'Video Protection',
    metric2: '100%',
    metric2Label: 'Mobile Compatible',
    previewNote: 'Students can watch lectures smoothly even on 4G mobile data.',
  },
  {
    id: 'web',
    title: 'Admission Websites & Funnels',
    tagline: 'High-speed course pages that convert visitors into student inquiries.',
    highlights: [
      'Loads in under 1 second on mobile phones for parents and students.',
      'Built-in UPI and card payment checkout with instant receipt generation.',
      'Course details, faculty profiles, and fee tables formatted clearly.',
    ],
    metric1: '< 1 sec',
    metric1Label: 'Page Load Time',
    metric2: 'UPI Ready',
    metric2Label: 'Direct Fee Collection',
    previewNote: 'Leads from website forms route straight into counselors’ daily lists.',
  },
  {
    id: 'automation',
    title: 'WhatsApp Follow-Ups & Reminders',
    tagline: 'Send course brochures, demo reminders, and fee links automatically.',
    highlights: [
      'Instant brochure delivery as soon as a student inquires.',
      'Automated reminders 1 hour before scheduled demo classes.',
      'Direct UPI payment links sent to parents on WhatsApp.',
    ],
    metric1: 'Instant',
    metric1Label: 'WhatsApp Delivery',
    metric2: '98%',
    metric2Label: 'Message Open Rate',
    previewNote: 'Save hours of manual follow-up messages every day.',
  }
];

export default function ProductSuiteGrid() {
  const [selectedPillar, setSelectedPillar] = useState('crm');

  const active = PILLARS.find(p => p.id === selectedPillar) || PILLARS[0];

  return (
    <section 
      id="platform" 
      className="relative w-full bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200 py-16 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full">
        
        {/* Section Header (Zero Badges, Zero Icons) */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            The HEEYAKU System
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            Four Core Tools. One Clean Platform.
          </h2>
          <p className="mt-3 text-base text-slate-600 font-medium">
            Select an area below to see how it helps your institute enroll and teach students.
          </p>
        </div>

        {/* Tab Buttons (Zero Icons, Zero Badges) */}
        <div className="flex justify-start mb-8 overflow-x-auto pb-2">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            {PILLARS.map((p) => {
              const isActive = p.id === selectedPillar;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPillar(p.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white text-[#2563EB] shadow-xs'
                      : 'text-slate-600 hover:text-[#0B1F33]'
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas Display */}
        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white space-y-6">
            <div>
              <div className="text-xs font-mono text-slate-500 font-bold uppercase mb-2">
                Operational Overview
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mb-3">
                {active.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-6">
                {active.tagline}
              </p>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                {active.highlights.map((hl, idx) => (
                  <div key={idx} className="text-xs sm:text-sm text-slate-700 font-medium flex items-start gap-2">
                    <span className="text-[#2563EB] font-bold">•</span>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
              <Link
                href="/book-demo"
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors"
              >
                Schedule Walkthrough →
              </Link>
              <a
                href="tel:+918131838253"
                className="text-xs font-bold text-[#0B1F33] hover:text-[#2563EB] transition-colors"
              >
                Call +91 81318 38253
              </a>
            </div>
          </div>

          {/* Right Column: Operational Metrics */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-[#F8FAFC]">
            <div className="space-y-6">
              <div className="text-xs font-mono text-slate-500 font-bold uppercase">
                Expected Performance
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">{active.metric1Label}</div>
                  <div className="text-2xl font-extrabold text-[#0B1F33] mt-1">{active.metric1}</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">{active.metric2Label}</div>
                  <div className="text-2xl font-extrabold text-[#2563EB] mt-1">{active.metric2}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="text-xs font-bold text-[#0B1F33] mb-1">Key Advantage</div>
                <div className="text-xs text-slate-600 font-medium leading-relaxed">
                  {active.previewNote}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs font-mono text-slate-500">
              No technical setup required by your staff.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
