'use client';

import React, { useState } from 'react';

const DIAGNOSTIC_STAGES = [
  {
    id: 'stage1',
    step: '01',
    name: 'Lead Capture',
    leakRate: '12% Lost',
    status: 'DELAYED HANDOFF',
    leakDesc: 'Inquiries from Facebook and Google ads arrive into personal WhatsApp numbers or unmonitored email inboxes.',
    solution: 'HEEYAKU routes new inquiries into your central admission board in under 60 seconds.',
  },
  {
    id: 'stage2',
    step: '02',
    name: 'Counselor Dialing',
    leakRate: '34% Lost',
    status: 'HOURS OF DELAY',
    leakDesc: 'Leads sit in Excel sheets for 4 to 8 hours before counselors dial them. By then, the student has moved on.',
    solution: 'Leads are assigned immediately to active counselors with automated call reminders.',
  },
  {
    id: 'stage3',
    step: '03',
    name: 'Student Follow-Up',
    leakRate: '48% Lost',
    status: 'FORGOTTEN CALLBACKS',
    leakDesc: 'Counselors forget to follow up after the demo class. The interested student enrolls with another coaching center.',
    solution: 'Automated WhatsApp messages send syllabus PDFs, fee schedules, and demo reminders on schedule.',
  },
  {
    id: 'stage4',
    step: '04',
    name: 'Fee Payment',
    leakRate: '22% Lost',
    status: 'PAYMENT DELAY',
    leakDesc: 'Parents struggle with confusing bank transfers or wait days for manual confirmation receipts.',
    solution: 'Send 1-tap UPI payment links with instant fee receipts delivered directly to WhatsApp.',
  },
];

export default function RevenueLeakSection() {
  const [selectedStage, setSelectedStage] = useState(1);
  const current = DIAGNOSTIC_STAGES[selectedStage];

  return (
    <section className="relative w-full bg-[#FAFCFF] py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono text-rose-600 font-bold uppercase tracking-wider mb-2">
            Common Admission Bottlenecks
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            Where Coaching Inquiries Get Lost
          </h2>
          <p className="mt-3 text-base text-slate-600 font-medium">
            Tap through each stage to see why students drop off and how HEEYAKU fixes it.
          </p>
        </div>

        {/* Diagnostic Canvas (Zero Badges, Zero Icons) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 shadow-sm">
          
          {/* Left: Stage Stepper */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#F8FAFC] space-y-2">
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
              Select Admission Stage
            </div>

            <div className="space-y-2">
              {DIAGNOSTIC_STAGES.map((st, idx) => {
                const isSelected = selectedStage === idx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStage(idx)}
                    className={`w-full p-4 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#0B1F33] shadow-xs border-l-4 border-l-[#BE123C] border-y border-r border-slate-200'
                        : 'text-slate-600 hover:text-[#0B1F33] hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono text-slate-500 font-bold">
                        Step {st.step}
                      </div>
                      <div className="font-bold text-sm sm:text-base text-[#0B1F33] mt-0.5">
                        {st.name}
                      </div>
                    </div>

                    <div className={`text-xs font-mono font-bold ${isSelected ? 'text-[#BE123C]' : 'text-slate-500'}`}>
                      {st.leakRate}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Diagnosis Details */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white space-y-8">
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-[#BE123C] uppercase">
                    Problem Identified: {current.status}
                  </div>
                  <div className="text-xl font-bold text-[#0B1F33] mt-1">
                    {current.name} Breakdown
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-slate-500">
                  {current.leakRate} Drop-off
                </div>
              </div>

              {/* The Problem */}
              <div>
                <div className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                  What Goes Wrong
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium pl-3 border-l-2 border-rose-300">
                  {current.leakDesc}
                </p>
              </div>

              {/* How HEEYAKU Solves It */}
              <div>
                <div className="text-xs font-mono font-bold uppercase text-[#2563EB] mb-2">
                  How HEEYAKU Solves It
                </div>
                <p className="text-sm sm:text-base text-[#0B1F33] leading-relaxed font-medium pl-3 border-l-2 border-[#2563EB]">
                  {current.solution}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Step {current.step} of 04</span>
              <span className="font-semibold text-[#2563EB]">Zero Lost Inquiries with HEEYAKU</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
