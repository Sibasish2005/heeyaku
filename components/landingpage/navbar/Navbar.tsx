'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeeyakuLogo from '../shared/HeeyakuLogo';
import { Layers, Cpu, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import ThemeToggler from '@/components/ThemeToggler';

const ICONS = {
  hamburger: 'M4 6h16M4 12h16M4 18h16',
  cross: 'M18 6L6 18M6 6l12 12',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
};

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

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
          ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-md'
          : scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border shadow-[0_4px_30px_rgba(0,0,0,0.04)]'
          : 'bg-background/60 backdrop-blur-md border-b border-border/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="group flex items-center transition-transform duration-160 ease-out active:scale-[0.97] text-foreground">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground/85 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors duration-150 rounded-lg hover:bg-muted/60 active:scale-[0.97]"
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
                  <div className="bg-card/95 backdrop-blur-2xl rounded-2xl border border-border p-3 shadow-2xl space-y-1 text-card-foreground">
                    <Link
                      href="#crm"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Custom CRM & LMS</div>
                        <div className="text-[11px] text-muted-foreground">Built specifically for e-learning scale</div>
                      </div>
                    </Link>

                    <Link
                      href="#automation"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">End-to-End Automation</div>
                        <div className="text-[11px] text-muted-foreground">Eliminate operational leakage</div>
                      </div>
                    </Link>

                    <Link
                      href="#web"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors duration-150 group active:scale-[0.98]"
                    >
                      <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-150">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">High-Converting Web</div>
                        <div className="text-[11px] text-muted-foreground">Next-gen performance interfaces</div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="#platform"
            className="px-3.5 py-2 text-sm font-semibold text-foreground/85 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors duration-150 rounded-lg hover:bg-muted/60 active:scale-[0.97]"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground/85 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors duration-150 rounded-lg hover:bg-muted/60 active:scale-[0.97]"
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
                  <div className="bg-card/95 backdrop-blur-2xl rounded-2xl border border-border p-2.5 shadow-2xl space-y-1 text-card-foreground">
                    <Link
                      href="#case-studies"
                      className="block px-3 py-2 text-xs font-semibold text-foreground hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-muted/60 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Case Studies
                    </Link>
                    <Link
                      href="#docs"
                      className="block px-3 py-2 text-xs font-semibold text-foreground hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-muted/60 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Documentation
                    </Link>
                    <Link
                      href="#blog"
                      className="block px-3 py-2 text-xs font-semibold text-foreground hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-muted/60 rounded-lg transition-colors duration-150 active:scale-[0.98]"
                    >
                      Insights & Blog
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="#pricing"
            className="px-3.5 py-2 text-sm font-semibold text-foreground/85 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors duration-150 rounded-lg hover:bg-muted/60 active:scale-[0.97]"
          >
            Pricing
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150 active:scale-[0.97]"
          >
            <GithubIcon className="w-4 h-4 text-foreground" />
            <span>Star Us</span>
          </Link>

          <ThemeToggler />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-xs font-bold tracking-wider text-foreground hover:text-[#2563EB] px-3 py-1.5 transition-colors duration-150 uppercase active:scale-[0.97] cursor-pointer"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold tracking-wider uppercase text-white bg-[#0B1F33] dark:bg-primary dark:text-primary-foreground hover:bg-[#2563EB] dark:hover:bg-blue-600 rounded-full transition-[background-color,transform,box-shadow] duration-180 ease-out shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3 pl-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase text-white bg-[#0B1F33] dark:bg-primary dark:text-primary-foreground hover:bg-[#2563EB] dark:hover:bg-blue-600 rounded-full transition-all duration-150 shadow-xs hover:shadow-sm active:scale-[0.97]"
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
            className="p-2.5 rounded-xl text-foreground hover:bg-muted/80 transition-colors duration-150 focus:outline-none active:scale-[0.95]"
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
            className="md:hidden bg-card text-card-foreground border-b border-border px-6 pt-2 pb-8 space-y-4 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col space-y-2">
              <Link
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-foreground hover:bg-muted/60 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Solutions
              </Link>
              <Link
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-foreground hover:bg-muted/60 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Platform
              </Link>
              <Link
                href="#resources"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-foreground hover:bg-muted/60 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Resources
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-semibold text-foreground hover:bg-muted/60 hover:text-[#2563EB] transition-colors duration-150 active:scale-[0.98]"
              >
                Pricing
              </Link>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-3">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-foreground bg-muted/60 hover:bg-muted rounded-xl active:scale-[0.98] transition-colors duration-150"
              >
                <GithubIcon className="w-4 h-4 text-foreground" />
                <span>Star Us on GitHub</span>
              </Link>
              
              <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border">
                <span className="text-xs font-semibold text-foreground">Theme</span>
                <ThemeToggler showLabels />
              </div>

              <div className="pt-1">
                <Show when="signed-out">
                  <div className="grid grid-cols-2 gap-3">
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider text-foreground border border-border rounded-full hover:bg-muted/60 active:scale-[0.97] transition-colors duration-150 cursor-pointer"
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#0B1F33] dark:bg-primary dark:text-primary-foreground hover:bg-[#2563EB] rounded-full shadow-sm active:scale-[0.97] transition-all duration-150 cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </Show>

                <Show when="signed-in">
                  <div className="space-y-2">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#0B1F33] dark:bg-primary dark:text-primary-foreground hover:bg-[#2563EB] rounded-full shadow-sm active:scale-[0.97] transition-all duration-150"
                    >
                      Go to Dashboard
                    </Link>
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                      <span className="text-xs font-semibold text-foreground">Account</span>
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
