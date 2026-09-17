'use client';

import React from 'react';
import BookDemoButton from './BookDemoButton';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative w-full bg-[#F8FAFC] py-24 lg:py-32 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white overflow-hidden border-t border-slate-200/80">
      {/* Background Radial Core Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-200/50 via-cyan-200/40 to-indigo-200/50 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 text-center">
        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1F33] leading-tight mb-6">
          Build a System Your <br className="hidden sm:inline" />
          <span className="text-[#2563EB]">
            Growth Can Depend On.
          </span>
        </h2>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-10">
          Stop losing leads to disconnected spreadsheets and fragmented software. Schedule an architecture consultation to see how Heeyaku scales your academy.
        </p>

        {/* Actions Button */}
        <div className="flex items-center justify-center">
          <BookDemoButton text="Book a Demo" href="#book-demo" />
        </div>
      </div>
    </section>
  );
}
