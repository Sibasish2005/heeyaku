import React from 'react';

interface EmployeeKpiCardsProps {
  totalAssigned: number;
  inDiscussion: number;
  converted: number;
  conversionRate: string;
  timeframeLabel?: string;
}

export default function EmployeeKpiCards({
  totalAssigned,
  inDiscussion,
  converted,
  conversionRate,
  timeframeLabel,
}: EmployeeKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-1 px-1">
      {/* Total leads */}
      <div>
        <div className="text-xs text-muted-foreground">Total leads</div>
        <div className="text-2xl font-semibold text-foreground font-mono mt-0.5">
          {totalAssigned}
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5">Active portfolio</div>
      </div>

      {/* In discussion */}
      <div>
        <div className="text-xs text-muted-foreground">In discussion</div>
        <div className="text-2xl font-semibold text-foreground font-mono mt-0.5">
          {inDiscussion}
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5">Contacted / interested</div>
      </div>

      {/* Converted */}
      <div>
        <div className="text-xs text-muted-foreground">Converted</div>
        <div className="text-2xl font-semibold text-foreground font-mono mt-0.5">
          {converted}
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5">Closed enrollments</div>
      </div>

      {/* Conversion rate */}
      <div>
        <div className="text-xs text-muted-foreground">Conversion rate</div>
        <div className="text-2xl font-semibold text-foreground font-mono mt-0.5">
          {conversionRate}%
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5">Converted / assigned</div>
      </div>
    </div>
  );
}
