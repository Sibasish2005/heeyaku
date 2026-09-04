'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, ChevronRight } from 'lucide-react';

const DIAGNOSTIC_STAGES = [
  {
    id: 'stage1',
    step: '01',
    name: 'Lead Capture',
    leakRate: '12% Drop Vulnerability',
    revenueDropBadge: '12% Revenue Drop',
    status: 'CHANNEL MISMATCH',
    leakDesc: 'Leads from Meta ads and Google campaigns arrive into unmonitored inboxes or personal WhatsApp numbers.',
    solution: 'Heeyaku sub-second webhook ingestion deduplicates and routes the lead into the central pipeline instantly.',
  },
  {
    id: 'stage2',
    step: '02',
    name: 'Counselor Routing',
    leakRate: '34% Drop Vulnerability',
    revenueDropBadge: '34% Revenue Drop',
    status: 'ASSIGNMENT LAG',
    leakDesc: 'Manual Excel assignment causes leads to sit cold for 4-8 hours before a counselor even dials.',
    solution: 'Automated round-robin assignment dispatches leads in under 2 minutes with live SLA escalation timers.',
  },
  {
    id: 'stage3',
    step: '03',
    name: 'Follow-Up Momentum',
    leakRate: '48% Drop Vulnerability',
    revenueDropBadge: '48% Revenue Drop',
    status: 'NO SEQUENCE DRIP',
    leakDesc: 'Rep forgets to follow up after the demo call. Lead goes cold and enrolls with a competitor.',
    solution: 'Multi-channel WhatsApp and email drip bots re-engage the candidate with automated scholarship incentives.',
  },
  {
    id: 'stage4',
    step: '04',
    name: 'Payment & Onboarding',
    leakRate: '22% Drop Vulnerability',
    revenueDropBadge: '22% Revenue Drop',
    status: 'FRICTION HANDOFF',
    leakDesc: 'Student pays fees, but manual course access creation takes 24 hours, leading to buyer remorse.',
    solution: 'Payment gateway webhook grants immediate LMS login, curriculum unlock, and batch onboarding in real time.',
  },
];

export default function RevenueLeakSection() {
  const [selectedStage, setSelectedStage] = useState(1); // Default to Stage 2 "Counselor Routing" as shown in screenshot
  const current = DIAGNOSTIC_STAGES[selectedStage];

  return (
    <section className="relative w-full bg-[#FAFCFF] py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-rose-100/40 via-amber-50/30 to-blue-50/40 blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header matching exact screenshot typography */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-tight mb-2">
            Where EdTech Revenue
          </h2>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] via-[#F43F5E] to-[#E11D48]">
            Silently Leaks Away
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            Click across your pipeline stages to inspect the exact drop-off points and see how unified architecture plugs each leak.
          </p>
        </div>

        {/* Unified Diagnostic Canvas (Cardless Continuous Layout) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          
          {/* Left Column: Seamless Interactive Diagnostic Stepper */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#F8FAFC]/70 flex flex-col justify-between space-y-2">
            <div>
              <div className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-4 px-2">
                SELECT PIPELINE STAGE
              </div>

              <div className="space-y-1.5">
                {DIAGNOSTIC_STAGES.map((st, idx) => {
                  const isSelected = selectedStage === idx;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStage(idx)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white text-[#0B1F33] shadow-sm border-l-4 border-l-[#BE123C] border-y border-r border-slate-200/80'
                          : 'text-slate-700 hover:text-[#0B1F33] hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`font-mono text-xs font-extrabold ${isSelected ? 'text-[#BE123C]' : 'text-slate-600'}`}>
                          {st.step}
                        </span>
                        <div>
                          <div className="font-extrabold text-sm sm:text-base text-[#0B1F33]">{st.name}</div>
                          <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-[#BE123C] font-bold' : 'text-slate-600'}`}>
                            {st.leakRate}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#BE123C] translate-x-1' : 'text-slate-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 px-2 text-xs font-mono text-slate-600">
              <span>● Interactive Audit Mode</span>
            </div>
          </div>

          {/* Right Column: Open Diagnostic Details Pane */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Top Status Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="inline-flex items-center gap-2 text-xs font-bold font-mono text-[#BE123C] tracking-wider uppercase">
                    <Shield className="w-4 h-4 text-[#BE123C]" />
                    <span>IDENTIFIED BOTTLENECK: {current.status}</span>
                  </div>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-md bg-rose-50 text-[#BE123C] border border-rose-200 font-bold">
                    {current.revenueDropBadge}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* The Breakage */}
                  <div>
                    <span className="text-xs font-mono uppercase font-extrabold text-slate-600 tracking-wider block mb-2">
                      THE BREAKAGE
                    </span>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium pl-4 border-l-2 border-rose-300">
                      {current.leakDesc}
                    </p>
                  </div>

                  {/* How Heeyaku Plugs It */}
                  <div>
                    <span className="text-xs font-mono uppercase font-extrabold text-[#2563EB] tracking-wider block mb-2">
                      HOW HEEYAKU PLUGS IT
                    </span>
                    <div className="flex items-start gap-3 text-sm sm:text-base text-[#0B1F33] leading-relaxed font-medium pl-4 border-l-2 border-[#2563EB]">
                      <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{current.solution}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Diagnostic Step {current.step} of 04</span>
              <span className="text-emerald-700 font-bold">✓ 100% Traceable Architecture</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
