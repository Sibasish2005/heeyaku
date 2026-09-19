'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

const SERVICES_CATALOG = [
  {
    id: 'calltracker',
    name: 'Android Call Tracker',
    summary: 'Tracks counselor calls automatically. Pops up right after each call so counselors can mark if the student is interested, needs a callback, or enrolled.',
  },
  {
    id: 'crm',
    name: 'Counselor Lead CRM',
    summary: 'Pulls leads from Facebook, Instagram, and Google in 30 seconds and assigns them to active telecallers so no student inquiry gets forgotten.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Follow-Up Automation',
    summary: 'Sends course brochures, meeting links, and fee installment payment links directly to students on WhatsApp.',
  },
  {
    id: 'web',
    name: 'Admission Website & Fee Checkout',
    summary: 'Fast course pages where students can view your syllabus and pay admission fees instantly with UPI, PhonePe, or cards.',
  },
  {
    id: 'lms',
    name: 'Piracy-Protected Class Videos',
    summary: 'Displays the student name and phone number dynamically across video lectures to stop screen recording and course leaks on Telegram.',
  },
];

const TEAM_SIZES = [
  '1 - 5 Counselors',
  '6 - 15 Counselors',
  '16 - 50 Counselors',
  '50+ Counselors',
];

export default function BookDemoPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'calltracker',
    'crm',
  ]);
  const [selectedTeamSize, setSelectedTeamSize] = useState(TEAM_SIZES[1]);
  const [instituteName, setInstituteName] = useState('');
  const [notes, setNotes] = useState('');

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const selectedServiceNames = SERVICES_CATALOG
    .filter(s => selectedServices.includes(s.id))
    .map(s => s.name);

  const whatsappMessage = `Hi Heeyaku,\n\nI want to see a live demo for my institute.\n\nServices needed:\n${selectedServiceNames.map(s => `- ${s}`).join('\n')}\n\nTeam Size: ${selectedTeamSize}${instituteName ? `\nInstitute: ${instituteName}` : ''}${notes ? `\nNotes: ${notes}` : ''}\n\nPlease share demo access and pricing.`;

  const whatsappUrl = `https://wa.me/918131838253?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="relative min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-x-clip">
      <Navbar />

      {/* Atmospheric Aurora Lighting (Landing Page Scale) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24 lg:pb-32">
        
        {/* Full-Scale Hero Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <div className="text-xs sm:text-sm font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-3">
            DIRECT ARCHITECTURE CONSULTATION & ONBOARDING
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Book a Live Demo. <br />
            <span className="text-[#2563EB]">Tailored for Your Academy.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed">
            Select the exact tools your team needs. Speak directly with our sales specialists or forward your requirements to WhatsApp for an immediate response.
          </p>
        </div>

        {/* Full-Scale Hotline Banner Strip */}
        <div className="mb-14 p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              DIRECT SALES & ONBOARDING HOTLINE
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33]">
              +91 81318 38253
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">
              Available Monday to Saturday: 9:00 AM – 8:00 PM IST
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:+918131838253"
              className="px-7 py-3.5 rounded-full bg-[#0B1F33] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors shadow-sm"
            >
              Call +91 81318 38253
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors shadow-sm"
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* 2-Column Split Specification Builder (Landing Page Scale) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Selection Canvas */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Step 1: Select Services */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 1
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] mb-2">
                Select What You Need to Setup
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mb-6">
                Click to choose the modules your counselors and faculty need.
              </p>

              <div className="space-y-3">
                {SERVICES_CATALOG.map((service) => {
                  const isChecked = selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-4 ${
                        isChecked
                          ? 'border-[#2563EB] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-base text-[#0B1F33]">
                          {service.name}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                          {service.summary}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                          isChecked
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Team Size */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 2
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] mb-2">
                Counseling & Faculty Team Size
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mb-4">
                Helps us allocate appropriate server capacity and Android tracking slots.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TEAM_SIZES.map((size) => {
                  const isSelected = selectedTeamSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedTeamSize(size)}
                      className={`py-3.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Optional Details */}
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                STEP 3
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] mb-4">
                Institute Information (Optional)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 uppercase mb-1.5">
                    Coaching / Academy Name
                  </label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    placeholder="e.g. Apex Career Institute, Agartala"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0B1F33] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 uppercase mb-1.5">
                    Specific Requirements or Questions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Need to migrate from Excel; want to launch Android app for 12 telecallers by next Monday."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0B1F33] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Live WhatsApp Dispatch Board */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0B1F33] text-white shadow-2xl space-y-6">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  INSTANT WHATSAPP DISPATCH
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Ready to connect?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-medium">
                  Your customized scope will be sent directly to our team at <span className="text-white font-bold">+91 81318 38253</span>.
                </p>
              </div>

              {/* Formatted Message Preview */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs text-slate-300 space-y-2 max-h-[300px] overflow-y-auto">
                <div className="text-slate-400 text-[10px] uppercase font-bold">
                  Generated Specification:
                </div>
                <div className="text-white font-semibold whitespace-pre-wrap leading-relaxed">
                  {whatsappMessage}
                </div>
              </div>

              {/* Action Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center transition-all duration-150 shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
              >
                Forward Scope to WhatsApp →
              </a>

              <div className="text-center text-[11px] font-mono text-slate-400">
                Direct hotline: +91 81318 38253 • Response in &lt; 10 mins
              </div>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
