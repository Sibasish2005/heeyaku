'use client';

import React from 'react';
import { LeadStatus } from '@prisma/client';
import BentoConversionDonut from './bento/BentoConversionDonut';
import BentoFunnelFlow from './bento/BentoFunnelFlow';
import BentoWarmPipeline from './bento/BentoWarmPipeline';
import BentoFrictionTelemetry from './bento/BentoFrictionTelemetry';

export interface LeadStatusCount {
  status: LeadStatus;
  label: string;
  count: number;
  colorClass: string;
  dotClass: string;
}

interface TodayLeadStatusSectionProps {
  totalLeadsToday: number;
  statusBreakdown: LeadStatusCount[];
}

export default function TodayLeadStatusSection({
  totalLeadsToday,
  statusBreakdown,
}: TodayLeadStatusSectionProps) {
  const getCount = (status: LeadStatus) =>
    statusBreakdown.find((s) => s.status === status)?.count || 0;

  const newCount = getCount('NEW');
  const assignedCount = getCount('ASSIGNED');
  const contactedCount = getCount('CONTACTED');
  const callBackCount = getCount('CALL_BACK');
  const interestedCount = getCount('INTERESTED');
  const followUpCount = getCount('FOLLOW_UP');
  const convertedCount = getCount('CONVERTED');
  const notInterestedCount = getCount('NOT_INTERESTED');
  const noAnswerCount = getCount('NO_ANSWER');
  const busyCount = getCount('BUSY');
  const wrongNumberCount = getCount('WRONG_NUMBER');
  const notQualifiedCount = getCount('NOT_QUALIFIED');
  const otherCount = getCount('OTHER');

  const inProgressTotal =
    contactedCount + callBackCount + interestedCount + followUpCount;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-border/80">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400">
            Section 01 · Today's Activity
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            Where Today's Leads Stand
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs sm:text-sm font-extrabold text-foreground bg-muted/60 px-3 py-0.5 rounded-full border border-border">
            {totalLeadsToday} {totalLeadsToday === 1 ? 'lead' : 'leads'}
          </span>
        </div>
      </div>

      {/* Unified Modern Telemetry Surface */}
      <div className="space-y-4">
        {/* Top Console: Conversion Gauge & Pipeline Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border shadow-2xs overflow-hidden">
          <div className="lg:col-span-5">
            <BentoConversionDonut
              totalLeads={totalLeadsToday}
              newIntake={newCount}
              assigned={assignedCount}
              inProgress={inProgressTotal}
              converted={convertedCount}
            />
          </div>

          <div className="lg:col-span-7">
            <BentoFunnelFlow
              totalLeads={totalLeadsToday}
              newCount={newCount}
              assignedCount={assignedCount}
              contactedCount={contactedCount}
              callBackCount={callBackCount}
              interestedCount={interestedCount}
              followUpCount={followUpCount}
              convertedCount={convertedCount}
            />
          </div>
        </div>

        {/* Bottom Console: Priority Follow-ups & Diagnostic Outcomes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border shadow-2xs overflow-hidden">
          <div className="lg:col-span-6">
            <BentoWarmPipeline
              totalLeads={totalLeadsToday}
              interested={interestedCount}
              followUp={followUpCount}
              callBack={callBackCount}
            />
          </div>

          <div className="lg:col-span-6">
            <BentoFrictionTelemetry
              totalLeads={totalLeadsToday}
              noAnswer={noAnswerCount}
              busy={busyCount}
              wrongNumber={wrongNumberCount}
              notInterested={notInterestedCount}
              notQualified={notQualifiedCount}
              other={otherCount}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
