'use client';

import React, { useState } from 'react';

const TELEMETRY_VIEWS = [
  {
    id: 'telephony',
    title: 'Automatic Call Duration & Logs',
    desc: 'The Android app captures talk time, call timestamp, and connected/missed status automatically.',
    metric: '100% Automatic',
  },
  {
    id: 'disposition',
    title: 'Quick 2-Tap Call Outcomes',
    desc: 'Counselors select Interested, Callback, or Enrolled right after hanging up without opening a spreadsheet.',
    metric: 'Under 5 Seconds',
  },
  {
    id: 'sla',
    title: 'Instant Reminder to Call New Leads',
    desc: 'Alerts counselors immediately when a fresh student inquiry arrives from an ad.',
    metric: 'Under 2 Minutes',
  },
];

const COUNSELOR_DATA = [
  { name: 'Sarah K.', calls: 32, duration: '2h 14m', connectRate: '78%', activeLead: 'Aditi Sharma', status: 'In Call' },
  { name: 'Alex M.', calls: 27, duration: '1h 48m', connectRate: '71%', activeLead: 'Rohan Mehta', status: 'Ready' },
  { name: 'Ananya D.', calls: 38, duration: '2h 55m', connectRate: '84%', activeLead: 'Priya Patel', status: 'Updating Note' },
];

export default function MetaBrainSection() {
  const [activeTab, setActiveTab] = useState('telephony');

  return (
    <section id="analytics" className="relative w-full bg-[#F8FAFC] py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Clear Sales Copy (No Badges, No Icons) */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider">
              Automatic Call Tracking
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
              Complete Visibility Over Daily Calls. Zero Guesswork.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Eliminate manual call reporting and missing student follow-ups. Every call made by your counselors on their Android phones is automatically recorded with duration, time, and student notes.
            </p>

            {/* Selectors */}
            <div className="space-y-3 pt-2">
              {TELEMETRY_VIEWS.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-white border-[#2563EB] shadow-xs' 
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#0B1F33]">{item.title}</h3>
                      <span className="text-xs font-mono font-bold text-[#2563EB]">
                        {item.metric}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Clean Live Counselor Roster */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
              
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono">
                <span className="font-bold text-[#0B1F33]">TODAY’S COUNSELING TEAM</span>
                <span className="text-slate-500">Live Status</span>
              </div>

              {/* Counselors Performance Feed */}
              <div className="space-y-2.5">
                {COUNSELOR_DATA.map((counselor, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0B1F33] flex items-center gap-2">
                        <span>{counselor.name}</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {counselor.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Calling: <span className="font-medium text-slate-700">{counselor.activeLead}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Calls</span>
                        <span className="font-bold text-[#0B1F33]">{counselor.calls}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Talk Time</span>
                        <span className="font-bold text-[#2563EB]">{counselor.duration}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Connected</span>
                        <span className="font-bold text-emerald-700">{counselor.connectRate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disposition Breakdown Mini Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0B1F33]">
                  <span>Today&apos;s Call Summary</span>
                  <span className="font-mono text-[11px] text-[#2563EB]">97 Calls Completed</span>
                </div>
                
                {/* Visual Proportion Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                  <div style={{ width: '42%' }} className="bg-[#2563EB] h-full" />
                  <div style={{ width: '28%' }} className="bg-[#38BDF8] h-full" />
                  <div style={{ width: '18%' }} className="bg-emerald-600 h-full" />
                  <div style={{ width: '12%' }} className="bg-slate-400 h-full" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-600 pt-1">
                  <span>Interested: 42%</span>
                  <span>Callback: 28%</span>
                  <span>Enrolled: 18%</span>
                  <span>Unreachable: 12%</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
