'use client';

import React from 'react';

interface LeadTableHeadProps {
  isAllVisibleSelected: boolean;
  isSomeVisibleSelected: boolean;
  onToggleSelectVisible: () => void;
}

export default function LeadTableHead({
  isAllVisibleSelected,
  isSomeVisibleSelected,
  onToggleSelectVisible,
}: LeadTableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        <th className="py-3 px-3.5 text-center w-9">
          <input
            type="checkbox"
            title="Select only visible leads on this page"
            checked={isAllVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeVisibleSelected;
            }}
            onChange={onToggleSelectVisible}
            className="rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
          />
        </th>
        <th className="py-3 px-3.5">Code No</th>
        <th className="py-3 px-3.5">Lead Name</th>
        <th className="py-3 px-3.5">Phone No</th>
        <th className="py-3 px-3.5">Email</th>
        <th className="py-3 px-3.5">Target Course / School</th>
        <th className="py-3 px-3.5">Status</th>
        <th className="py-3 px-3.5">BDA</th>
        <th className="py-3 px-3.5">Added On</th>
        <th className="py-3 px-4 text-right">Action</th>
      </tr>
    </thead>
  );
}
