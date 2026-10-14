'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Mail,
  Send,
  Lock,
  KeyRound,
  RotateCw
} from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import { 
  registerCompanyAction, 
  sendOnboardingOtpAction, 
  verifyOnboardingOtpAction 
} from './actions';
import { toast } from 'sonner';

interface OnboardingFormClientProps {
  defaultEmail: string;
  defaultName: string;
}

const INDUSTRIES = [
  'B2B Sales & Lead Generation',
  'EdTech & Online Education',
  'Real Estate & Property Advisory',
  'Financial Services & Insurance',
  'Logistics & Supply Chain',
  'Healthcare & Telemedicine',
  'SaaS & Software Services',
  'Consulting & Professional Services',
  'Other',
];

const PRESET_BDA_OPTIONS = [5, 10, 20, 50];

export default function OnboardingFormClient({
  defaultEmail,
  defaultName,
}: OnboardingFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [requestedBdas, setRequestedBdas] = useState(5);
  const [customBdas, setCustomBdas] = useState('');
  const [isCustomBdaMode, setIsCustomBdaMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email & Clerk OTP state
  const [email, setEmail] = useState(defaultEmail || '');
  const [otpState, setOtpState] = useState<{
    sent: boolean;
    sending: boolean;
    verified: boolean;
    verifying: boolean;
    code: string;
    error: string | null;
    resendCountdown: number;
    emailAddressId?: string;
    verificationId?: string;
    clerkUserId?: string;
    verifiedEmail?: string;
  }>({
    sent: false,
    sending: false,
    verified: false,
    verifying: false,
    code: '',
    error: null,
    resendCountdown: 0,
    verifiedEmail: '',
  });

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (otpState.resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpState((prev) => ({
        ...prev,
        resendCountdown: Math.max(0, prev.resendCountdown - 1),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpState.resendCountdown]);

  // Auto-slug generation helper
  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (!hasManuallyEditedSlug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setHasManuallyEditedSlug(true);
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .slice(0, 50);
    setSlug(sanitized);
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (otpState.verified || otpState.sent) {
      setOtpState((prev) => ({
        ...prev,
        sent: false,
        verified: false,
        code: '',
        error: null,
        verifiedEmail: '',
      }));
    }
  };

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setOtpState((prev) => ({ ...prev, error: 'Please enter a valid official email address.' }));
      return;
    }

    setOtpState((prev) => ({ ...prev, sending: true, error: null }));
    try {
      const res = await sendOnboardingOtpAction({
        email: cleanEmail,
        name: defaultName || companyName || 'Company CEO',
      });

      if (!res.success) {
        setOtpState((prev) => ({
          ...prev,
          sending: false,
          error: res.error || 'Failed to send verification code. Please try again.',
        }));
        toast.error(res.error || 'Failed to send Clerk OTP');
        return;
      }

      // If Clerk reports this email address is already verified on this account
      if (res.alreadyVerified) {
        setOtpState((prev) => ({
          ...prev,
          sending: false,
          verified: true,
          sent: true,
          verifiedEmail: cleanEmail,
          clerkUserId: res.clerkUserId,
        }));
        toast.success('Email verified via Clerk account!');
        return;
      }

      setOtpState((prev) => ({
        ...prev,
        sending: false,
        sent: true,
        emailAddressId: res.emailAddressId,
        verificationId: res.verificationId,
        clerkUserId: res.clerkUserId,
        resendCountdown: 30,
        error: null,
      }));
      toast.success(`Verification code dispatched to ${cleanEmail}`);
    } catch (err: any) {
      setOtpState((prev) => ({
        ...prev,
        sending: false,
        error: err?.message || 'Error communicating with Clerk verification service.',
      }));
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || otpState.code).trim();
    if (!targetCode || targetCode.length !== 6) {
      setOtpState((prev) => ({ ...prev, error: 'Please enter the 6-digit code.' }));
      return;
    }

    if (!otpState.emailAddressId || !otpState.verificationId) {
      setOtpState((prev) => ({ ...prev, error: 'Please request a new OTP first.' }));
      return;
    }

    setOtpState((prev) => ({ ...prev, verifying: true, error: null }));
    try {
      const res = await verifyOnboardingOtpAction({
        emailAddressId: otpState.emailAddressId,
        verificationId: otpState.verificationId,
        code: targetCode,
      });

      if (!res.success || !res.verified) {
        setOtpState((prev) => ({
          ...prev,
          verifying: false,
          error: res.error || 'Invalid or expired code. Please check your email.',
        }));
        toast.error(res.error || 'Invalid OTP code');
        return;
      }

      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        verified: true,
        verifiedEmail: email.trim().toLowerCase(),
        error: null,
      }));
      toast.success('Email successfully authenticated via Clerk!');
    } catch (err: any) {
      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        error: err?.message || 'Verification attempt failed.',
      }));
    }
  };

  const effectiveBdas = isCustomBdaMode ? parseInt(customBdas, 10) || 5 : requestedBdas;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || companyName.trim().length < 2) {
      setError('Company name must be at least 2 characters long.');
      return;
    }

    if (!slug.trim() || slug.trim().length < 2) {
      setError('Workspace slug is required (minimum 2 characters).');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Please provide a valid official contact phone number.');
      return;
    }

    if (!otpState.verified) {
      setError('Please verify your email via Clerk OTP before submitting.');
      toast.error('Email verification required');
      return;
    }

    if (effectiveBdas < 1 || effectiveBdas > 500) {
      setError('Please request between 1 and 500 caller seats.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await registerCompanyAction({
          companyName: companyName.trim(),
          slug: slug.trim(),
          phoneNumber: cleanPhone,
          industry,
          requestedBdas: effectiveBdas,
          email: otpState.verifiedEmail || email.trim().toLowerCase(),
          clerkUserId: otpState.clerkUserId,
        });

        if (!result.success) {
          setError(result.error || 'Failed to register company. Please try again.');
          toast.error(result.error || 'Registration failed');
          return;
        }

        toast.success('Workspace registered! Redirecting to review status...');
        router.push('/verification-pending');
        router.refresh();
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred. Please try again.');
        toast.error('Registration failed.');
      }
    });
  };

  return (
    <div className="w-full max-w-xl">
      {/* Background radial glow */}
      <div className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-2">
              <HeeyakuLogo size={32} color="#FFFFFF" dotColor="#3B82F6" withText textColor="#FFFFFF" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>30-Day Pro Trial Included</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Set Up Your Organization
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Configure your team workspace, verify your corporate email via Clerk, and request caller seats.
              </p>
            </div>
          </div>

          {/* Form-level Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  placeholder="e.g. Apex EdTech Private Limited"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Workspace URL Slug <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">Auto-generated</span>
              </div>
              <div className="flex items-center rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
                <span className="px-3 py-2.5 text-xs text-slate-500 font-mono select-none bg-slate-900/60 border-r border-slate-800">
                  heeyaku.com/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="apex-edtech"
                  className="flex-1 px-3 py-2.5 bg-transparent text-sm text-blue-400 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Phone & Industry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Official Phone <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Industry / Sector
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} className="bg-slate-900 text-white">
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BDA Seat Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Requested Caller Seats (BDAs)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Number of active outbound telephony callers needed. CEO & HR accounts are free.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>{effectiveBdas} Seats</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {PRESET_BDA_OPTIONS.map((num) => {
                  const isSelected = !isCustomBdaMode && requestedBdas === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setIsCustomBdaMode(false);
                        setRequestedBdas(num);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {num} BDAs
                    </button>
                  );
                })}
              </div>

              {/* Custom seats toggle */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsCustomBdaMode(!isCustomBdaMode)}
                  className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  {isCustomBdaMode ? 'Pick from presets' : 'Need custom seat count (up to 500)?'}
                </button>

                {isCustomBdaMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={customBdas}
                      onChange={(e) => setCustomBdas(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-20 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-white text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* CLERK EMAIL AUTHENTICATION BEFORE SUBMIT BUTTON                */}
            {/* ============================================================== */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-200">
                      CEO Identity & Email Authentication <span className="text-red-400">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Verified via Clerk real-time OTP before organization provisioning.
                    </p>
                  </div>
                </div>

                {otpState.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified via Clerk</span>
                  </span>
                )}
              </div>

              {/* Email Address Field */}
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  disabled={otpState.verified}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="ceo@yourcompany.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    otpState.verified
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>

              {/* OTP Action or Status Area */}
              {!otpState.verified ? (
                !otpState.sent ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Requires 6-digit email confirmation code.
                    </span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!email || otpState.sending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      {otpState.sending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Clerk OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Verification OTP via Clerk</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                          <span>Clerk Verification Code Sent</span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enter 6-digit code sent to <strong className="text-slate-200">{email}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpState.sending || otpState.resendCountdown > 0}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:hover:text-blue-400 cursor-pointer"
                      >
                        {otpState.resendCountdown > 0 ? `Resend (${otpState.resendCountdown}s)` : 'Resend Code'}
                      </button>
                    </div>

                    {otpState.error && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span>{otpState.error}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpState.code}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpState((prev) => ({ ...prev, code: digits, error: null }));
                          if (digits.length === 6) {
                            handleVerifyOtp(digits);
                          }
                        }}
                        className="w-36 px-3 py-2 text-center text-sm font-mono font-bold tracking-widest bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        disabled={otpState.verifying || otpState.code.length !== 6}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {otpState.verifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Clerk Verified CEO: {otpState.verifiedEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEmailChange(email)}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || !otpState.verified}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-[0.99] ${
                  otpState.verified
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/80 opacity-70 cursor-not-allowed shadow-none'
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Organization...</span>
                  </>
                ) : !otpState.verified ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify Email Above to Unlock Submission</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Platform Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!otpState.verified && (
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  🔒 Clerk mail authentication required before workspace provisioning.
                </p>
              )}
            </div>

            {/* Benefits footer */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>30 Days Full Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Real-Time Call Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Zero Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Fast 2-4h Approval</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
