'use client';

import React from 'react';
import { motion } from 'framer-motion';
import HeeyakuLogo from './HeeyakuLogo';
import { ArrowRight, Sparkles, Zap, Shield, Users, GraduationCap, Globe, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function BrandPillarsShowcase() {
  return (
    <section className="relative w-full bg-white py-20 lg:py-28 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-100/40 via-cyan-100/30 to-indigo-100/40 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Section Header with Official Brand Tagline */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
            Technology that <span className="text-[#2563EB]">connects</span> today. <br className="hidden sm:inline" />
            Growth that <span className="text-[#0284C7]">lasts</span> tomorrow.
          </h2>

          <p className="mt-4 text-xs sm:text-sm font-bold tracking-widest text-slate-700 uppercase">
            TECHNOLOGY THAT CONNECTS • SYSTEMS THAT EMPOWER • GROWTH THAT LASTS
          </p>
        </div>

        {/* Unified Continuous Architectural Showcase (Cardless Open Canvas) */}
        <div className="relative rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 items-stretch">
            
            {/* PILLAR 1: DON'T JUST GET LEADS. CONVERT THEM. */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-white/60 hover:bg-white transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <HeeyakuLogo size={26} color="#0B1F33" dotColor="#2563EB" withText={false} />
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                    CONVERSION CRM
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-3 uppercase text-[#0B1F33]">
                  DON'T JUST GET LEADS. <br />
                  <span className="text-[#2563EB]">CONVERT THEM.</span>
                </h3>

                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-6">
                  Build a high-velocity system that routes inquiries in seconds and never lets an opportunity slip away.
                </p>

                {/* Inline Visual Counselor Asset */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 font-semibold">
                    <span>Active Inbound Routing</span>
                    <span className="text-emerald-700 font-bold">1.4m SLA</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2 overflow-hidden">
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=75" alt="Sarah K." width="24" height="24" loading="lazy" decoding="async" />
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=75" alt="Alex M." width="24" height="24" loading="lazy" decoding="async" />
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=75" alt="Ananya D." width="24" height="24" loading="lazy" decoding="async" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-700 font-semibold">3 Counselors Dialing</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="text-[#2563EB] font-bold">0% Opportunity Loss</span>
                <ArrowRight className="w-4 h-4 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* PILLAR 2: ONE SYSTEM. ALL CONNECTED. REAL GROWTH. */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-white/80 hover:bg-white transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <HeeyakuLogo size={26} color="#0B1F33" dotColor="#2563EB" withText={false} />
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    UNIFIED STACK
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-3 uppercase text-[#0B1F33]">
                  ONE SYSTEM. <br />
                  <span className="text-[#2563EB]">ALL CONNECTED.</span> <br />
                  REAL GROWTH.
                </h3>

                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-4">
                  CRM, LMS, websites, and automations sharing single-source data in real time.
                </p>

                {/* Radial Hub Diagram */}
                <div className="relative py-4 flex items-center justify-center">
                  <div className="relative w-36 h-36 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#0B1F33] flex items-center justify-center shadow-md">
                      <HeeyakuLogo size={18} color="#FFFFFF" dotColor="#38BDF8" withText={false} />
                    </div>
                    <div className="absolute top-0 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold font-mono text-[#2563EB] shadow-xs">
                      CRM
                    </div>
                    <div className="absolute right-0 translate-x-1/2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold font-mono text-[#0B1F33] shadow-xs">
                      WEB
                    </div>
                    <div className="absolute bottom-0 translate-y-1/2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold font-mono text-[#2563EB] shadow-xs">
                      AUTO
                    </div>
                    <div className="absolute left-0 -translate-x-1/2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold font-mono text-[#0B1F33] shadow-xs">
                      LMS
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="text-slate-800 font-bold">4 Synchronized Engines</span>
                <ArrowRight className="w-4 h-4 text-[#0B1F33] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* PILLAR 3: AUTOMATE FOLLOW UPS. BUILD TRUST. CLOSE MORE. */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-white/60 hover:bg-white transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <HeeyakuLogo size={26} color="#0B1F33" dotColor="#38BDF8" withText={false} />
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    AUTONOMOUS AI
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-3 uppercase text-[#0B1F33]">
                  AUTOMATE FOLLOW UPS. <br />
                  <span className="text-[#0284C7]">BUILD TRUST.</span> <br />
                  CLOSE MORE.
                </h3>

                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-6">
                  Intelligent WhatsApp and SMS drip sequences that re-engage leads on autopilot.
                </p>

                {/* Inline Visual Automation Drip */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span>WhatsApp Cloud Drip</span>
                    <span className="text-cyan-700 font-bold">+38% Uplift</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                    <span className="text-emerald-700 font-bold">✓✓ Delivered</span>
                    <span>• Scholarship incentive dropped</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="text-cyan-700 font-bold">Instant Omnichannel Action</span>
                <ArrowRight className="w-4 h-4 text-cyan-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
