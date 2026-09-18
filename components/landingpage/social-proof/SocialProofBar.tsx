'use client';

import React from 'react';
import Masonry, { MasonryItem } from './Masonry';
import CountUpNumber from '../shared/CountUpNumber';

const EDTECH_SHOWCASE_ITEMS: MasonryItem[] = [
  {
    id: '1',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=480&q=70',
    title: 'Telephony & Counselor Dashboard',
    category: 'Admission CRM',
    height: 310,
    url: '/solutions/crm',
  },
  {
    id: '2',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=480&q=70',
    title: 'Lead Follow-Up Queue',
    category: 'Daily Calling Board',
    height: 230,
    url: '/solutions/crm',
  },
  {
    id: '3',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=480&q=70',
    title: 'Under 60s Lead Handoff',
    category: 'Fast Routing',
    height: 350,
    url: '/solutions/automation',
  },
  {
    id: '4',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=480&q=70',
    title: 'Offline Android Call Logging',
    category: 'Android Calling App',
    height: 260,
    url: '/download',
  },
  {
    id: '5',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=480&q=70',
    title: 'Fast Mobile Admission Pages',
    category: 'Course Websites',
    height: 330,
    url: '/solutions/web',
  },
  {
    id: '6',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=480&q=70',
    title: 'Floating Roll Number Watermark',
    category: 'Anti-Piracy Video',
    height: 240,
    url: '/platform',
  },
  {
    id: '7',
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=480&q=70',
    title: 'Mumbai Server Infrastructure',
    category: 'Fast Local Cloud',
    height: 290,
    url: '/platform',
  },
  {
    id: '8',
    img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=480&q=70',
    title: 'Android App for Telecallers',
    category: 'APK Download',
    height: 260,
    url: '/download',
  },
];

const INDUSTRY_VERTICALS = [
  'IIT-JEE & NEET Coaching',
  'Study Abroad & Visa Advisory',
  'IT & Coding Bootcamps',
  'UPSC & Civil Services Prep',
  'Vocational & Skills Institutes',
  'School & Tuition Chains',
];

const STATS = [
  {
    numValue: 60,
    suffix: 's',
    decimals: 0,
    label: 'First Call Speed',
    desc: 'Average time to reach new leads',
  },
  {
    numValue: 100,
    suffix: '%',
    decimals: 0,
    label: 'Call Duration Logged',
    desc: 'Recorded via Android app',
  },
  {
    numValue: 0,
    suffix: '',
    decimals: 0,
    label: 'Lost Inquiries',
    desc: 'Zero spreadsheet gaps',
  },
  {
    numValue: 100,
    suffix: '%',
    decimals: 0,
    label: 'Watermarked Videos',
    desc: 'Stops lecture screen leaks',
  },
];

export default function SocialProofBar() {
  return (
    <section className="relative w-full bg-white border-y border-slate-100 py-14 lg:py-20 selection:bg-[#2563EB] selection:text-white overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
        
        {/* Simple Header (No Badges, No Icons) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider block mb-1">
              Purpose-Built For Institutes
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#0B1F33]">
              Designed for Coaching Centers, Bootcamps & Academies
            </h3>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Android Calling • Admission CRM • Lecture Portal • WhatsApp Automation
          </div>
        </div>

        {/* 4 Numbers Grid (Zero Icons, Zero Badges) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-200 transition-colors"
            >
              <div className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                {stat.label}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33]">
                <CountUpNumber
                  value={stat.numValue}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  duration={2.0}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Masonry Showcase Section */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider block mb-1">
                Visual Overview
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
                Built for Daily Operations
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md leading-relaxed">
              Every tool works together out of the box so your admission counselors and academic teams stay focused on enrollments.
            </p>
          </div>

          <div className="w-full">
            <Masonry
              items={EDTECH_SHOWCASE_ITEMS}
              ease="power3.out"
              duration={0.6}
              stagger={0.04}
              animateFrom="bottom"
              scaleOnHover={true}
              hoverScale={0.98}
              blurToFocus={false}
              colorShiftOnHover={false}
            />
          </div>
        </div>

        {/* Industry Marquee (Text-Only, No Icons, No Badges) */}
        <div className="pt-8 border-t border-slate-100">
          <div className="text-center mb-6">
            <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Trusted by Leading Institutes & Training Centers
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex gap-10 w-max animate-marquee hover:[animation-play-state:paused]">
              {[...INDUSTRY_VERTICALS, ...INDUSTRY_VERTICALS, ...INDUSTRY_VERTICALS].map((vertical, idx) => (
                <div
                  key={`${vertical}-${idx}`}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-sm tracking-tight whitespace-nowrap"
                >
                  {vertical}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
