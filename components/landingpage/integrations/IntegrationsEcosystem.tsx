'use client';

import React from 'react';
import { MessageSquare, CreditCard, Hash, FileSpreadsheet, Layers, Send, Link2, Sparkles, ArrowUpRight } from 'lucide-react';
import HeeyakuLogo from '../shared/HeeyakuLogo';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const INTEGRATIONS = [
  {
    name: 'WhatsApp Business API',
    category: 'Sales & Drip Bots',
    icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
    iconBg: 'bg-emerald-100/90 border-emerald-200 group-hover:bg-emerald-200 group-hover:border-emerald-300',
    cardBg: 'bg-emerald-50/70 hover:bg-emerald-50/90 border-emerald-200/80',
    accentColor: 'text-emerald-700',
    borderColor: 'hover:border-emerald-400 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)]',
    glowColor: 'from-emerald-400/20 via-emerald-400/10 to-transparent',
    desc: 'Live bi-directional chat threads, automated recovery templates, and recorded VoIP telemetry.',
    latency: '12ms Sync',
    badgeVariant: 'success' as const,
    bgImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-2 lg:col-span-8',
    highlightTag: 'FEATURED DIRECT CHANNEL',
  },
  {
    name: 'Stripe & Razorpay',
    category: 'Payment Gateways',
    icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
    iconBg: 'bg-indigo-100/90 border-indigo-200 group-hover:bg-indigo-200 group-hover:border-indigo-300',
    cardBg: 'bg-indigo-50/70 hover:bg-indigo-50/90 border-indigo-200/80',
    accentColor: 'text-indigo-700',
    borderColor: 'hover:border-indigo-400 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]',
    glowColor: 'from-indigo-400/20 via-indigo-400/10 to-transparent',
    desc: 'Sub-second webhooks, multi-currency EMI schemes, and automated receipt disbursement.',
    latency: 'Instant Webhook',
    badgeVariant: 'brand' as const,
    bgImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-1 lg:col-span-4',
    highlightTag: 'SUB-SECOND SETTLEMENT',
  },
  {
    name: 'Discord & Slack',
    category: 'Cohort Community',
    icon: <Hash className="w-5 h-5 text-fuchsia-600" />,
    iconBg: 'bg-fuchsia-100/90 border-fuchsia-200 group-hover:bg-fuchsia-200 group-hover:border-fuchsia-300',
    cardBg: 'bg-fuchsia-50/70 hover:bg-fuchsia-50/90 border-fuchsia-200/80',
    accentColor: 'text-fuchsia-700',
    borderColor: 'hover:border-fuchsia-400 hover:shadow-[0_20px_50px_rgba(217,70,239,0.15)]',
    glowColor: 'from-fuchsia-400/20 via-fuchsia-400/10 to-transparent',
    desc: 'Automated student role assignments, private cohort channels, and alert escalations.',
    latency: 'Auto-Provisioned',
    badgeVariant: 'cyan' as const,
    bgImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-1 lg:col-span-4',
    highlightTag: 'STUDENT ROLES',
  },
  {
    name: 'Google Workspace',
    category: 'Calendar & Drive',
    icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />,
    iconBg: 'bg-amber-100/90 border-amber-200 group-hover:bg-amber-200 group-hover:border-amber-300',
    cardBg: 'bg-amber-50/70 hover:bg-amber-50/90 border-amber-200/80',
    accentColor: 'text-amber-700',
    borderColor: 'hover:border-amber-400 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]',
    glowColor: 'from-amber-400/20 via-amber-400/10 to-transparent',
    desc: '1-click mentor interview slotting, student submission drive folders, and email relays.',
    latency: 'Real-Time Sync',
    badgeVariant: 'outline' as const,
    bgImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-1 lg:col-span-4',
    highlightTag: 'CALENDAR MESH',
  },
  {
    name: 'Zapier & Webhooks',
    category: 'Custom Endpoints',
    icon: <Layers className="w-5 h-5 text-cyan-600" />,
    iconBg: 'bg-cyan-100/90 border-cyan-200 group-hover:bg-cyan-200 group-hover:border-cyan-300',
    cardBg: 'bg-cyan-50/70 hover:bg-cyan-50/90 border-cyan-200/80',
    accentColor: 'text-cyan-700',
    borderColor: 'hover:border-cyan-400 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)]',
    glowColor: 'from-cyan-400/20 via-cyan-400/10 to-transparent',
    desc: 'Connect with over 5,000+ third-party tools, data lakes, and custom microservices.',
    latency: '5,000+ Apps',
    badgeVariant: 'brand' as const,
    bgImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-2 lg:col-span-4',
    highlightTag: 'UNIVERSAL ADAPTER',
  },
  {
    name: 'Linear & Jira',
    category: 'Curriculum Ops',
    icon: <Send className="w-5 h-5 text-blue-600" />,
    iconBg: 'bg-blue-100/90 border-blue-200 group-hover:bg-blue-200 group-hover:border-blue-300',
    cardBg: 'bg-blue-50/70 hover:bg-blue-50/90 border-blue-200/80',
    accentColor: 'text-blue-700',
    borderColor: 'hover:border-blue-400 hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)]',
    glowColor: 'from-blue-400/20 via-blue-400/10 to-transparent',
    desc: 'Automated curriculum bug tracking, student project grading tickets, and mentor review queues.',
    latency: 'Bi-Directional',
    badgeVariant: 'default' as const,
    bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=65',
    bentoClass: 'md:col-span-3 lg:col-span-12',
    highlightTag: 'CONTINUOUS CURRICULUM SYNC',
  },
];

export default function IntegrationsEcosystem() {
  return (
    <section id="integrations" className="relative w-full bg-white py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-100/50 via-cyan-100/40 to-indigo-100/40 blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            Connect Your Entire Stack to <br className="hidden sm:inline" />
            <span className="text-[#2563EB]">
              One Central Nervous System
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Zero painful migrations. Plug your existing payment processors, communication apps, and ad channels directly into Heeyaku.
          </p>
        </div>

        {/* Core Universal Adapter Pill */}
        <div className="flex justify-start mb-12">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-200 shadow-[0_4px_24px_rgba(37,99,235,0.08)]">
            <HeeyakuLogo size={28} color="#0B1F33" dotColor="#2563EB" />
            <div className="text-left">
              <div className="text-xs font-bold text-[#0B1F33] tracking-wider">HEEYAKU UNIVERSAL ADAPTER</div>
              <div className="text-[10px] font-mono text-[#2563EB] font-bold">● 6 Core Native Protocols Active</div>
            </div>
          </div>
        </div>

        {/* Asymmetric Bento Box Grid with Translucent Background Images on Every Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {INTEGRATIONS.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`group relative rounded-3xl backdrop-blur-md border p-7 sm:p-8 flex flex-col justify-between overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.03)] transition-all duration-300 ${item.cardBg} ${item.borderColor} ${item.bentoClass}`}
            >
              {/* Top ambient hover glow per card color palette */}
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${item.glowColor} blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Translucent Curated Background Image Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <img
                  src={item.bgImage}
                  alt={item.name}
                  width="400"
                  height="250"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-all duration-500 scale-100 group-hover:scale-105"
                />
                {/* Gradient wash overlay tinted to match card background */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/70 to-white/40" />
              </div>

              {/* Card Content Top */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl border shadow-xs transition-colors ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <Badge variant={item.badgeVariant}>{item.latency}</Badge>
                </div>

                <div className={`text-[10px] font-mono uppercase font-bold tracking-wider mb-1 ${item.accentColor}`}>
                  {item.highlightTag}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-2">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-xl">
                  {item.desc}
                </p>
              </div>

              {/* Card Content Bottom Footer */}
              <div className="relative z-10 pt-4 mt-6 border-t border-slate-300/60 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span className="font-semibold">{item.category}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Zero Delay
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
