'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Phone, Users, Shield, FileText } from 'lucide-react';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';
import { FRONTEND_PHONE_PATTERN } from '@/lib/lead/phone';
import { fetchActiveTeamLeadsAction } from '@/app/admin/employees/actions';

export interface EditEmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
  role?: 'BDA' | 'TEAM_LEAD' | 'HR';
  teamLeadId?: string;
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
  const [teamLeads, setTeamLeads] = useState<Array<{ id: string; name: string; employeeCode: string; teamName: string | null }>>([]);
  const [loadingTLs, setLoadingTLs] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTLs() {
      setLoadingTLs(true);
      try {
        const res = await fetchActiveTeamLeadsAction();
        if (mounted && res.success && res.data) {
          setTeamLeads(res.data);
        }
      } catch (err) {
        console.error('Failed to load team leads:', err);
      } finally {
        if (mounted) setLoadingTLs(false);
      }
    }
    loadTLs();
    return () => {
      mounted = false;
    };
  }, []);

  const roleOptions = [
    {
      value: 'BDA',
      label: 'Sales Associate (BDA) - Android Telephony App',
      text: 'Sales Associate (BDA)',
      icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
    },
    {
      value: 'TEAM_LEAD',
      label: 'Team Lead (TL) - Squad CRM & Lead Distribution',
      text: 'Team Lead (TL)',
      icon: <Users className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      value: 'HR',
      label: 'Human Resources (HR) - Staff Roster & Hiring',
      text: 'Human Resources (HR)',
      icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  const currentRole = formData.role || 'BDA';

  const tlOptions = [
    { value: '', label: 'Unassigned / General Squad', text: 'Unassigned / General Squad' },
    ...teamLeads.map((tl) => ({
      value: tl.id,
      label: `${tl.name} (${tl.teamName || 'Squad'} · ${tl.employeeCode})`,
      text: `${tl.name} (${tl.teamName || 'Squad'})`,
    })),
  ];

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
        <label className="text-xs font-bold text-foreground">Role *</label>
        <ShadcnDropdownSelect
          value={currentRole}
          options={roleOptions}
          onValueChange={(val) => {
            const newRole = val as 'BDA' | 'TEAM_LEAD' | 'HR';
            onChange({
              ...formData,
              role: newRole,
              team: newRole === 'HR' ? 'Human Resources' : newRole === 'TEAM_LEAD' ? 'Team Lead' : 'Business Development Associates',
            });
          }}
        />
      </div>

      {currentRole === 'BDA' && (
        <div className="space-y-1 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">Assign to Team Lead / Squad</label>
            <span className="text-[10px] text-muted-foreground">Isolates BDA under specific TL</span>
          </div>
          <ShadcnDropdownSelect
            value={formData.teamLeadId || ''}
            options={tlOptions}
            disabled={loadingTLs}
            placeholder={loadingTLs ? 'Loading team leads...' : 'Select Team Lead...'}
            onValueChange={(val) => onChange({ ...formData, teamLeadId: val })}
          />
        </div>
      )}

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Notes / Internal Remarks</label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          placeholder="Add any performance notes, designations, or squad remarks..."
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground resize-none"
        />
      </div>
    </div>
  );
}

