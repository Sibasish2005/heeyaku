'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Phone, Building2, FileText, Shield, Users, Lock, Eye, EyeOff, Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import ShadcnDropdownSelect from '@/components/ui/shadcn-dropdown-select';
import { FRONTEND_PHONE_PATTERN } from '@/lib/lead/phone';
import { fetchActiveTeamLeadsAction } from '@/app/admin/employees/actions';

export interface EmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
  role?: 'CEO' | 'BDA' | 'TEAM_LEAD' | 'HR';
  teamLeadId?: string;
  team?: string;
  notes: string;
  password?: string;
}

export interface OtpVerificationState {
  sent: boolean;
  sending: boolean;
  verified: boolean;
  verifying: boolean;
  code: string;
  error?: string | null;
  resendCountdown: number;
}

interface CreateEmployeeFormFieldsProps {
  formData: EmployeeFormData;
  onChange: (data: EmployeeFormData) => void;
  otpState: OtpVerificationState;
  onSendOtp: () => Promise<void>;
  onVerifyOtp: (code?: string) => Promise<void>;
  onOtpCodeChange: (code: string) => void;
}

export default function CreateEmployeeFormFields({
  formData,
  onChange,
  otpState,
  onSendOtp,
  onVerifyOtp,
  onOtpCodeChange,
}: CreateEmployeeFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
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
      value: 'CEO',
      label: 'Chief Executive Officer (CEO) - Full Operations Command',
      text: 'Chief Executive Officer (CEO)',
      icon: <Shield className="w-3.5 h-3.5 text-amber-500" />,
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
    {
      value: 'BDA',
      label: 'Sales Associate (BDA) - Android Telephony App',
      text: 'Sales Associate (BDA)',
      icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
    },
  ];

  const currentRole = formData.role || 'BDA';

  const tlOptions = [
    { value: '', label: 'None / General Squad Pool', text: 'General Squad Pool' },
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
          placeholder="e.g. Rahul Sharma"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Email Address (Login) *</label>
          {otpState.verified ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Verified via Clerk
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#2563EB]" />
              Clerk email OTP required
            </span>
          )}
        </div>
        <div className="relative">
          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            required
            placeholder="rahul@heeyaku.com"
            value={formData.email}
            disabled={otpState.verified}
            onChange={(e) => onChange({ ...formData, email: e.target.value })}
            className={`w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground ${
              otpState.verified
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border focus:border-[#2563EB]'
            }`}
          />
        </div>

        {/* OTP Action State */}
        {!otpState.verified ? (
          !otpState.sent ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={!formData.email || otpState.sending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {otpState.sending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending Clerk OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Send Verification OTP via Clerk</span>
                    </>
                  )}
                </button>
              </div>
              {otpState.error && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] font-semibold text-destructive flex items-center gap-1.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{otpState.error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 p-3.5 rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Clerk Verification Code Dispatched</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Real 6-digit OTP sent to <span className="font-semibold text-foreground">{formData.email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={otpState.sending || otpState.resendCountdown > 0}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {otpState.resendCountdown > 0 ? `Resend (${otpState.resendCountdown}s)` : 'Resend Code'}
                </button>
              </div>

              {otpState.error && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] font-semibold text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{otpState.error}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpState.code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    onOtpCodeChange(digits);
                    if (digits.length === 6) {
                      onVerifyOtp(digits);
                    }
                  }}
                  className="w-40 px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-center bg-background border border-border focus:border-[#2563EB] text-foreground rounded-lg outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => onVerifyOtp(otpState.code)}
                  disabled={otpState.code.length !== 6 || otpState.verifying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                >
                  {otpState.verifying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="mt-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Real Mail OTP Verified by Clerk!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onOtpCodeChange('');
                onSendOtp();
              }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Change Email
            </button>
          </div>
        )}
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
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-foreground">Assigned Role *</label>
        <ShadcnDropdownSelect
          value={currentRole}
          options={roleOptions}
          onValueChange={(val) => {
            const newRole = val as 'CEO' | 'BDA' | 'TEAM_LEAD' | 'HR';
            onChange({
              ...formData,
              role: newRole,
              team: newRole === 'CEO' ? 'Executive' : newRole === 'HR' ? 'Human Resources' : newRole === 'TEAM_LEAD' ? 'Team Lead' : 'Business Development Associates',
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
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Account Password</label>
          <span className="text-[10px] text-muted-foreground">Optional (leave blank to auto-generate 16-char password)</span>
        </div>
        <div className="relative">
          <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Assign manual password (min 8 chars) or leave blank for auto-generated"
            value={formData.password || ''}
            onChange={(e) => onChange({ ...formData, password: e.target.value })}
            className="w-full pl-8 pr-9 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs font-bold text-foreground">Internal Notes / Remarks</label>
        <div className="relative">
          <FileText className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <textarea
            rows={2}
            placeholder="Optional details, designations, or squad remarks..."
            value={formData.notes}
            onChange={(e) => onChange({ ...formData, notes: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>
    </div>
  );
}

