'use client';

import React from 'react';
import Link from 'next/link';
import HeeyakuLogo from './HeeyakuLogo';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#071320] text-slate-400 text-xs selection:bg-[#2563EB] selection:text-white py-10 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand Identity & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <HeeyakuLogo
              size={26}
              color="#FFFFFF"
              dotColor="#38BDF8"
              withText={true}
              withTagline={false}
              textColor="#FFFFFF"
            />
          </Link>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-slate-400 font-medium text-xs">
            Unified OS for E-Learning & Training Academies
          </span>
        </div>

        {/* Center: Essential Navigation Links */}
        <div className="flex items-center gap-6 sm:gap-8 font-medium text-xs text-slate-300">
          <Link href="#platform" className="hover:text-white transition-colors">Platform</Link>
          <Link href="#integrations" className="hover:text-white transition-colors">Integrations</Link>
          <Link href="#roi" className="hover:text-white transition-colors">ROI Calculator</Link>
          <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* Right: Operational System Status Pill & Copyright */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-emerald-400 font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>99.98% SLA</span>
          </div>
          <span className="text-slate-400">© 2026 Heeyaku Inc.</span>
        </div>

      </div>
    </footer>
  );
}
