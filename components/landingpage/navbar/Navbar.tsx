'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeeyakuLogo from '../shared/HeeyakuLogo';
import { Layers, Cpu, Globe, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { Show, UserButton } from '@clerk/nextjs';

const ICONS = {
  hamburger: 'M4 6h16M4 12h16M4 18h16',
  cross: 'M18 6L6 18M6 6l12 12',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
};



export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 ease-out ${
        mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-md'
          : scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.04)]'
          : 'bg-white/70 backdrop-blur-md border-b border-slate-200/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="group flex items-center transition-transform duration-160 ease-out active:scale-[0.97] text-[#0B1F33]">
          <HeeyakuLogo
            size={36}
            color="currentColor"
            dotColor="#2563EB"
            withText={true}
            withTagline={true}
            textColor="currentColor"
            taglineColor="currentColor"
          />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Solutions Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#0B1F33] hover:text-[#2563EB] transition-colors duration-150 rounded-lg hover:bg-slate-100 active:scale-[0.97]"
            >
              <span>Solutions</span>
              <MorphIcon
                icon={solutionsOpen ? ICONS.chevronUp : ICONS.chevronDown}
                size={14}
                color={solutionsOpen ? "#2563EB" : "#94A3B8"}
                strokeWidth={2.2}
                spring="snappy"
              />
            </button>

            <AnimatePresence>
              {solutionsOpen && (
                <motion.div
                  initial={{ opacity: 0, transform: 'scale(0.95)', originY: 0, originX: 0 }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={{ opacity: 0, transform: 'scale(0.95)' }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 w-72 pt-2 z-50"
                >
                  <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 p-3 shadow-2xl space-y-1 text-[#0B1F33]">
                    <Link
                      href="/solutions/crm"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0B1F33]">Custom CRM & LMS</div>
                        <div className="text-[11px] text-slate-500">Built specifically for e-learning scale</div>
                      </div>
                    </Link>

                    <Link
                      href="/solutions/automation"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0B1F33]">End-to-End Automation</div>
                        <div className="text-[11px] text-slate-500">Eliminate operational leakage</div>
                      </div>
                    </Link>

                    <Link
                      href="/solutions/web"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0B1F33]">High-Converting Web</div>
                        <div className="text-[11px] text-slate-500">Next-gen performance interfaces</div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/platform"
            className="px-3.5 py-2 text-sm font-semibold text-[#0B1F33]/85 hover:text-[#2563EB] transition-colors duration-150 rounded-lg hover:bg-slate-100 active:scale-[0.97]"
          >
            Platform
          </Link>

          {/* Resources Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#0B1F33]/85 hover:text-[#2563EB] transition-colors duration-150 rounded-lg hover:bg-slate-100 active:scale-[0.97]"
            >
              <span>Resources</span>
              <MorphIcon
                icon={resourcesOpen ? ICONS.chevronUp : ICONS.chevronDown}
                size={14}
                color={resourcesOpen ? "#2563EB" : "#94A3B8"}
                strokeWidth={2.2}
                spring="snappy"
              />
            </button>

            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, transform: 'scale(0.95)', originY: 0, originX: 0 }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={{ opacity: 0, transform: 'scale(0.95)' }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 w-56 pt-2 z-50"
                >
                  <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 p-2.5 shadow-2xl space-y-1 text-[#0B1F33]">
                    <Link
                      href="/resources/case-studies"
                      className="block px-3 py-2 text-xs font-semibold text-[#0B1F33] hover:text-[#2563EB] hover:bg-slate-100 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Case Studies
                    </Link>
                    <Link
                      href="/resources/docs"
                      className="block px-3 py-2 text-xs font-semibold text-[#0B1F33] hover:text-[#2563EB] hover:bg-slate-100 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Documentation
                    </Link>
                    <Link
                      href="/resources/blog"
                      className="block px-3 py-2 text-xs font-semibold text-[#0B1F33] hover:text-[#2563EB] hover:bg-slate-100 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Insights & Blog
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/pricing"
            className="px-3.5 py-2 text-sm font-semibold text-[#0B1F33]/85 hover:text-[#2563EB] transition-colors duration-150 rounded-lg hover:bg-slate-100 active:scale-[0.97]"
          >
            Pricing
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Download App CTA */}
          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/90 hover:bg-blue-100 border border-blue-200/60 rounded-full transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App</span>
          </Link>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold tracking-wider uppercase text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-full transition-[background-color,transform,box-shadow] duration-180 ease-out shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
            >
              Sign In
            </Link>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3 pl-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-full transition-all duration-150 shadow-xs hover:shadow-sm active:scale-[0.97]"
              >
                Dashboard
              </Link>
              <UserButton />
            </div>
          </Show>
        </div>

        {/* Mobile MorphIcon Hamburger <-> Cross Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-[#0B1F33] hover:bg-slate-100 transition-colors duration-150 focus:outline-none active:scale-[0.95]"
            aria-label="Toggle Navigation Menu"
          >
            <MorphIcon
              icon={mobileMenuOpen ? ICONS.cross : ICONS.hamburger}
              size={22}
              color="currentColor"
              strokeWidth={2.4}
              spring="bouncy"
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-white text-[#0B1F33] border-b border-slate-200 px-6 pt-2 pb-8 space-y-4 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col space-y-2">
              <Link
                href="/solutions/crm"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-[#0B1F33] hover:bg-slate-100 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Solutions
              </Link>
              <Link
                href="/platform"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-[#0B1F33] hover:bg-slate-100 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Platform
              </Link>
              <Link
                href="/resources/case-studies"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-[#0B1F33] hover:bg-slate-100 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Resources
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-[#0B1F33] hover:bg-slate-100 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Pricing
              </Link>
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-bold text-[#2563EB] bg-blue-50/90 hover:bg-blue-100 transition-colors duration-150 active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download Mobile App (APK)</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">

              <div className="pt-1">
                <Show when="signed-out">
                  <div>
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-full shadow-sm active:scale-[0.97] transition-all duration-150 cursor-pointer"
                    >
                      Sign In
                    </Link>
                  </div>
                </Show>

                <Show when="signed-in">
                  <div className="space-y-2">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#0B1F33] hover:bg-[#2563EB] rounded-full shadow-sm active:scale-[0.97] transition-all duration-150"
                    >
                      Go to Dashboard
                    </Link>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-[#0B1F33]">Account</span>
                      <UserButton />
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
