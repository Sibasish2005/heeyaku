'use client';

import React from 'react';
import Link from 'next/link';
import HeeyakuLogo from '../shared/HeeyakuLogo';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#071320] text-slate-400 text-xs selection:bg-[#2563EB] selection:text-white py-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-8">
        
        {/* Top: Brand Identity & Essential Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
              Enterprise Telephony Sales CRM & Lead Acceleration Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 font-medium text-xs text-slate-300">
            <Link href="/solutions/crm" className="hover:text-white transition-colors">Solutions</Link>
            <Link href="/solutions/crm/agartala" className="hover:text-white transition-colors">Agartala Hub</Link>
            <Link href="/platform" className="hover:text-white transition-colors">Platform</Link>
            <Link href="/download" className="hover:text-white transition-colors text-[#38BDF8] font-bold">Calling App</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/resources/blog" className="hover:text-white transition-colors">Insights & Guides</Link>
            <Link href="/book-demo" className="hover:text-white transition-colors">Book a Demo</Link>
            <a href="mailto:admin@heeyaku.com" className="hover:text-[#38BDF8] transition-colors">admin@heeyaku.com</a>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>© 2026 HEEYAKU Technologies. All rights reserved.</span>
          </div>
        </div>

        {/* Legal Disclaimers & Regulatory Notices */}
        <div className="pt-6 border-t border-slate-800/60 text-[11px] text-slate-400 leading-relaxed space-y-3">
          <p>
            <strong>Legal & Trademark Notice:</strong> All product names, trademarks, registered trademarks, service marks, and brand logos mentioned on this platform (including Zoho®, LeadSquared®, TeleCRM®, Exotel®, Twilio®, Insyssky®, and Hembro Infotech®) are the intellectual property of their respective owners. Any reference to third-party names, products, or service providers is made strictly for comparative, educational, and nominative identification purposes under Indian trademark law (Nominative Fair Use) and does not constitute or imply any affiliation, sponsorship, endorsement, or commercial association.
          </p>
          <p>
            <strong>Telecommunication & Data Privacy Notice:</strong> HEEYAKU operates solely as an enterprise sales workflow management and telephony telemetry platform. HEEYAKU does not record, intercept, tap, or store audio conversations. All SIM-based calling functions utilize the user&apos;s existing carrier network. Subscribing organizations and employers are solely responsible for ensuring that all outbound communication, calling hours, and customer outreach comply with the Telecom Regulatory Authority of India (TRAI) Do-Not-Disturb (DND) regulations, the Digital Personal Data Protection (DPDP) Act 2023, and applicable local labor and consumer communication laws.
          </p>
        </div>

      </div>
    </footer>
  );
}
