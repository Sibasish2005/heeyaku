'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import BookDemoButton from '@/components/landingpage/shared/BookDemoButton';
import { 
  BookOpen, 
  Terminal, 
  Code2, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound,
  Copy,
  Check,
  Smartphone,
  Cpu
} from 'lucide-react';

export default function DocsPage() {
  const [copied, setCopied] = useState(false);

  const sampleSyncPayload = `POST /api/employee/calls/sync
Authorization: Bearer <HMAC_SHA256_TOKEN>
Content-Type: application/json

{
  "calls": [
    {
      "phoneNumber": "+919876543210",
      "durationSeconds": 245,
      "connected": true,
      "outcomeId": "interested",
      "outcomeLabel": "Interested in Batch",
      "notes": "Student requested fee structure",
      "startedAt": 1726650000000
    }
  ]
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleSyncPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33] selection:bg-[#2563EB] selection:text-white flex flex-col overflow-hidden">
      <Navbar />

      {/* Ambient Aurora Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-r from-blue-100/50 via-sky-100/40 to-indigo-100/40 blur-[140px] pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>DEVELOPER ARCHITECTURE & APIS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#0B1F33] leading-[1.08] mb-6">
            Engineered for Developers. <br />
            <span className="text-[#2563EB]">Documented for Scale</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Integrate custom webhooks, mobile call logs, and CRM lead distribution pipelines with HEEYAKU's collocated Mumbai APIs.
          </p>
        </div>

        {/* Technical Architecture Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* Left Navigation / Overview */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border border-slate-200/90 bg-[#F8FAFC]/70 backdrop-blur-md space-y-4">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                CORE SPECIFICATIONS
              </div>
              <ul className="space-y-3 text-xs font-medium text-slate-600">
                <li className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span>API Base URL</span>
                  <span className="font-mono text-[#2563EB] font-bold">/api/employee</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span>Auth Protocol</span>
                  <span className="font-mono text-emerald-600 font-bold">HMAC-SHA256</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span>Latency Target</span>
                  <span className="font-mono text-[#0B1F33] font-bold">&lt; 25ms (Mumbai)</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span>Rate Limiting</span>
                  <span className="font-mono text-indigo-600 font-bold">Sliding Window</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-sm text-[#0B1F33] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Security Assurance</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Token signatures are validated with constant-time equality checks (<code className="text-[#2563EB] font-mono">crypto.timingSafeEqual</code>) preventing side-channel attacks.
              </p>
            </div>
          </div>

          {/* Right Code Block Canvas */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl overflow-hidden font-mono">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs text-slate-400">batch_call_sync.http</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-slate-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-6 text-xs sm:text-sm text-slate-300 overflow-x-auto leading-relaxed">
                <pre>{sampleSyncPayload}</pre>
              </div>

              <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Returns HTTP 200 with synced IDs and resolved lead status</span>
                <span className="text-emerald-400">JSON Schema Validated</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="p-10 sm:p-12 rounded-3xl bg-[#0B1F33] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Need custom webhook or ERP architecture?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Our engineering team provides dedicated webhook integration assistance.
            </p>
          </div>
          <div>
            <BookDemoButton text="Book a Demo" href="/book-demo" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
