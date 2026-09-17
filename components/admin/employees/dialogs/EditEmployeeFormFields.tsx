'use client';

import React from 'react';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';
import { FRONTEND_PHONE_PATTERN } from '@/lib/lead/phone';

export interface EditEmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
  team: string;
  notes: string;
}

interface EditEmployeeFormFieldsProps {
  formData: EditEmployeeFormData;
  onChange: (data: EditEmployeeFormData) => void;
}

export default function EditEmployeeFormFields({
  formData,
  onChange,
}: EditEmployeeFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Full Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-foreground">Work Email *</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => onChange({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Phone Number *</label>
          <span className="text-[10px] text-muted-foreground font-mono">10 digits</span>
        </div>
        <input
          type="tel"
          required
          pattern={FRONTEND_PHONE_PATTERN}
          maxLength={10}
          title="10-digit phone number (e.g. 9876543210)"
          placeholder="e.g. 9876543210"
          value={formData.phoneNumber}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            const clean = digits.length === 12 && digits.startsWith('91')
              ? digits.slice(2)
              : digits.length === 11 && digits.startsWith('0')
              ? digits.slice(1)
              : digits.slice(0, 10);
            onChange({ ...formData, phoneNumber: clean });
          }}
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors font-mono"
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Role</label>
        <input
          type="text"
          readOnly
          value="Business Development Associate"
          className="w-full px-3 py-2 text-xs bg-muted/30 border border-border text-foreground font-medium rounded-xl outline-hidden cursor-not-allowed select-none"
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Notes / Internal Remarks</label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          placeholder="Add any performance notes or designations..."
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground resize-none"
        />
      </div>
    </div>
  );
}
