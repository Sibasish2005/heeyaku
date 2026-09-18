'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';

const SERVICES_CATALOG = [
  {
    id: 'calltracker',
    name: 'Android Call Tracker',
    summary: 'Tracks counselor calls automatically. Pops up right after each call so counselors can mark if the student is interested, needs a callback, or closed.',
  },
  {
    id: 'crm',
    name: 'Counselor Lead CRM',
    summary: 'Pulls leads from Facebook and Google in 30 seconds and assigns them to active telecallers so no student waits or gets forgotten.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Follow-Up Automation',
    summary: 'Sends course brochures, meeting links, and fee installment payment links directly to students on WhatsApp.',
  },
  {
    id: 'web',
    name: 'Admission Website & Fee Checkout',
    summary: 'Fast course pages where students can view your syllabus and pay admission fees instantly with UPI or cards.',
  },
  {
    id: 'lms',
    name: 'Piracy-Protected Class Videos',
    summary: 'Puts the student name and phone number across video lectures to prevent screen recording and course sharing.',
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
    <div className="min-h-screen bg-white text-[#0B1F33] flex flex-col justify-between">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        
        {/* Simple, Non-Techy Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F33] tracking-tight mb-4">
            Book a Demo
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Tell us what your institute needs. Call us directly or send your requirements on WhatsApp for an immediate response.
          </p>
        </div>

        {/* Direct Phone Call Strip */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
              Direct Sales & Support Line
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
              +91 81318 38253
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Monday to Saturday: 9:00 AM – 8:00 PM IST
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+918131838253"
              className="px-6 py-3 rounded-xl bg-[#0B1F33] hover:bg-[#2563EB] text-white font-bold text-sm transition-colors"
            >
              Call +91 81318 38253
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* Two-Column Plan & Dispatch Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* Left: What services do you need? */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B1F33] mb-1">
                1. Select what you want to setup
              </h2>
              <p className="text-xs text-slate-500">
                Click to pick the tools you need for your counselors and teachers.
              </p>
            </div>

            <div className="space-y-3">
              {SERVICES_CATALOG.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-[#2563EB]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-[#0B1F33]">
                          {service.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {service.summary}
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-sm border shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Team Size */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                2. How many counselors or staff will use this?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEAM_SIZES.map((size) => {
                  const isSelected = selectedTeamSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedTeamSize(size)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#0B1F33] border-[#0B1F33] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Institute Name & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Institute Name (Optional)
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Apex Classes"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Current Software or Problems (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Using Excel sheets right now"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Right: WhatsApp Forwarding Box */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div>
              <div className="font-bold text-sm text-[#0B1F33]">
                Ready to talk?
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send your selected setup to our WhatsApp number (+91 81318 38253). We will reply within 10 minutes.
              </p>
            </div>

            {/* Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-line text-slate-700 leading-relaxed">
              {whatsappMessage}
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm text-center block transition-colors shadow-sm"
            >
              Send on WhatsApp (+91 81318 38253)
            </a>

            <div className="pt-3 border-t border-slate-100 text-center">
              <a
                href="tel:+918131838253"
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Or Call Us at +91 81318 38253
              </a>
            </div>
          </div>

        </div>

        {/* Clear, Readable Service Overviews for Sales Leads */}
        <div className="pt-10 border-t border-slate-200 space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0B1F33]">
              Simple Breakdown of Our Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Everything your sales and counseling team needs to know, in plain English.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">
                Android Call Tracker App
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Counselors install the app on their phone. When they make or receive calls with students, the duration is recorded automatically. When the call ends, a small popup asks them to tag the student (like &quot;Interested&quot;, &quot;Call Back Tomorrow&quot;, or &quot;Admitted&quot;). No manual Excel entry.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">
                Counselor Lead Management (CRM)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whenever a student fills a form on your website, Facebook ads, or Google, their details show up on the counselor screen immediately. Leads are divided evenly among counselors so everyone gets calls to make.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">
                WhatsApp Follow-Up & Fee Reminders
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send course brochures and demo meeting reminders directly to the student&apos;s WhatsApp. When fees are due, the system sends an automatic payment link so parents can pay via Google Pay, PhonePe, or UPI in seconds.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-sm text-[#0B1F33]">
                Anti-Piracy Video Protection (LMS)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your class recordings are protected. If a student tries to record their screen or share their login, their full name and roll number appear visibly floating across the video, stopping video leaks and piracy.
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
