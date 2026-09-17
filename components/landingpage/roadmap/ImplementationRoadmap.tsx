'use client';

import React from 'react';
import { CheckCircle2, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ROADMAP_STEPS = [
  {
    phase: '01',
    name: 'Pipeline & Webhook Ingestion',
    tag: 'STOP LEAKAGE',
    desc: 'Audit all active lead sources, integrate WhatsApp Business API & Meta webhooks, and configure sub-second counselor routing with strict SLA alarms.',
    duration: 'Week 1',
    badgeVariant: 'destructive' as const,
    milestone: '0% Lead Leakage Achieved',
  },
  {
    phase: '02',
    name: 'Autonomous Follow-Up Sequences',
    tag: 'SCALE VELOCITY',
    desc: 'Deploy instant WhatsApp re-engagement drip bots, Google Calendar appointment sync, and automated early-bird fee link dispatchers.',
    duration: 'Week 2',
    badgeVariant: 'cyan' as const,
    milestone: '< 2min Response Time',
  },
  {
    phase: '03',
    name: 'LMS Provisioning & DRM Video',
    tag: 'ZERO TOUCH',
    desc: 'Configure automated cohort batch workflows, encrypted 1080p DRM video player encoding, and instant post-payment student credential unlock.',
    duration: 'Week 3',
    badgeVariant: 'brand' as const,
    milestone: 'Zero-Touch Enrollment',
  },
  {
    phase: '04',
    name: 'Funnels & Lifetime Telemetry',
    tag: 'CLOSE THE LOOP',
    desc: 'Launch edge-rendered sub-second checkout pages, dynamic cohort discount engines, and real-time student completion analytics.',
    duration: 'Week 4',
    badgeVariant: 'success' as const,
    milestone: '99.9% Uptime SLA Active',
  },
];

export default function ImplementationRoadmap() {
  return (
    <section id="roadmap" className="relative w-full bg-white py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            Start with One Bottleneck. <br className="hidden sm:inline" />
            <span className="text-[#2563EB]">
              Scale the System in 4 Weeks.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            A clear 4-phase timeline designed to deliver measurable ROI in your first 14 days without disrupting live cohorts.
          </p>
        </div>

        {/* Continuous Linear Milestone Progression (Cardless Connected Timeline) */}
        <div className="relative">
          {/* Subtle Horizontal Connecting Progress Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-8 right-8 h-0.5 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-emerald-400 opacity-30 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {ROADMAP_STEPS.map((step, idx) => (
              <div key={step.phase} className="flex flex-col justify-between space-y-6 group">
                <div>
                  {/* Top Step Number & Milestone Marker */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl font-extrabold font-mono text-[#0B1F33] group-hover:border-[#2563EB] group-hover:text-[#2563EB] transition-colors">
                      {step.phase}
                    </div>
                    <Badge variant={step.badgeVariant}>{step.duration}</Badge>
                  </div>

                  <div className="text-[10px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1.5">
                    {step.tag}
                  </div>

                  <h3 className="text-lg font-bold text-[#0B1F33] leading-snug mb-2">
                    {step.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-600 font-bold">{step.milestone}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
