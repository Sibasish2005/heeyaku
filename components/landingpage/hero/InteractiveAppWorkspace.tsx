'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    { sender: 'bot', text: 'Hello Aditi! We received your course inquiry. Here is the syllabus details and next batch timing: heeyaku.com/d/aditi', time: '10:42 AM' },
    { sender: 'user', text: 'Thank you! Can I schedule a 15-min counselor call for tomorrow at 4 PM?', time: '10:43 AM' },
    { sender: 'system', text: 'Counselor call confirmed for Tomorrow at 4:00 PM with Sarah K.', time: '10:43 AM' }
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
      statusColor: 'text-[#2563EB]',
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
      statusColor: 'text-amber-700',
      history: ['Attended 1-on-1 counselor demo', 'Fee structure sent via WhatsApp', 'Payment link opened'],
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
      statusColor: 'text-purple-700',
      history: ['Inbound brochure downloaded', 'Counselor dialing now'],
    },
    {
      id: '4',
      name: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      course: 'Cloud Architecture Cohort',
      value: '₹75,000',
      rep: 'Sarah K.',
      stage: 'Enrolled',
      time: '1h ago',
      score: 99,
      phone: '+91 99887 76655',
      statusColor: 'text-emerald-700',
      history: ['Fee settled: ₹75,000', 'Student credentials generated', 'Joined Batch #28'],
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
    triggerToast(`Status updated: ${newStage}`);
  };

  const handleSendWhatsApp = () => {
    if (!customMsgInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'bot', text: customMsgInput, time: 'Just now' }
    ]);
    setCustomMsgInput('');
    triggerToast('WhatsApp message sent to student');
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-16 px-0 sm:px-4">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 sm:right-6 z-50 px-4 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-mono font-bold shadow-xl border border-slate-700"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        
        {/* Top Tab Bar (Clean, No Icons, No Badges) */}
        <div className="h-14 bg-[#F8FAFC] border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'pipeline'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F33]'
              }`}
            >
              Counselor CRM
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'lms'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F33]'
              }`}
            >
              Student Portal & Video
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('automation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'automation'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F33]'
              }`}
            >
              WhatsApp Follow-Ups
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'telemetry'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F33]'
              }`}
            >
              Admission Reports
            </button>
          </div>

          <div className="hidden sm:block text-xs font-mono text-slate-500 font-semibold">
            Interactive Preview
          </div>
        </div>

        {/* Tab Canvas */}
        <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-[380px]">
          
          {/* VIEW 1: Counselor Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">New Leads Today</div>
                  <div className="text-xl font-bold text-[#0B1F33] mt-1">142 Leads</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Distributed to 4 counselors</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Average First Call</div>
                  <div className="text-xl font-bold text-[#2563EB] mt-1">1.4 Minutes</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Called while lead is warm</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Active Pipeline</div>
                  <div className="text-xl font-bold text-[#0B1F33] mt-1">₹18.4 Lakh</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Current batch enrollments</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Follow-up Rate</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">98.5%</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Zero missed callbacks</div>
                </div>
              </div>

              {/* Split: Queue + Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Lead Queue */}
                <div className="lg:col-span-7 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-mono font-bold text-slate-600 uppercase flex justify-between">
                    <span>Recent Inquiries</span>
                    <span className="text-[#2563EB]">Tap lead to view details</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          selectedLeadId === lead.id ? 'bg-blue-50/60 border-l-4 border-l-[#2563EB]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={lead.avatar}
                            alt={lead.name}
                            width="36"
                            height="36"
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-sm font-bold text-[#0B1F33]">{lead.name}</div>
                            <div className="text-xs text-slate-500 truncate">{lead.course}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-[#0B1F33]">{lead.value}</div>
                          <div className={`text-xs font-semibold ${lead.statusColor}`}>{lead.stage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Lead Actions */}
                <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Selected Student</div>
                      <div className="text-base font-bold text-[#0B1F33]">{activeLead.name}</div>
                    </div>
                    <span className={`text-xs font-bold ${activeLead.statusColor}`}>
                      {activeLead.stage}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Course:</span>
                      <span className="font-bold text-[#0B1F33]">{activeLead.course}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Counselor:</span>
                      <span className="font-bold text-[#2563EB]">{activeLead.rep}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-mono text-[#0B1F33]">{activeLead.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">Counselor Actions</div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStageChange(activeLead.id, 'Payment Link Sent', 'text-amber-700')}
                        className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                      >
                        Send Fee Link
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStageChange(activeLead.id, 'Enrolled', 'text-emerald-700')}
                        className="py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold"
                      >
                        Mark as Enrolled
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('automation')}
                      className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#0B1F33]"
                    >
                      Open WhatsApp Conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Student Portal & Video */}
          {activeTab === 'lms' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-xl bg-slate-900 p-6 text-white flex flex-col justify-between min-h-[300px]">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Student Screen Watermark: +91 98765 43210</span>
                  <span>1080p HD</span>
                </div>

                <div className="text-center py-8">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoPlaying(!videoPlaying);
                      triggerToast(videoPlaying ? 'Video Paused' : 'Video Playing (Watermarked)');
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors"
                  >
                    {videoPlaying ? 'Pause Video' : 'Play Protected Lecture'}
                  </button>
                  <div className="text-base font-bold text-white mt-4">Module 4: NEET Organic Chemistry Foundations</div>
                  <div className="text-xs text-slate-400 mt-1">Batch 2026 • Faculty Lecture</div>
                </div>

                <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
                  <span>72% Completed</span>
                  <span>Screen Recording Blocked</span>
                </div>
              </div>

              <div className="lg:col-span-4 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-[#0B1F33]">Batch Syllabus</div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-medium text-emerald-700">
                    ✓ Chapter 1: Introduction & Fundamentals
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-medium text-emerald-700">
                    ✓ Chapter 2: Reaction Mechanisms
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 font-bold text-[#2563EB]">
                    ▶ Chapter 3: Live Class & Practice Questions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: WhatsApp Automation */}
          {activeTab === 'automation' && (
            <div className="max-w-2xl mx-auto rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
              <div className="text-xs font-bold text-[#0B1F33] pb-2 border-b border-slate-200">
                Automated Student WhatsApp Thread
              </div>

              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-xs max-w-md ${
                      msg.sender === 'bot'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : msg.sender === 'user'
                        ? 'bg-blue-50 border border-blue-200 text-slate-900 ml-auto'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800 mx-auto text-center'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-semibold mb-1">
                      {msg.sender === 'bot' ? 'INSTITUTE WHATSAPP' : msg.sender === 'user' ? 'STUDENT' : 'CALENDAR SYNC'} • {msg.time}
                    </div>
                    <div className="leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={customMsgInput}
                  onChange={(e) => setCustomMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                  placeholder="Type a message to simulate reply..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: Telemetry / Admission Reports */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono text-slate-500 font-bold uppercase">Monthly Fee Collections</div>
                <div className="text-2xl font-bold text-[#0B1F33] mt-2">₹42.8 Lakh</div>
                <div className="text-xs text-slate-500 mt-1">Direct via UPI & Net Banking</div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono text-slate-500 font-bold uppercase">Counselor Talk Time Avg</div>
                <div className="text-2xl font-bold text-[#2563EB] mt-2">3h 45m / day</div>
                <div className="text-xs text-slate-500 mt-1">Logged automatically via Android app</div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono text-slate-500 font-bold uppercase">Lead Conversion Rate</div>
                <div className="text-2xl font-bold text-emerald-700 mt-2">38.2%</div>
                <div className="text-xs text-slate-500 mt-1">From initial ad click to enrolled batch</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
