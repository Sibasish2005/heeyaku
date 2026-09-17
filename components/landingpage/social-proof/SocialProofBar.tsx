'use client';

import React from 'react';
import { TrendingUp, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import Masonry, { MasonryItem } from './Masonry';
import CountUpNumber from '../shared/CountUpNumber';

// Curated copyright-free high-resolution Unsplash images representing modern EdTech, LMS, CRM, and digital learning
const EDTECH_SHOWCASE_ITEMS: MasonryItem[] = [
  {
    id: '1',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=480&q=70',
    title: 'Advanced LMS Real-Time Analytics',
    category: 'LMS Telemetry',
    height: 310,
    url: '#solutions',
  },
  {
    id: '2',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=480&q=70',
    title: 'Collaborative Cohort Workspaces',
    category: 'Student Experience',
    height: 230,
    url: '#solutions',
  },
  {
    id: '3',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=480&q=70',
    title: 'Custom EdTech CRM & Lead Pipeline',
    category: 'Conversion CRM',
    height: 350,
    url: '#solutions',
  },
  {
    id: '4',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=480&q=70',
    title: 'Automated Retention & Trigger Engine',
    category: 'Automation',
    height: 260,
    url: '#solutions',
  },
  {
    id: '5',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=480&q=70',
    title: 'High-Converting Multi-Course Portal',
    category: 'Web Platform',
    height: 330,
    url: '#solutions',
  },
  {
    id: '6',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=480&q=70',
    title: 'Interactive Virtual Assessments',
    category: 'Evaluation Engine',
    height: 240,
    url: '#solutions',
  },
  {
    id: '7',
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=480&q=70',
    title: 'Enterprise Serverless Infrastructure',
    category: 'Cloud Reliability',
    height: 290,
    url: '#solutions',
  },
  {
    id: '8',
    img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=480&q=70',
    title: 'Global Live Lecture Distribution',
    category: 'Streaming Engine',
    height: 260,
    url: '#solutions',
  },
];

// Trusted Brand Client Logos
const CLIENT_LOGOS = [
  {
    name: 'Apex Academy',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 9l4 7H8l4-7z" />
      </svg>
    ),
  },
  {
    name: 'SkillSphere',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    name: 'NextGen Ed',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: 'Elevate LMS',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    name: 'QuantLearn',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="9" />
        <line x1="3.6" y1="9" x2="20.4" y2="9" />
        <line x1="3.6" y1="15" x2="20.4" y2="15" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    name: 'Pulse Institute',
    symbol: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const STATS = [
  {
    numValue: 50,
    suffix: 'k+',
    decimals: 0,
    label: 'Leads Handled',
    icon: <TrendingUp className="w-4 h-4 text-[#2563EB]" />,
  },
  {
    numValue: 99.9,
    suffix: '%',
    decimals: 1,
    label: 'System Uptime',
    icon: <ShieldCheck className="w-4 h-4 text-[#2563EB]" />,
  },
  {
    numValue: 3.8,
    suffix: 'x',
    decimals: 1,
    label: 'Conversion Uplift',
    icon: <Zap className="w-4 h-4 text-[#2563EB]" />,
  },
  {
    numValue: 100,
    suffix: '+',
    decimals: 0,
    label: 'EdTech Deployments',
    icon: <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />,
  },
];

const CAPABILITIES = [
  'Custom CRM',
  'LMS Architectures',
  'High-Converting Web',
  'End-to-End Automation',
];

export default function SocialProofBar() {
  return (
    <section className="relative w-full bg-white border-y border-slate-100/90 py-14 lg:py-20 selection:bg-[#2563EB] selection:text-white overflow-hidden">
      {/* Background Subtle Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
        {/* Top Header: Industry Focus Badge & Capability Tags */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-10 border-b border-slate-100">
          {/* Industry Focus Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/80 text-[#0B1F33] shadow-xs w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#0B1F33]">
              Custom-Built for Growing <span className="text-[#2563EB] font-bold">E-Learning & EdTech</span> Businesses
            </span>
          </div>

          {/* Platform Capability Tags */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-700">
            {CAPABILITIES.map((cap, idx) => (
              <React.Fragment key={cap}>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100/70 hover:bg-blue-50/70 hover:text-[#2563EB] transition-colors border border-slate-200/50 cursor-default">
                  {cap}
                </span>
                {idx < CAPABILITIES.length - 1 && (
                  <span className="text-slate-400 hidden sm:inline">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Middle Section: Quick Stats Grid with Animated Count-Up Stopwatch Effect */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="group relative p-5 sm:p-6 rounded-2xl bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(37,99,235,0.08)] hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5 cursor-default"
            >
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F33] tracking-tight group-hover:text-[#2563EB] transition-colors">
                <CountUpNumber
                  value={stat.numValue}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  duration={2.2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Masonry Showcase Section */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB] block mb-2">
                Proven Architecture in Action
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F33] tracking-tight">
                Designed for Scale, Built for Learning
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md leading-relaxed">
              Explore how our end-to-end custom systems power high-performing EdTech institutions and online learning platforms worldwide.
            </p>
          </div>

          {/* React Bits Masonry Gallery */}
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

        {/* Bottom Section: Trusted Client Logos Infinite Marquee */}
        <div className="pt-8 border-t border-slate-100">
          <div className="text-center mb-6">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
              Trusted by Innovative Learning Institutions
            </span>
          </div>

          {/* Marquee Wrapper with side fade masks */}
          <div className="relative w-full overflow-hidden">
            {/* Left & Right Gradient Shadows for seamless edge fade */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Seamless Infinite Marquee Track */}
            <div className="flex gap-10 sm:gap-14 w-max animate-marquee hover:[animation-play-state:paused]">
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS, ...CLIENT_LOGOS].map((client, idx) => (
                <div
                  key={`${client.name}-${idx}`}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-[#2563EB] transition-colors group cursor-pointer select-none opacity-75 hover:opacity-100"
                >
                  <div className="text-slate-400 group-hover:text-[#2563EB] transition-colors">
                    {client.symbol}
                  </div>
                  <span className="font-bold text-sm sm:text-base tracking-tight whitespace-nowrap">
                    {client.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
