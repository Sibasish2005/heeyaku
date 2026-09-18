import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landingpage/navbar/Navbar';
import Footer from '@/components/landingpage/footer/Footer';
import { TrendingUp, ArrowRight, CheckCircle2, Award, Building2 } from 'lucide-react';

export const metadata = {
  title: 'Client Case Studies & ROI Benchmarks | HEEYAKU',
  description: 'See how leading coaching academies and bootcamps increased lead conversion by 3.4x and eliminated revenue leakage with HEEYAKU.',
};

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070F1A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Proven Student ROI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white mb-6">
            Client Success & <span className="text-[#2563EB]">ROI Case Studies</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Real outcomes from e-learning academies, test prep institutes, and full-stack bootcamps that replaced fragmented tools with HEEYAKU.
          </p>
        </div>

        {/* Case Study Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-4">
                <Building2 className="w-4 h-4" />
                <span>Apex Engineering Institute</span>
              </div>
              <h3 className="text-xl font-bold text-[#0B1F33] dark:text-white mb-3">
                3.8x Increase in Connected Call Conversion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Prior to HEEYAKU, counselors were double-dialing leads and losing track of webinar attendees. Enforcing single-connected-call watermarking and sub-60s instant dialing slashed drop-off.
              </p>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 mb-6">
                <div>
                  <div className="text-2xl font-black text-[#2563EB]">+240%</div>
                  <div className="text-xs text-slate-500">Webinar Show-ups</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-500">38 mins</div>
                  <div className="text-xs text-slate-500">Avg. Talk Time / Rep</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 italic">"HEEYAKU replaced 4 disconnected subscriptions with one bulletproof system."</div>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1726] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">
                <Award className="w-4 h-4" />
                <span>NextGen Coding Academy</span>
              </div>
              <h3 className="text-xl font-bold text-[#0B1F33] dark:text-white mb-3">
                Zero Video Piracy & 45% Lower CAC
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                NextGen implemented HEEYAKU's DRM encrypted LMS and automated WhatsApp installment reminder engine, recovering ₹22 Lakhs in overdue student fees in 60 days.
              </p>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 mb-6">
                <div>
                  <div className="text-2xl font-black text-[#2563EB]">100%</div>
                  <div className="text-xs text-slate-500">Piracy Protection</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-500">₹22L+</div>
                  <div className="text-xs text-slate-500">Recovered Revenue</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 italic">"The offline Android app synchronization alone saved our telecallers hundreds of hours."</div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F33] to-[#1E3A8A] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-bold mb-2">Want to see your academy's projected numbers?</h3>
            <p className="text-sm text-blue-200 max-w-xl">We will prepare a custom ROI analysis based on your current lead volume.</p>
          </div>
          <Link
            href="/#book-demo"
            className="px-6 py-3.5 text-sm font-bold text-[#0B1F33] bg-white hover:bg-blue-50 rounded-full transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            <span>Request Custom ROI Model</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
