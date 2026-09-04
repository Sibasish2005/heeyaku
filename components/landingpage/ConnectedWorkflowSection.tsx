'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Activity, ShieldCheck, Zap, ArrowRight, Terminal, Cpu, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AccordionGallery, { AccordionGalleryItem } from './AccordionGallery';

const JOURNEY_GALLERY_ITEMS: (AccordionGalleryItem & {
  id: string;
  step: string;
  shortTitle: string;
  subtitle: string;
  desc: string;
  features: string[];
  metric: string;
  activeNode: string;
  log: string;
  terminalStats: { speed: string; status: string; accuracy: string };
})[] = [
  {
    id: 'step-1',
    step: '01',
    label: '01. Zero-Loss Lead Capture',
    shortTitle: 'Capture',
    badge: '0.12s SLA',
    description: 'Instant sub-second webhook ingestion across Meta, Google & Portals',
    subtitle: 'Sub-Second Ingestion Engine',
    desc: 'Instant sub-second webhook ingestion from Meta Ads, Google PPC, and landing page forms directly into your centralized deal board with zero lead leakage.',
    features: ['0.12s webhook handoff with 0ms data loss', 'Automated deduplication & fraud filter', 'Full UTM campaign parameter attribution'],
    metric: '0.12s Latency',
    activeNode: 'Node #INBOUND-01',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=75',
    alt: 'Multi-Channel Lead Ingestion Engine',
    log: '✓ [LEAD_INBOUND] Aditi Sharma captured via Meta Ad #891 (0.08s)',
    terminalStats: { speed: '0.08s', status: 'Ingested', accuracy: '100% Valid' },
  },
  {
    id: 'step-2',
    step: '02',
    label: '02. Dynamic Counselor Routing',
    shortTitle: 'Route',
    badge: '< 2min SLA',
    description: 'Auto-allocation by language, domain preference and counselor win-rate',
    subtitle: 'Dynamic Win-Rate & Language Routing',
    desc: 'Automated round-robin, language-preference, or win-rate counselor assignment with strict response SLA timers and automatic manager escalation alarms.',
    features: ['Language & domain matching', 'Live counselor availability tracker', 'VoIP auto-dial integration with call recording'],
    metric: '< 2 min SLA',
    activeNode: 'Node #ROUTER-02',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=640&q=75',
    alt: 'Intelligent Counselor Allocation Desk',
    log: '✓ [ROUTING] Assigned to Sarah K. (Language: Hindi/English, Win-rate: 44%)',
    terminalStats: { speed: '1.2m', status: 'Assigned', accuracy: 'SLA Active' },
  },
  {
    id: 'step-3',
    step: '03',
    label: '03. Multi-Channel WhatsApp Drips',
    shortTitle: 'Convert',
    badge: '+38% Close Rate',
    description: 'Personalized WhatsApp nurture sequences, demo reminders & UPI payment links',
    subtitle: 'WhatsApp Cloud API & Payment Drops',
    desc: 'Trigger personalized WhatsApp nurture sequences, demo reminders, and early-bird scholarship links the instant a counselor updates lead stage.',
    features: ['Official WhatsApp Business Cloud API', '1-click Razorpay/Stripe checkout drop', 'Calendar appointment auto-sync & reminders'],
    metric: '+38% Close Rate',
    activeNode: 'Node #DRIP-03',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=640&q=75',
    alt: 'Autonomous WhatsApp Follow-Ups',
    log: '✓ [WHATSAPP_DRIP] Personalized demo syllabus PDF + meeting link dispatched',
    terminalStats: { speed: '0.15s', status: 'Dispatched', accuracy: '+38% Uplift' },
  },
  {
    id: 'step-4',
    step: '04',
    label: '04. Encrypted DRM LMS Delivery',
    shortTitle: 'Deliver',
    badge: 'Instant Unlock',
    description: 'Zero-touch batch onboarding, dynamic watermarking & 1080p DRM playback',
    subtitle: 'Instant DRM Encryption & Syllabus Unlock',
    desc: 'Fee settlement triggers instant DRM credentials, course access unlock, cohort Discord/Telegram role assignment, and live lecture calendar invites.',
    features: ['Dynamic student DRM video watermarking', 'Encrypted 1080p 60fps adaptive streaming', 'Automated cohort batch scheduling'],
    metric: 'Instant Unlock',
    activeNode: 'Node #LMS-04',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=75',
    alt: 'Zero-Touch LMS & Batch Onboarding',
    log: '✓ [PAYMENT_SETTLED] LMS credentials generated. Batch #28 access unlocked.',
    terminalStats: { speed: '0.42s', status: 'Enrolled', accuracy: 'DRM Active' },
  },
  {
    id: 'step-5',
    step: '05',
    label: '05. Cohort Retention & Telemetry',
    shortTitle: 'Grow',
    badge: '92% Completion',
    description: 'Continuous dropout alarms, quiz completion triggers & alumni referrals',
    subtitle: 'Continuous Telemetry & Dropout Alarms',
    desc: 'Continuous tracking of student progress, quiz submissions, and drop-off alerts. Automatically triggers mentorship calls and certificate generation.',
    features: ['Predictive student drop-out alerts', 'Automated graduation certificate issuance', 'Alumni renewal & referral upsell campaigns'],
    metric: '92% Completion',
    activeNode: 'Node #GROWTH-05',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=640&q=75',
    alt: 'Cohort Retention & Alumni Telemetry',
    log: '✓ [TELEMETRY] Module 4 progress: 88%. Certificate generated on completion.',
    terminalStats: { speed: 'Realtime', status: 'Monitoring', accuracy: '92% SLA' },
  },
];

export default function ConnectedWorkflowSection() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2);

  const activeStep = JOURNEY_GALLERY_ITEMS[activeStepIndex];

  return (
    <section 
      id="workflow"
      className="relative w-full bg-[#FAFCFF] py-20 lg:py-28 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200/80 overflow-hidden"
    >
      {/* Ambient Light Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-100/40 via-cyan-100/30 to-indigo-100/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
        
        {/* Header */}
        <div className="text-left max-w-3xl mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            How Heeyaku Connects the <br className="hidden sm:inline" />
            <span className="text-[#2563EB]">
              Entire Student Journey
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            From first ad impression to alumni referrals — every touchpoint synchronized in real time.
          </p>

          {/* Interactive Stepper Navigation Bar */}
          <div className="flex items-center justify-start gap-2 mt-6 sm:mt-8 overflow-x-auto pb-1">
            {JOURNEY_GALLERY_ITEMS.map((s, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/25'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#0B1F33]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-md text-[10px] flex items-center justify-center font-bold ${
                    isSelected ? 'bg-white text-[#2563EB]' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {s.step}
                  </span>
                  <span>{s.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Accordion Gallery with Real Internet Image Assets */}
        <div className="mb-10">
          <AccordionGallery
            items={JOURNEY_GALLERY_ITEMS}
            defaultIndex={activeStepIndex}
            expandRatio={0.46}
            height={440}
            radius={24}
            gap={12}
            trigger="hover"
            accentColor="#38BDF8"
            overlayColor="#0B1F33"
            showLabels={true}
            grayscale={false}
            onActiveChange={(idx) => setActiveStepIndex(idx)}
          />
        </div>

        {/* Synchronized Spec & Telemetry Panel (Cardless Continuous Layout) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          
          {/* Left Pane: Spec & Narrative */}
          <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Stage Pill Header */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 font-mono font-extrabold text-xs flex items-center justify-center">
                      {activeStep.step}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                      {activeStep.subtitle}
                    </span>
                  </div>

                  <Badge variant="cyan">{activeStep.metric}</Badge>
                </div>

                {/* Display Title */}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
                  {activeStep.label}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  {activeStep.desc}
                </p>

                {/* Bullet Highlights */}
                <div className="space-y-2.5 pt-2">
                  {activeStep.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Controls Indicator */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span className="text-slate-600 font-bold">Phase 0{activeStepIndex + 1} of 05 • {activeStep.shortTitle}</span>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive React Bits Visual Canvas</span>
              </div>
            </div>
          </div>

          {/* Right Pane: Dark Telemetry Live Kernel */}
          <div className="lg:col-span-5 p-7 sm:p-9 bg-[#0B1F33] text-white flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-5">
              {/* Console Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-xs font-mono font-bold text-white uppercase">PIPELINE TELEMETRY</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  ● 0ms Latency
                </span>
              </div>

              {/* Active Node Badge & Visual Step Preview */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={activeStep.image} 
                    alt={activeStep.label} 
                    width="28"
                    height="28"
                    loading="lazy"
                    decoding="async"
                    className="w-7 h-7 rounded-lg object-cover border border-cyan-400/40 shrink-0" 
                  />
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="text-slate-300">Active Node:</span>
                  </div>
                </div>
                <span className="font-bold text-cyan-300">{activeStep.activeNode}</span>
              </div>

              {/* Dynamic Terminal Event Log Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-3"
                >
                  <div className="text-[10px] text-slate-300 uppercase font-bold"># DISPATCH STREAM EVENT</div>
                  
                  <div className="text-cyan-300 font-semibold leading-relaxed">
                    {activeStep.log}
                  </div>

                  {/* Micro Metric Telemetry */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <span className="text-slate-400 block">SLA Speed:</span>
                      <span className="font-bold text-white">{activeStep.terminalStats.speed}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <span className="text-slate-400 block">Status:</span>
                      <span className="font-bold text-emerald-400">{activeStep.terminalStats.status}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <span className="text-slate-400 block">Precision:</span>
                      <span className="font-bold text-[#38BDF8]">{activeStep.terminalStats.accuracy}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Footer Strip */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SSL / TLS 1.3 Verified</span>
              <span className="text-emerald-400 font-bold">99.98% Uptime</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
