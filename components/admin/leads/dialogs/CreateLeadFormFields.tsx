'use client';

import React from 'react';
import { Mail, Phone, Building, UserCheck } from 'lucide-react';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';

import { FRONTEND_PHONE_PATTERN } from '@/lib/lead/phone';

export interface CreateLeadFormData {
  name: string;
  phoneNumber: string;
  email: string;
  company: string;
  source: string;
  assignedEmployeeId: string;
}

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  name: string;
  team: string | null;
}

interface CreateLeadFormFieldsProps {
  formData: CreateLeadFormData;
  activeEmployees: ActiveEmployee[];
  onChange: (data: CreateLeadFormData) => void;
}

export default function CreateLeadFormFields({
  formData,
  activeEmployees,
  onChange,
}: CreateLeadFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Prospect / Student Name *</label>
        <input
          type="text"
          required
          placeholder="e.g. Suman Sen"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Phone Number *</label>
          <span className="text-[10px] text-muted-foreground font-mono">10 digits</span>
        </div>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-foreground">Email Address</label>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="student@example.com"
            value={formData.email}
            onChange={(e) => onChange({ ...formData, email: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Course / Institution / School</label>
        <div className="relative">
          <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="e.g. JEE Advanced 2026 Batch"
            value={formData.company}
            onChange={(e) => onChange({ ...formData, company: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Assign to Business Development Associate</label>
        <div className="relative">
          <UserCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <ShadcnDropdownSelect
            value={formData.assignedEmployeeId}
            onValueChange={(val) => onChange({ ...formData, assignedEmployeeId: val })}
            options={[
              { value: '', label: 'Leave Unassigned (Pool)' },
              ...activeEmployees.map((emp) => ({
                value: emp.id,
                label: `${emp.name} (${emp.employeeCode})`,
              })),
            ]}
            placeholder="Select Business Development Associate or leave unassigned..."
            triggerClassName="pl-8"
          />
        </div>
      </div>
    </div>
  );
}
