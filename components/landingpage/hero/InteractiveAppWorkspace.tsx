'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, Globe, Cpu, MessageSquare, 
  Search, Bell, Shield, Play, CheckCircle2, 
  ArrowUpRight, BarChart3, Database, Sparkles, Filter, 
  ChevronRight, PhoneCall, Send, Zap, Clock, Check, X, RefreshCw
} from 'lucide-react';

type WorkspaceView = 'pipeline' | 'lms' | 'automation' | 'telemetry';

interface Lead {
  id: string;
  name: string;
  avatar: string;
  course: string;
  value: string;
  rep: string;
  stage: string;
  time: string;
  score: number;
  phone: string;
  statusColor: string;
  history: string[];
}

export default function InteractiveAppWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceView>('pipeline');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user' | 'system'; text: string; time: string }>>([
    { sender: 'bot', text: 'Hi Aditi! We received your inquiry for the AI Bootcamp. Sarah K. has prepared your personalized curriculum overview: heeyaku.io/d/aditi', time: '10:42 AM' },
    { sender: 'user', text: 'Thanks! Can I schedule a 15-min mentor discussion for tomorrow at 4 PM?', time: '10:43 AM' },
    { sender: 'system', text: '✓ Google Calendar invite synced for Tomorrow 4:00 PM with Sarah K.', time: '10:43 AM' }
  ]);
  const [customMsgInput, setCustomMsgInput] = useState('');

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Aditi Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      course: 'AI & Data Engineering',
      value: '₹65,000',
      rep: 'Sarah K.',
      stage: 'Demo Scheduled',
      time: '2m ago',
      score: 96,
      phone: '+91 98765 43210',
      statusColor: 'bg-blue-50 text-[#2563EB] border-blue-200',
      history: ['Lead captured via Meta Ads', 'Assigned to Sarah K. in 45s', 'Demo scheduled for Tomorrow 4 PM'],
    },
    {
      id: '2',
      name: 'Rohan Mehta',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      course: 'Full-Stack Web Bootcamp',
      value: '₹45,000',
      rep: 'Alex M.',
      stage: 'Payment Link Sent',
      time: '14m ago',
      score: 88,
      phone: '+91 98111 22334',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      history: ['Attended 1-on-1 counselor demo', '10% early-bird voucher issued', 'Razorpay checkout link opened'],
    },
    {
      id: '3',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      course: 'Product Management 101',
      value: '₹35,000',
      rep: 'Ananya D.',
      stage: 'Counselor Dialing',
      time: 'Just now',
      score: 92,
      phone: '+91 97234 56789',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      history: ['Inbound brochure downloaded', 'Auto-dial queued via VoIP'],
    },
    {
      id: '4',
      name: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      course: 'Cloud Architecture Cohort',
      value: '₹75,000',
      rep: 'Sarah K.',
      stage: 'Converted (LMS Active)',
      time: '1h ago',
      score: 99,
      phone: '+91 99887 76655',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      history: ['Fee settled: ₹75,000', 'DRM credentials generated', 'Cohort Telegram role assigned'],
    },
  ]);

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStageChange = (leadId: string, newStage: string, statusColor: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          stage: newStage,
          statusColor,
          history: [`Stage updated to "${newStage}" just now`, ...l.history]
        };
      }
      return l;
    }));
    triggerToast(`✓ Status updated: ${newStage}`);
  };

  const handleSendWhatsApp = () => {
    if (!customMsgInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'bot', text: customMsgInput, time: 'Just now' }
    ]);
    setCustomMsgInput('');
    triggerToast('✓ WhatsApp message dispatched to student');
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-16 px-0 sm:px-4">
      
      {/* Live Action Optimistic Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-24 right-4 sm:right-6 z-50 px-3.5 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-mono font-bold shadow-2xl border border-blue-400 flex items-center gap-2 max-w-[90vw]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer Browser/App Window Frame with Layered Depth */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/90 p-[1px] sm:p-[1.5px] shadow-[0_25px_70px_rgba(11,31,51,0.22)] backdrop-blur-xl overflow-hidden">
        <div className="relative rounded-[15px] sm:rounded-[23px] bg-white overflow-hidden border border-slate-200/80">
          
          {/* Top Window Bar: Traffic lights, Search & Tab Nav */}
          <div className="h-12 sm:h-14 bg-[#F8FAFC] border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {/* Window Traffic Lights (Decorative) */}
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 inline-block" />
            </div>

            {/* Interactive Workspace Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 sm:p-1 rounded-xl shrink-0 overflow-x-auto" role="tablist" aria-label="Workspace view options">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pipeline'}
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 shrink-0 ${
                  activeTab === 'pipeline'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-slate-700 hover:text-[#0B1F33]'
                }`}
              >
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Pipeline</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'lms'}
                onClick={() => setActiveTab('lms')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 shrink-0 ${
                  activeTab === 'lms'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-slate-700 hover:text-[#0B1F33]'
                }`}
              >
                <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>LMS</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'automation'}
                onClick={() => setActiveTab('automation')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 shrink-0 ${
                  activeTab === 'automation'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-slate-700 hover:text-[#0B1F33]'
                }`}
              >
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>WhatsApp AI</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'telemetry'}
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 shrink-0 ${
                  activeTab === 'telemetry'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-slate-700 hover:text-[#0B1F33]'
                }`}
              >
                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Revenue</span>
              </button>
            </div>

            {/* Right Status Indicator */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-600 font-bold">Live Demo</span>
            </div>
          </div>

          {/* Main App Workspace Canvas */}
          <div className="p-3.5 sm:p-6 lg:p-8 min-h-[420px] bg-white">
            <AnimatePresence mode="wait">
              
              {/* VIEW 1: Interactive Lead Pipeline & Counselor CRM */}
              {activeTab === 'pipeline' && (
                <motion.div
                  key="pipeline-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div 
                      onClick={() => triggerToast('● Inbound queue refreshed: 142 leads')}
                      className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors active:scale-98"
                    >
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-600 uppercase font-bold">Active Inbound</div>
                      <div className="text-base sm:text-xl font-extrabold text-[#0B1F33] font-mono mt-0.5">142 Leads</div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold mt-0.5">↑ +24% today</div>
                    </div>

                    <div 
                      onClick={() => triggerToast('⚡ Auto-Routing: SLA response time 1.4m')}
                      className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors active:scale-98"
                    >
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-600 uppercase font-bold">Avg SLA</div>
                      <div className="text-base sm:text-xl font-extrabold text-[#2563EB] font-mono mt-0.5">1.4 Mins</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">Auto-routed</div>
                    </div>

                    <div 
                      onClick={() => triggerToast('● Active Pipeline: ₹18.4 Lakh (Batch 28)')}
                      className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors active:scale-98"
                    >
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-600 uppercase font-bold">Pipeline Value</div>
                      <div className="text-base sm:text-xl font-extrabold text-[#0B1F33] font-mono mt-0.5">₹18.4 Lakh</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">Cohort #28</div>
                    </div>

                    <div 
                      onClick={() => triggerToast('✓ 38.2% Conversion: 0% Lead Leakage')}
                      className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors active:scale-98"
                    >
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-600 uppercase font-bold">Conversion</div>
                      <div className="text-base sm:text-xl font-extrabold text-emerald-700 font-mono mt-0.5">38.2%</div>
                      <div className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold mt-0.5">0% Leakage</div>
                    </div>
                  </div>

                  {/* 2-Column Split: Interactive Queue + Live Action Dossier */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    
                    {/* Left: Lead List */}
                    <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
                      <div className="p-3 sm:p-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-600 font-bold uppercase">
                        <span>LIVE INBOUND QUEUE</span>
                        <span className="text-[#2563EB]">● Tap lead</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {leads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              triggerToast(`Selected: ${lead.name} (${lead.stage})`);
                            }}
                            className={`p-3 sm:p-4 flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                              selectedLeadId === lead.id ? 'bg-blue-50/70 border-l-4 border-l-[#2563EB]' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <img 
                                src={lead.avatar} 
                                alt={lead.name} 
                                width="36"
                                height="36"
                                loading="lazy"
                                decoding="async"
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 shrink-0" 
                              />
                              <div className="min-w-0 truncate">
                                <div className="text-xs sm:text-sm font-bold text-[#0B1F33] flex items-center gap-1.5 truncate">
                                  <span className="truncate">{lead.name}</span>
                                  <span className="text-[9px] sm:text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold shrink-0">
                                    {lead.score}pt
                                  </span>
                                </div>
                                <div className="text-[11px] sm:text-xs text-slate-600 truncate">{lead.course}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
                              <div className="font-mono font-bold text-[#0B1F33] hidden xs:block">{lead.value}</div>
                              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border font-mono text-[10px] sm:text-[11px] font-bold ${lead.statusColor}`}>
                                {lead.stage}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Live Interactive Lead Inspector & Action Box */}
                    <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 sm:space-y-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={activeLead.avatar} 
                            alt={activeLead.name} 
                            width="40"
                            height="40"
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-sm shrink-0" 
                          />
                          <div>
                            <div className="text-[10px] font-mono font-bold text-slate-600 uppercase">INSPECTOR DOSSIER</div>
                            <div className="text-sm sm:text-base font-extrabold text-[#0B1F33]">{activeLead.name}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${activeLead.statusColor}`}>
                          {activeLead.stage}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Target Course:</span>
                          <span className="font-bold text-[#0B1F33] truncate ml-2">{activeLead.course}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Counselor Assigned:</span>
                          <span className="font-bold text-[#2563EB]">{activeLead.rep}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Phone / WhatsApp:</span>
                          <span className="font-mono text-slate-700">{activeLead.phone}</span>
                        </div>
                      </div>

                      {/* Action Buttons with Live Optimistic Updates */}
                      <div className="pt-2.5 border-t border-slate-200 space-y-2">
                        <div className="text-[9px] font-mono font-bold text-slate-600 uppercase">EXECUTE ACTION (OPTIMISTIC)</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleStageChange(activeLead.id, 'Payment Link Sent', 'bg-amber-50 text-amber-700 border-amber-200');
                            }}
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Drop Fee Link</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleStageChange(activeLead.id, 'Converted (LMS Active)', 'bg-emerald-50 text-emerald-700 border-emerald-200');
                              triggerToast(`🎉 ${activeLead.name} enrolled! LMS credentials unlocked.`);
                            }}
                            className="p-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Paid (LMS)</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label="Open WhatsApp Chat with student"
                          onClick={() => {
                            setActiveTab('automation');
                            triggerToast(`Switched to WhatsApp sequence for ${activeLead.name}`);
                          }}
                          className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#0B1F33] active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Open WhatsApp Chat</span>
                        </button>
                      </div>

                      {/* Audit Log */}
                      <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
                        <div className="font-bold text-slate-600">TELEMETRY AUDIT TRAIL:</div>
                        {activeLead.history.slice(0, 2).map((h, i) => (
                          <div key={i} className="text-slate-700 truncate">➔ {h}</div>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* VIEW 2: Interactive DRM LMS Student Portal */}
              {activeTab === 'lms' && (
                <motion.div
                  key="lms-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
                >
                  <div className="lg:col-span-8 rounded-2xl bg-slate-950 p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] sm:min-h-[320px]">
                    {/* Lecture Image Texture Overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <img 
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=480&q=75" 
                        alt="Lecture Stream" 
                        width="480"
                        height="320"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[10px] sm:text-xs font-mono text-cyan-300 backdrop-blur-md">
                        <Shield className="w-3.5 h-3.5" />
                        <span>DRM Encrypted • student_#8201</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">● 1080p</span>
                    </div>

                    <div className="text-center py-6 sm:py-10 relative z-10">
                      <button
                        type="button"
                        aria-label={videoPlaying ? "Pause Video Stream" : "Play Video Stream"}
                        onClick={() => {
                          setVideoPlaying(!videoPlaying);
                          triggerToast(videoPlaying ? '⏸ Video Stream Paused' : '▶ Video Stream Active (Encrypted)');
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#2563EB] hover:bg-blue-600 transition-transform active:scale-95 flex items-center justify-center mx-auto cursor-pointer shadow-lg shadow-blue-500/30"
                      >
                        {videoPlaying ? (
                          <span className="font-bold text-xs font-mono text-white">PAUSE</span>
                        ) : (
                          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1" />
                        )}
                      </button>
                      <div className="text-sm sm:text-base font-bold text-white mt-3 sm:mt-4">Module 4: Neural Pipeline Architecture</div>
                      <div className="text-xs text-slate-300 mt-0.5 sm:mt-1">Cohort #28 • Dr. Amit Sengupta</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-300 border-t border-white/10 pt-2.5 sm:pt-3">
                      <span>{videoPlaying ? '72%' : '68%'} Completed</span>
                      <button 
                        type="button"
                        aria-label="Submit Capstone Assignment"
                        onClick={() => triggerToast('✓ Interactive Module Capstone Submitted')}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 hover:bg-white/20 active:scale-95 transition-all text-xs"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-[#0B1F33] mb-2 flex items-center justify-between">
                        <span>Curriculum Syllabus</span>
                        <span className="text-[10px] font-mono text-[#2563EB]">Batch 28</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <button 
                          type="button"
                          onClick={() => triggerToast('● Module 01: Completed (Score 100%)')}
                          className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 text-emerald-700 font-medium hover:bg-slate-50 text-xs"
                        >
                          ✓ 01. Pipeline Foundations
                        </button>
                        <button 
                          type="button"
                          onClick={() => triggerToast('● Module 02: Completed (Score 95%)')}
                          className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 text-emerald-700 font-medium hover:bg-slate-50 text-xs"
                        >
                          ✓ 02. Webhook Ingestion Engine
                        </button>
                        <button 
                          type="button"
                          onClick={() => triggerToast('▶ Module 03: Currently Streaming')}
                          className="w-full text-left p-2 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-xs"
                        >
                          ▶ 03. Live DRM Video Encryption
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 3: WhatsApp Conversational Automation AI */}
              {activeTab === 'automation' && (
                <motion.div
                  key="automation-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="max-w-2xl mx-auto rounded-2xl bg-slate-50 border border-slate-200/90 p-4 sm:p-6 space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-xs text-[#0B1F33]">WhatsApp Sequence Bot</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 font-bold">Node: #WA-90</span>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-2.5 max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl text-xs max-w-md ${
                          msg.sender === 'bot'
                            ? 'bg-white border border-slate-200 text-slate-800'
                            : msg.sender === 'user'
                            ? 'bg-blue-50 border border-blue-200 text-slate-900 ml-auto'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800 mx-auto text-center'
                        }`}
                      >
                        <div className="text-[9px] font-mono font-bold mb-0.5 opacity-70">
                          {msg.sender === 'bot' ? 'BOT DISPATCH' : msg.sender === 'user' ? 'STUDENT' : 'CALENDAR SYNC'} • {msg.time}
                        </div>
                        <div className="leading-relaxed">{msg.text}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="pt-1 flex gap-2">
                    <input
                      type="text"
                      aria-label="Simulate a reply to student"
                      value={customMsgInput}
                      onChange={(e) => setCustomMsgInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                      placeholder="Simulate a reply..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      aria-label="Send simulated reply"
                      onClick={handleSendWhatsApp}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
                    >
                      Send
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VIEW 4: Revenue & CAC Telemetry */}
              {activeTab === 'telemetry' && (
                <motion.div
                  key="telemetry-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div 
                      onClick={() => triggerToast('● MRR projected to reach ₹58 Lakh next cohort')}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors active:scale-98"
                    >
                      <div className="text-[11px] font-mono text-slate-600 uppercase font-bold">Monthly Ingestion</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] font-mono mt-1">₹42.8 Lakh</div>
                      <div className="text-xs text-emerald-700 font-bold mt-1.5">↑ +32% MoM</div>
                    </div>

                    <div 
                      onClick={() => triggerToast('● CAC reduced from ₹4,200 to ₹1,850 via WhatsApp bots')}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors active:scale-98"
                    >
                      <div className="text-[11px] font-mono text-slate-600 uppercase font-bold">CAC to LTV Ratio</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] font-mono mt-1">4.8x</div>
                      <div className="text-xs text-slate-600 mt-1.5">Industry avg: 2.2x</div>
                    </div>

                    <div 
                      onClick={() => triggerToast('✓ 96.4% Student Retention: Zero Churn detected')}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors active:scale-98"
                    >
                      <div className="text-[11px] font-mono text-slate-600 uppercase font-bold">Retention SLA</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-1">96.4%</div>
                      <div className="text-xs text-emerald-700 font-bold mt-1.5">Auto intervention</div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
