'use client';

import React from 'react';
import CountUpNumber from '../shared/CountUpNumber';

interface MetricItem {
  numValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  detail: string;
}

const METRICS_DATA: MetricItem[] = [
  {
    numValue: 2,
    prefix: '< ',
    suffix: ' min',
    label: 'FIRST CALL RESPONSE',
    detail: 'New inquiries from ads sent directly to active counselors.',
  },
  {
    numValue: 100,
    prefix: '',
    suffix: '%',
    label: 'AUTOMATIC CALL LOGS',
    detail: 'Talk time and notes tracked directly from Android phones.',
  },
  {
    numValue: 0,
    prefix: '',
    suffix: '',
    label: 'LOST LEADS',
    detail: 'All student inquiries organized on one central board.',
  },
  {
    numValue: 1,
    prefix: '',
    suffix: ' Screen',
    label: 'FULL VISIBILITY',
    detail: 'From initial ad inquiry to paid enrollment in one view.',
  },
];

export default function TechnicalMetricsStrip() {
  return (
    <section className="relative w-full bg-[#F8FAFC] py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Simple Section Header (Zero Badges, Zero Icons) */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            Measurable Results
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F33]">
            What Changes When You Switch to HEEYAKU
          </h2>
        </div>

        {/* 4-Column Clean Metric Grid (Zero Micro-Badges, Zero Icons) */}
        <div className="rounded-2xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 shadow-sm">
          {METRICS_DATA.map((item) => (
            <div
              key={item.label}
              className="p-7 sm:p-8 flex flex-col justify-between"
            >
              <div className="text-xs font-mono font-bold uppercase text-slate-500 mb-4">
                {item.label}
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold text-[#0B1F33] my-2">
                <CountUpNumber
                  value={item.numValue}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  decimals={item.decimals || 0}
                  duration={2.0}
                />
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-4">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
