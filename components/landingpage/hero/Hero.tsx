'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Aurora from './Aurora';
import BookDemoButton from '../shared/BookDemoButton';

const InteractiveAppWorkspace = dynamic(() => import('./InteractiveAppWorkspace'), {
  ssr: true,
});

export default function Hero() {
  return (
    <section className="relative w-full flex flex-col justify-start overflow-hidden bg-white text-[#0B1F33] px-4 xs:px-6 sm:px-12 md:px-20 lg:px-28 pt-28 sm:pt-32 pb-16 sm:pb-20 selection:bg-[#2563EB] selection:text-white">
      {/* Seamless Smoothly Blended Aurora Shader Layer */}
      <div 
        className="absolute inset-x-0 top-0 h-[750px] sm:h-[950px] lg:h-[1100px] z-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_95%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_95%)]"
      >
        <Aurora
          colorStops={['#2563EB', '#38BDF8', '#0047FF']}
          amplitude={1.1}
          blend={0.6}
          speed={0.8}
        />
        {/* Soft bottom gradient overlay for seamless merge into white page */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </div>

      {/* Main Hero Headline & Capsule Button (Original Signature Layout) */}
      <div className="relative z-10 max-w-4xl py-2 sm:py-8">
        {/* Line 1 & 2: A NEW ERA BEGINS */}
        <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8">
          <h1 className="font-extrabold text-[32px] xs:text-[42px] sm:text-[68px] md:text-[86px] lg:text-[102px] tracking-[-0.035em] leading-[1.05] sm:leading-[1.02] text-[#0B1F33]">
            A NEW <span className="text-[#2563EB] font-extrabold transition-colors duration-200">ERA</span>
            <br />
            BEGINS
          </h1>
        </div>

        {/* Line 3 & 4: OF GROWTH AND RELIABILITY. */}
        <div className="space-y-1 sm:space-y-2 mb-6 sm:mb-8">
          <p className="font-bold text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-[32px] tracking-[0.10em] sm:tracking-[0.18em] uppercase text-[#0B1F33] leading-snug">
            OF <span className="text-[#2563EB]">GROWTH</span> AND
          </p>
          <p className="font-bold text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-[32px] tracking-[0.10em] sm:tracking-[0.18em] uppercase leading-snug">
            <span className="text-[#2563EB]">RELIABILITY</span>
            <span className="text-[#0B1F33]">.</span>
          </p>
        </div>

        {/* High-Intent SEO Sub-headline */}
        <p className="text-xs sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed mb-6 sm:mb-10">
          The all-in-one customized operating system engineered for academies, coaching institutes, and bootcamps. Unified lead conversion CRM, DRM video LMS, high-speed websites, and automated WhatsApp workflows.
        </p>

        {/* Capsule "Book a Demo" CTA Button */}
        <div>
          <BookDemoButton text="Book a Demo" href="/book-demo" />
        </div>
      </div>

      {/* Interactive Mac Window Tabs Workspace */}
      <div className="relative z-10 w-full mt-8 sm:mt-14">
        <InteractiveAppWorkspace />
      </div>
    </section>
  );
}
