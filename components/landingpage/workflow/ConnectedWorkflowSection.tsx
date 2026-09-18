'use client';

import React, { useState } from 'react';
import AccordionGallery, { AccordionGalleryItem } from './AccordionGallery';

const JOURNEY_ITEMS: (AccordionGalleryItem & {
  id: string;
  step: string;
  shortTitle: string;
  title: string;
  desc: string;
  bullets: string[];
  image: string;
  metric: string;
  metricLabel: string;
})[] = [
  {
    id: 'step-1',
    step: '01',
    label: '01. Instant Lead Capture',
    shortTitle: 'Capture',
    description: 'Inquiries from Facebook, Google & your website arrive in under 60 seconds.',
    title: 'Lead Capture From All Sources',
    desc: 'When a prospective student fills out a form on Facebook Ads, Google Ads, or your website, their contact details land directly into your central admission dashboard with zero data loss.',
    bullets: [
      'Captures name, phone number, city, and course of interest.',
      'Tracks which ad campaign or marketing channel generated the student inquiry.',
      'Filters out duplicate leads automatically.',
    ],
    metric: '< 60s',
    metricLabel: 'Capture Speed',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=75',
    alt: 'Lead Ingestion',
  },
  {
    id: 'step-2',
    step: '02',
    label: '02. Counselor Distribution',
    shortTitle: 'Route',
    description: 'Fair lead allocation to counselors with automatic call reminders.',
    title: 'Direct Assignment to Counselors',
    desc: 'New leads are assigned fairly across your admission team based on availability or language preference so every prospective student gets a fast callback.',
    bullets: [
      'Fair round-robin sharing prevents counselor disputes over good leads.',
      'Counselors receive an instant notification on their Android phone to dial.',
      'Managers can monitor how fast each counselor calls new inquiries.',
    ],
    metric: '1.4 Min',
    metricLabel: 'Average First Dial',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=640&q=75',
    alt: 'Counselor Routing',
  },
  {
    id: 'step-3',
    step: '03',
    label: '03. WhatsApp Follow-Ups',
    shortTitle: 'Follow-Up',
    description: 'Automated brochures, demo class invites & fee structures on WhatsApp.',
    title: 'Automated WhatsApp Communication',
    desc: 'Keep students warm after the initial call. Send official course curriculum PDFs, faculty introductions, and demo class reminders directly on WhatsApp.',
    bullets: [
      'Course brochure delivered automatically as soon as the inquiry arrives.',
      'Automated reminder message sent 1 hour before scheduled demo classes.',
      'Counselors can send personalized WhatsApp updates in one tap.',
    ],
    metric: '98%',
    metricLabel: 'WhatsApp Delivery',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=640&q=75',
    alt: 'WhatsApp Follow-Ups',
  },
  {
    id: 'step-4',
    step: '04',
    label: '04. Instant Fee Payment',
    shortTitle: 'Enroll',
    description: '1-tap UPI payment links with instant fee receipts on WhatsApp.',
    title: 'Simple UPI & Card Fee Collection',
    desc: 'Close admissions faster by sending parents a direct payment link via WhatsApp. Supports PhonePe, Google Pay, Paytm, credit cards, and split installments.',
    bullets: [
      'Parents pay in seconds through their preferred UPI app.',
      'Official branded fee receipt generated and sent instantly.',
      'Student account and batch access unlocked immediately upon payment.',
    ],
    metric: 'Instant',
    metricLabel: 'Fee Receipt',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=75',
    alt: 'Fee Collection',
  },
  {
    id: 'step-5',
    step: '05',
    label: '05. Protected Classes & Attendance',
    shortTitle: 'Learn',
    description: 'Anti-piracy lecture portal with dynamic watermark protection.',
    title: 'Lecture Portal & Student Retention',
    desc: 'Students log in to watch high-definition class recordings and attend live sessions. Every video displays the student phone number on screen to prevent piracy.',
    bullets: [
      'Dynamic on-screen watermarking stops screen recording and Telegram leaks.',
      'Tracks student lecture completion and attendance automatically.',
      'Send automated WhatsApp notifications to parents if students miss classes.',
    ],
    metric: '100%',
    metricLabel: 'Anti-Piracy',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=640&q=75',
    alt: 'Student Learning',
  },
];

export default function ConnectedWorkflowSection() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);
  const activeStep = JOURNEY_ITEMS[activeStepIndex];

  return (
    <section 
      id="workflow"
      className="relative w-full bg-[#FAFCFF] py-16 lg:py-24 text-[#0B1F33] selection:bg-[#2563EB] selection:text-white border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
        
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider mb-2">
            The Complete Student Journey
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1F33] leading-tight">
            How HEEYAKU Manages Every Step
          </h2>
          <p className="mt-3 text-base text-slate-600 font-medium">
            From the first inquiry to enrollment and graduation — all connected without manual spreadsheet work.
          </p>

          {/* Stepper Buttons (Zero Badges, Zero Icons) */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {JOURNEY_ITEMS.map((s, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.step}. {s.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion Gallery */}
        <div className="mb-10">
          <AccordionGallery
            items={JOURNEY_ITEMS}
            defaultIndex={activeStepIndex}
            expandRatio={0.46}
            height={400}
            radius={20}
            gap={12}
            trigger="hover"
            accentColor="#2563EB"
            overlayColor="#0B1F33"
            showLabels={true}
            grayscale={false}
            onActiveChange={(idx) => setActiveStepIndex(idx)}
          />
        </div>

        {/* Step Specification Card (Zero Badges, Zero Icons) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="text-xs font-mono text-slate-500 font-bold uppercase">
              Step {activeStep.step} of 05 • {activeStep.shortTitle}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
              {activeStep.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              {activeStep.desc}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {activeStep.bullets.map((b, idx) => (
                <div key={idx} className="text-xs sm:text-sm text-slate-700 font-medium flex items-start gap-2">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 text-center space-y-2">
            <div className="text-xs font-mono text-slate-500 font-bold uppercase">
              {activeStep.metricLabel}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#2563EB]">
              {activeStep.metric}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Standard across all partner academies
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
