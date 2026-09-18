'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { 
  Calendar, Clock, ShieldCheck, CheckCircle2, 
  Smartphone, ArrowRight, Sparkles, Building2, 
  Mail, Phone, User, Users, Check, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_SLOTS = [
  '10:00 AM - 10:45 AM IST',
  '02:00 PM - 02:45 PM IST',
  '04:30 PM - 05:15 PM IST',
  '06:30 PM - 07:15 PM IST',
];

const TEAM_SIZES = [
  '1 - 5 Counselors',
  '6 - 15 Counselors',
  '16 - 50 Counselors',
  '50+ Counselors (Enterprise)',
];

const FOCUS_AREAS = [
  { id: 'calltracker', label: 'Android CallTracker & Offline Sync', desc: 'Automatic call recording, zero-leakage dialer, counselor dispositions' },
  { id: 'crm', label: 'Inbound CRM & Sub-60s Routing', desc: 'Meta/Google webhook ingestion, round-robin rules, SLA escalations' },
  { id: 'whatsapp', label: 'WhatsApp Cloud API Drip Bots', desc: 'Automated 2-way nurture flows, fee reminder links, template verification' },
  { id: 'fullstack', label: 'Full Operating System Bundle', desc: 'Unified CRM, DRM video LMS, high-speed portals, and custom automations' },
];

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institute: '',
    teamSize: TEAM_SIZES[1],
    primaryInterest: FOCUS_AREAS[0].label,
    preferredSlot: TIME_SLOTS[1],
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit demo request.');
      }

      setBookingRef(data.bookingId);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="relative pt-32 pb-24 px-6 sm:px-10 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none" />

        {/* Header Badge & Title */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-mono font-bold text-[#2563EB] mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span>ARCHITECTURE CONSULTATION & PRODUCT DEMO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-tight mb-5">
            See HEEYAKU Live in Action. <br />
            <span className="text-[#2563EB]">Built for Your Academy.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            Schedule a focused 30-minute technical walkthrough with an infrastructure specialist. Inspect the native Android telephony client, test real-time lead routing, and review your migration plan.
          </p>
        </div>

        {/* 2-Column Canvas */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: What you'll experience & Direct Contacts */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Consultation Scope Box */}
            <div className="p-8 rounded-3xl bg-[#F8FAFC]/80 border border-slate-200/90 shadow-sm space-y-6">
              <h2 className="text-xl font-extrabold text-[#0B1F33] tracking-tight">
                What Happens in the 30-Minute Session
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F33]">Live Android CallTracker Walkthrough</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We simulate a live incoming/outgoing counselor call, inspect automatic timestamp capture, and review the post-call disposition prompt with offline SQLite queue.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F33]">Sub-60s Speed-to-Lead Test</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Submit a test inquiry live from your browser and watch the sub-second webhook handoff route the lead to an active counselor with SLA timers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1F33]">Tailored Architecture & Migration Audit</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Review your existing spreadsheet or legacy software setup and receive a 14-day zero-downtime data migration blueprint with exact team tier pricing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified SLA guarantee */}
              <div className="pt-5 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Collocated Mumbai Tier (`ap-south-1`)</span>
                </span>
                <span className="text-[#2563EB] font-bold">Zero Sales Fluff</span>
              </div>
            </div>

            {/* Direct Support Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                NEED IMMEDIATE ARCHITECTURE ANSWERS?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-500 block font-medium">Engineering Desk</span>
                  <a href="mailto:support@heeyaku.com" className="font-mono font-bold text-[#2563EB] hover:underline mt-0.5 block">
                    support@heeyaku.com
                  </a>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-500 block font-medium">Direct Telephone / WhatsApp</span>
                  <span className="font-mono font-bold text-[#0B1F33] mt-0.5 block">
                    +91 98765 43210
                  </span>
                </div>
              </div>
            </div>

            {/* Direct APK Link Reminder */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-[#2563EB]" />
                <div className="text-xs">
                  <span className="font-bold text-[#0B1F33] block">Want to test the APK right now?</span>
                  <span className="text-slate-600">Download the Android client directly onto your device.</span>
                </div>
              </div>
              <Link
                href="/download"
                className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-200 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition-colors shadow-xs shrink-0"
              >
                Download APK
              </Link>
            </div>

          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.03)]">
              
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
                      <Check className="w-8 h-8 stroke-[2.5]" />
                    </div>

                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                        DEMO REQUEST CONFIRMED
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
                        We look forward to meeting with you, {formData.name.split(' ')[0]}!
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                        Your architecture walkthrough for <span className="font-bold text-[#0B1F33]">{formData.institute}</span> has been logged. Our solutions team will send calendar invites directly to <span className="font-mono text-[#2563EB]">{formData.email}</span>.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs font-mono space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>REFERENCE ID:</span>
                        <span className="font-bold text-[#0B1F33]">{bookingRef}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>PREFERRED DATE:</span>
                        <span className="text-slate-800 font-semibold">{formData.preferredDate}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>SELECTED WINDOW:</span>
                        <span className="text-slate-800 font-semibold">{formData.preferredSlot}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>FOCUS AREA:</span>
                        <span className="text-[#2563EB] font-bold">{formData.primaryInterest}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Link
                        href="/download"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Download Android APK</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            institute: '',
                            teamSize: TEAM_SIZES[1],
                            primaryInterest: FOCUS_AREAS[0].label,
                            preferredSlot: TIME_SLOTS[1],
                            preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            notes: '',
                          });
                        }}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                      >
                        Book Another Session
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form key="booking-form" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight">
                        Reserve Your 30-Minute Consultation
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                        Fill in your details below to schedule your personalized product walkthrough.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    {/* Full Name & Work Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Dr. Rajesh Verma"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Work Email *</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="rajesh@apexclasses.in"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone/WhatsApp & Institute Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone / WhatsApp *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Institute / Academy Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.institute}
                          onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                          placeholder="Apex Career Institute"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                        />
                      </div>
                    </div>

                    {/* Team Size */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Counseling & Sales Team Size</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TEAM_SIZES.map((size) => {
                          const isSelected = formData.teamSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setFormData({ ...formData, teamSize: size })}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary Interest */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Primary System Requirement
                      </label>
                      <div className="space-y-2">
                        {FOCUS_AREAS.map((fa) => {
                          const isSelected = formData.primaryInterest === fa.label;
                          return (
                            <div
                              key={fa.id}
                              onClick={() => setFormData({ ...formData, primaryInterest: fa.label })}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50/90 border-[#2563EB] shadow-xs'
                                  : 'bg-white border-slate-200/90 hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <div className="text-xs font-extrabold text-[#0B1F33]">{fa.label}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{fa.desc}</div>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                isSelected ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Date & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Preferred Date</span>
                        </label>
                        <input
                          type="date"
                          value={formData.preferredDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Time Window</span>
                        </label>
                        <select
                          value={formData.preferredSlot}
                          onChange={(e) => setFormData({ ...formData, preferredSlot: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Current Software Stack or Specific Needs (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="e.g. Currently tracking 8 telecallers on Google Sheets. Need automatic call duration logs."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <span>Confirm Architecture Consultation</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-600 text-center font-medium">
                      No pushy sales reps. You will be speaking directly with an engineer or solutions architect.
                    </p>
                  </form>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
