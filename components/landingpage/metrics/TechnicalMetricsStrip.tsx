'use client';

import React from 'react';
import CountUpNumber from '../shared/CountUpNumber';

interface MetricItem {
  numValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  microBadge: {
    dotColor?: string;
    text: string;
    bgClass?: string;
  };
  detail: string;
}

const METRICS_DATA: MetricItem[] = [
  {
    numValue: 5,
    prefix: '< ',
    suffix: ' min',
    label: 'FIRST TOUCH RESPONSE',
    microBadge: {
      dotColor: 'bg-emerald-500',
      text: 'SLA Active',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    detail: 'Auto-routed to active counselors instantly',
  },
  {
    numValue: 0,
    prefix: '',
    suffix: '',
    label: 'UNTRACKED LEADS',
    microBadge: {
      dotColor: 'bg-blue-500',
      text: 'Zero Leakage',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    detail: 'Omnichannel ingestion across ads & landing pages',
  },
  {
    numValue: 100,
    prefix: '',
    suffix: '%',
    label: 'WHATSAPP & CALL SYNC',
    microBadge: {
      dotColor: 'bg-emerald-500',
      text: 'Bi-directional',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    detail: 'Instant audio recording & chat thread logging',
  },
  {
    numValue: 1,
    prefix: '',
    suffix: ' View',
    label: 'COMPLETE FUNNEL CLARITY',
    microBadge: {
      dotColor: 'bg-indigo-500',
      text: 'Unified Graph',
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    detail: 'From ad click to fee settlement in one canvas',
  },
];

export default function TechnicalMetricsStrip() {
  return (
    <section className="relative w-full bg-[#F8FAFC] py-20 lg:py-28 overflow-hidden text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200/80">
      {/* Subtle Technical Grid & Ambient Lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[220px] bg-gradient-to-b from-blue-100/60 via-cyan-50/40 to-transparent blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Top Element: Centered Pill Badge */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white backdrop-blur-md border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 ease-out hover:border-blue-300 active:scale-[0.98]">
            {/* Glowing Blue Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB] shadow-[0_0_6px_#2563EB]" />
            </span>
            <span className="text-xs sm:text-[13px] font-medium tracking-tight text-slate-700">
              Vertical Infrastructure: <span className="text-[#0B1F33] font-semibold">Built exclusively for EdTech teams</span>
            </span>
          </div>
        </div>

        {/* Main Element: Technical 4-Column Metrics Strip in White Mode with CountUp Stopwatch Effect */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm overflow-hidden divide-y divide-slate-100 md:divide-y-0 md:divide-x md:divide-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
          {METRICS_DATA.map((item) => (
            <div
              key={item.label}
              className="group relative p-7 sm:p-8 lg:p-9 flex flex-col justify-between transition-colors duration-200 ease-out hover:bg-slate-50/80 active:bg-slate-100/50 cursor-default"
            >
              {/* Top Micro-UI Technical Status Tag */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase font-mono">
                  {item.label}
                </span>
                
                {/* Technical Micro-UI Pill */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border font-mono ${item.microBadge.bgClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.microBadge.dotColor}`} />
                  <span>{item.microBadge.text}</span>
                </div>
              </div>

              {/* Metric Number Animated with CountUp Stopwatch */}
              <div className="my-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-[#0B1F33] group-hover:text-[#2563EB] transition-colors duration-150">
                  <CountUpNumber
                    value={item.numValue}
                    prefix={item.prefix}
                    suffix={item.suffix}
                    decimals={item.decimals || 0}
                    duration={2.0}
                  />
                </span>
              </div>

              {/* Subtitle / Operational Detail */}
              <p className="text-xs text-slate-600 mt-4 leading-relaxed line-clamp-2 font-medium">
                {item.detail}
              </p>

              {/* Subtle Bottom Accent Glow Line on Hover */}
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
