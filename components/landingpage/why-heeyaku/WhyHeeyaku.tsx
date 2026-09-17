'use client';

import React from 'react';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const COMPARISONS = [
  {
    feature: 'Architecture Philosophy',
    generic: 'Generic SaaS patched with Zapier webhooks & brittle plugins',
    heeyaku: 'Single unified vertical operating system purpose-built for EdTech',
  },
  {
    feature: 'Lead-to-LMS Sync Latency',
    generic: '30 mins to 24 hours (manual CSV exports & Zapier queues)',
    heeyaku: 'Sub-second real-time webhook handoff with 0ms data latency',
  },
  {
    feature: 'Counselor Routing Logic',
    generic: 'Basic round-robin without language, domain, or win-rate weighting',
    heeyaku: 'Multi-variable dynamic routing with SLA escalation alarms',
  },
  {
    feature: 'Course Video DRM & Security',
    generic: 'Unprotected YouTube unlisted / Vimeo embeds easily ripped',
    heeyaku: 'Encrypted DRM playback with dynamic student watermarking',
  },
  {
    feature: 'Custom Business Rules',
    generic: 'Rigid constraints; requires hiring expensive external devs',
    heeyaku: 'Deeply tailored to your batch schedules, tiers & commission structures',
  },
];

export default function WhyHeeyaku() {
  return (
    <section id="comparison" className="relative w-full bg-[#FAFCFF] py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Vibrant Ambient Glow Mesh in Brand Theme */}
      <div className="absolute top-1/3 right-1/4 w-[750px] h-[450px] bg-gradient-to-br from-blue-200/50 via-cyan-100/40 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[600px] h-[400px] bg-gradient-to-tr from-sky-100/40 via-blue-100/30 to-transparent blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            Why Coaching Academies & Bootcamps <br className="hidden sm:inline" />
            <span className="text-[#2563EB]">
              Choose Heeyaku Over Generic Tools
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            Compare the operational reality of stitched-together third-party plugins versus a dedicated, customized EdTech CRM, LMS, and web infrastructure.
          </p>
        </div>

        {/* Outer Vibrant Layered Container */}
        <div className="relative rounded-[28px] bg-gradient-to-b from-blue-400/25 via-slate-200/60 to-cyan-300/25 p-[1.5px] shadow-[0_20px_60px_rgba(37,99,235,0.08)]">
          <div className="rounded-[26px] bg-white/95 backdrop-blur-xl overflow-hidden">
            
            {/* Table Header Strip */}
            <div className="grid grid-cols-1 md:grid-cols-12 p-6 sm:p-8 border-b border-slate-100 bg-[#F8FAFC]/90 text-xs font-mono font-bold tracking-wider uppercase items-center">
              <div className="md:col-span-4 text-slate-700 font-extrabold">
                SYSTEM CAPABILITY
              </div>
              <div className="md:col-span-4 text-slate-700 font-extrabold mt-3 md:mt-0">
                GENERIC SAAS / PLUGIN STACK
              </div>
              <div className="md:col-span-4 mt-3 md:mt-0 flex items-center">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200/90 font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  HEEYAKU INFRASTRUCTURE
                </span>
              </div>
            </div>

            {/* Table Rows with High Vibrant Contrast */}
            <div className="divide-y divide-slate-100/90">
              {COMPARISONS.map((row, idx) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-1 md:grid-cols-12 p-6 sm:p-8 items-center gap-4 md:gap-6 transition-colors duration-150 hover:bg-blue-50/20"
                >
                  {/* System Capability */}
                  <div className="md:col-span-4">
                    <div className="text-base sm:text-lg font-extrabold text-[#0B1F33] tracking-tight">
                      {row.feature}
                    </div>
                  </div>

                  {/* Generic SaaS / Plugin Stack (Clean minimal text) */}
                  <div className="md:col-span-4 pr-0 md:pr-4">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{row.generic}</span>
                    </div>
                  </div>

                  {/* Heeyaku Infrastructure (High contrast clear row) */}
                  <div className="md:col-span-4 pl-0 md:pl-2">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#0B1F33] leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{row.heeyaku}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
