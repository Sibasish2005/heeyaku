'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, GraduationCap, Globe, Cpu, 
  ArrowRight, CheckCircle2, Shield, Zap, Sparkles, Terminal, Play, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PILLARS = [
  {
    id: 'crm',
    title: 'Customer CRM',
    tagline: 'Intelligent lead capture, auto-assignment & SLA timers',
    badge: 'Core Engine',
    badgeVariant: 'brand' as const,
    icon: Users,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=720&q=75',
    imageAlt: 'Heeyaku Lead Conversion CRM Dashboard',
    highlights: [
      'Sub-second webhook ingestion from Meta, Google & Portals',
      'Round-robin counselor routing with dynamic win-rate weighting',
      'Instant VoIP call sync with bi-directional WhatsApp thread audit',
    ],
    preview: {
      type: 'crm',
      metric1: '1.4 min',
      metric1Label: 'Average First Touch SLA',
      metric2: '0',
      metric2Label: 'Untracked Inbound Leads',
      status: '● Automated Ingestion Active',
      events: [
        '✓ [OK] Webhook payload decrypted in 0.04ms',
        '✓ [OK] Sub-second counselor round-robin executed',
        '→ [STREAM] Bi-directional sync verified across CRM & LMS',
      ]
    }
  },
  {
    id: 'lms',
    title: 'Learning Platform (LMS)',
    tagline: 'DRM-protected video, student cohorts & progress tracking',
    badge: 'Security Tier',
    badgeVariant: 'cyan' as const,
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=720&q=75',
    imageAlt: 'Heeyaku DRM Protected Video LMS Player',
    highlights: [
      'Encrypted DRM streaming with dynamic on-screen student watermarking',
      'Automated batch scheduling, syllabus locks & attendance webhooks',
      'Integrated quiz engine & completion certificate generation',
    ],
    preview: {
      type: 'lms',
      metric1: '1080p 60fps',
      metric1Label: 'Encrypted Stream Bitrate',
      metric2: '99.4%',
      metric2Label: 'Completion Compliance',
      status: '● DRM Watermark Active',
      events: [
        '✓ [OK] Widevine & FairPlay DRM pipeline encrypted',
        '✓ [OK] Dynamic student roll-number overlay rendered on frame',
        '→ [STREAM] Progress telemetry batch synced to student dashboard',
      ]
    }
  },
  {
    id: 'web',
    title: 'Websites & Portals',
    tagline: 'High-converting sales funnels & secure learner portals',
    badge: 'Speed 100/100',
    badgeVariant: 'success' as const,
    icon: Globe,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=720&q=75',
    imageAlt: 'Heeyaku High-Speed Course Funnel Web Architecture',
    highlights: [
      'Edge-rendered sub-second loading landing pages with 99+ Lighthouse',
      'Native fee checkout with split EMI and instant receipt generation',
      'Custom subdomain isolation for enterprise academies and bootcamps',
    ],
    preview: {
      type: 'web',
      metric1: '0.24s',
      metric1Label: 'Time to First Byte (Edge)',
      metric2: '100%',
      metric2Label: 'Lighthouse Performance',
      status: '● Edge Multi-Region Deployed',
      events: [
        '✓ [OK] Edge serverless response served in 0.24s',
        '✓ [OK] Instant Razorpay/UPI checkout modal initialized',
        '→ [STREAM] Conversion pixel and UTM params passed to CRM',
      ]
    }
  },
  {
    id: 'automation',
    title: 'AI & Automations',
    tagline: 'WhatsApp drip bots, email sequences & calendar sync',
    badge: 'Autonomous',
    badgeVariant: 'default' as const,
    icon: Cpu,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=75',
    imageAlt: 'Heeyaku Multi-Channel Drip Bot Workflow Builder',
    highlights: [
      'Multi-channel WhatsApp drip sequences tailored to student drop-offs',
      'Trigger-based fee reminder bots with UPI deep-linking',
      'Automated calendar scheduling with counselor availability sync',
    ],
    preview: {
      type: 'automation',
      metric1: '12,480',
      metric1Label: 'Automated Drips / Week',
      metric2: '+42%',
      metric2Label: 'Demo Show-Up Rate',
      status: '● Autonomous Dispatcher Live',
      events: [
        '✓ [OK] WhatsApp Cloud API message template verified',
        '✓ [OK] Demo reminder dispatched with 1-click calendar sync',
        '→ [STREAM] Student response parsed by MetaBrain intent parser',
      ]
    }
  }
];

export default function ProductSuiteGrid() {
  const [selectedPillar, setSelectedPillar] = useState('crm');
  const [tested, setTested] = useState(false);

  const handleTabClick = (id: string) => {
    setSelectedPillar(id);
    setTested(false);
  };

  const activeIndex = PILLARS.findIndex(p => p.id === selectedPillar);
  const active = PILLARS[activeIndex >= 0 ? activeIndex : 0];
  const IconComponent = active.icon;

  return (
    <section 
      id="platform" 
      className="relative w-full bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80 flex flex-col justify-center py-16 lg:py-24"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-8 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            Four Core Engines. <br />
            <span className="text-[#2563EB]">
              One Synchronized Ecosystem.
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium">
            Select any operational module below to inspect live specifications and telemetry.
          </p>
        </div>

        {/* Interactive Tabs Bar */}
        <div className="flex justify-start mb-10">
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto max-w-full">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              const isActive = p.id === selectedPillar;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleTabClick(p.id)}
                  onMouseEnter={() => handleTabClick(p.id)}
                  onFocus={() => handleTabClick(p.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-[#2563EB] shadow-sm scale-100'
                      : 'text-slate-600 hover:text-[#0B1F33] hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Platform Canvas */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/60 backdrop-blur-md overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
            
            {/* Left Column: Feature Specifications */}
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between space-y-8 bg-white/70">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB]">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <Badge variant={active.badgeVariant}>{active.badge}</Badge>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight mt-1">
                        {active.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-base text-slate-600 font-medium leading-relaxed">
                    {active.tagline}
                  </p>

                  <Separator className="my-4" />

                  {/* Bullet Highlights */}
                  <div className="space-y-3.5">
                    {active.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

                <div className="pt-6 flex flex-wrap items-center gap-4">
                  <Button 
                    variant="brand" 
                    onClick={() => setTested(true)}
                    className="gap-2 cursor-pointer"
                  >
                    {tested ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    <span>{tested ? 'Telemetry Synchronized' : 'Test Real-Time Flow'}</span>
                  </Button>
                  
                  <Link href="/book-demo">
                    <Button variant="outline" className="gap-2 cursor-pointer">
                      <span>Schedule Architecture Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Real SaaS UI Dashboard Image Asset from Internet + Floating Telemetry */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-slate-900 text-white relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 blur-3xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  {/* Browser/Window Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-slate-400 font-bold ml-2">heeyaku.com/{active.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">{active.preview.status}</span>
                    </div>
                  </div>

                  {/* Real Internet Image Asset Canvas */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group min-h-[300px] sm:min-h-[360px] bg-slate-950 flex flex-col justify-between"
                    >
                      {/* High-Resolution Real Dashboard Image from the Internet */}
                      <img 
                        src={active.image} 
                        alt={active.imageAlt}
                        width="720"
                        height="405"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 brightness-90"
                      />

                      {/* Gradient Backdrop Mask for Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/50 pointer-events-none" />

                      {/* Floating Glassmorphic Metric Cards on top of real image */}
                      <div className="relative z-10 p-4 sm:p-5 flex flex-wrap gap-2.5 sm:gap-3">
                        <div className="px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-lg">
                          <div className="text-[10px] font-mono text-slate-300 uppercase font-bold">{active.preview.metric1Label}</div>
                          <div className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">{active.preview.metric1}</div>
                        </div>

                        <div className="px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-lg">
                          <div className="text-[10px] font-mono text-slate-300 uppercase font-bold">{active.preview.metric2Label}</div>
                          <div className="text-lg sm:text-xl font-extrabold font-mono text-cyan-300 mt-0.5">{active.preview.metric2}</div>
                        </div>
                      </div>

                      {/* Bottom Live Stream Telemetry Pill overlay on Image */}
                      <div className="relative z-10 p-4 sm:p-5 space-y-2">
                        <div className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 space-y-1.5 shadow-xl">
                          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold">
                            <span>&gt;_ LIVE TELEMETRY STREAM</span>
                            <span className="text-slate-400">0.04ms</span>
                          </div>
                          <div className="text-xs font-mono text-emerald-400 font-semibold truncate">
                            {active.preview.events[0]}
                          </div>
                          <div className="text-xs font-mono text-slate-300 truncate hidden sm:block">
                            {active.preview.events[1]}
                          </div>
                          {tested && (
                            <motion.div 
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs font-mono text-[#38BDF8] font-bold pt-1 border-t border-slate-700/80"
                            >
                              ⚡ Live simulation stream verified (0ms Latency).
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 relative z-10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Real-Time Sync: 0ms Latency</span>
                  </span>
                  <span>SSL / TLS 1.3 Verified</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
    );
  }
