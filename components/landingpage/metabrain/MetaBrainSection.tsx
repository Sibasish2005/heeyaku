'use client';

import React, { useState } from 'react';
import { BrainCircuit, Cpu, Database, Zap, Check, Send } from 'lucide-react';
import TiltedCard from './TiltedCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function MetaBrainSection() {
  const [activeQuery, setActiveQuery] = useState('counselor');
  const [dispatched, setDispatched] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <section id="metabrain" className="relative w-full bg-[#F8FAFC] py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#0B1F33] text-white text-xs font-mono font-bold shadow-2xl border border-cyan-400 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Neural Glow */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-100/50 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-100/50 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#0B1F33] leading-tight">
              Heeyaku MetaBrain: <br />
              <span className="text-[#2563EB]">
                Your Business, Amplified.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Connect every element of your workflow into a dynamic internal knowledge base and automated operational assistant that watches your pipeline 24/7.
            </p>

            {/* Clickable Interactive Feature Nodes */}
            <div className="space-y-3.5 pt-4 border-t border-slate-200">
              <div 
                onClick={() => {
                  setActiveQuery('counselor');
                  triggerToast('⚡ Synthesized: Counselor Performance & Routing');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 active:scale-98 ${
                  activeQuery === 'counselor' ? 'bg-blue-50/80 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0B1F33]">Intelligent Context Synthesis</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Learns curriculum, student FAQs, pricing tier rules, and sales scripts.</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  setActiveQuery('knowledge');
                  triggerToast('⚡ Knowledge Graph: 14,280 indexed student docs');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 active:scale-98 ${
                  activeQuery === 'knowledge' ? 'bg-cyan-50/80 border-cyan-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0B1F33]">Continuous Knowledge Graph</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Turns counselor call transcripts and support chats into searchable memory.</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  setActiveQuery('agent');
                  triggerToast('⚡ Autonomous Agent: 12 scholarship vouchers dispatched');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 active:scale-98 ${
                  activeQuery === 'agent' ? 'bg-indigo-50/80 border-indigo-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0B1F33]">Autonomous Agent Actions</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Drafts personalized counselor replies and flags high-risk student churn.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: React Bits TiltedCard 3D Interactive UI with Live Action Buttons */}
          <div className="lg:col-span-6 flex justify-center">
            <TiltedCard
              imageSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=75"
              altText="MetaBrain Neural Dashboard"
              captionText="⚡ Live MetaBrain Telemetry"
              containerHeight="480px"
              imageHeight="480px"
              rotateAmplitude={12}
              scaleOnHover={1.02}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-t from-[#0B1F33]/95 via-[#0B1F33]/60 to-transparent">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-mono text-[#0B1F33] font-bold">
                      <BrainCircuit className="w-4 h-4 text-[#2563EB]" />
                      <span>Node #MB-820 • Active</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-700 text-white font-bold shadow-sm">
                      ● 99.4% Accuracy
                    </span>
                  </div>

                  {/* Bottom AI Output & Interactive Action Pill */}
                  <div className="p-4.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl space-y-3 text-[#0B1F33]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#2563EB] font-bold">
                      <span>⚡ MetaBrain Live Synthesis</span>
                      <span className="text-slate-600 font-medium">0.28s</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
                      {activeQuery === 'counselor'
                        ? '"28 high-intent leads in decision stage. Average counselor first-touch response time is 1.4 minutes."'
                        : activeQuery === 'knowledge'
                        ? '"Curriculum graph synchronized across 14,280 documents. Student question patterns indexed for auto-replies."'
                        : '"12 automatic scholarship vouchers dispatched via WhatsApp. 4 payments settled in the last hour."'}
                    </p>

                    {/* Interactive Optimistic Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDispatched(true);
                          triggerToast('✓ WhatsApp drip sequence dispatched to 28 leads');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                          dispatched
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#2563EB] text-white hover:bg-blue-600'
                        }`}
                      >
                        {dispatched ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{dispatched ? 'Dispatched' : 'Dispatch WhatsApp Bot'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast('● 28 Student dossiers loaded in CRM');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono active:scale-95 transition-all"
                      >
                        View Dossiers
                      </button>
                    </div>
                  </div>
                </div>
              }
            />
          </div>

        </div>
      </div>
    </section>
  );
}
