'use client';

import React from 'react';
import BookDemoButton from '../shared/BookDemoButton';

export default function FinalCTA() {
  return (
    <section className="relative w-full bg-[#0B1F33] text-white py-20 lg:py-28 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center space-y-6">
        <p className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider">
          Ready to scale your admissions?
        </p>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Give Your Counseling Team a System They Can Rely On.
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
          Stop losing inquiries to scattered spreadsheets. Call us directly or schedule an interactive walkthrough of the HEEYAKU platform.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <BookDemoButton text="Book a Demo" href="/book-demo" />
          <a
            href="tel:+918131838253"
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wider uppercase transition-colors border border-white/20"
          >
            Call: +91 81318 38253
          </a>
        </div>
      </div>
    </section>
  );
}
