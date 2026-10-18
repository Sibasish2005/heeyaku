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
  KeyRound
} from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import { 
  registerCompanyAction, 
  sendOnboardingOtpAction, 
  verifyOnboardingOtpAction 
} from './actions';
import { toast } from 'sonner';
import { isSuperAdminEmail } from '@/lib/auth/super-admin';

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

  const isSuper = isSuperAdminEmail(defaultEmail);

  useEffect(() => {
    if (isSuper) {
      window.location.replace('/super-admin');
    }
  }, [isSuper]);

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
    onboardingToken?: string;
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
    if (isSuperAdminEmail(newEmail)) {
      window.location.replace('/super-admin');
      return;
    }
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
    if (isSuperAdminEmail(cleanEmail)) {
      toast.info('Super Admin account detected. Redirecting to governance portal...');
      window.location.replace('/super-admin');
      return;
    }
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
        toast.error(res.error || 'Failed to send verification code');
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
        error: err?.message || 'Error communicating with verification service.',
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
        email: email.trim().toLowerCase(),
        clerkUserId: otpState.clerkUserId,
      });

      if (!res.success || !res.verified) {
        setOtpState((prev) => ({
          ...prev,
          verifying: false,
          error: res.error || 'Invalid or expired code. Please check your email.',
        }));
        toast.error(res.error || 'Invalid code');
        return;
      }

      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        verified: true,
        verifiedEmail: email.trim().toLowerCase(),
        onboardingToken: res.onboardingToken,
        error: null,
      }));
      toast.success('Email successfully authenticated!');
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
      setError('Please verify your email via OTP before submitting.');
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
          onboardingToken: otpState.onboardingToken,
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

  if (isSuper) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-2" />
        <p className="text-sm font-semibold text-foreground">Super Admin Account Detected</p>
        <p className="text-xs text-muted-foreground mt-1">Routing to platform governance portal...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header branding */}
        <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <HeeyakuLogo size={36} color="currentColor" dotColor="#2563EB" withText textColor="currentColor" />
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#2563EB] dark:text-blue-400">
              Workspace Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Register Organization
            </h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Configure your team workspace, authenticate corporate email, and request caller licenses.
            </p>
          </div>
        </div>

        {/* Form-level Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="e.g. Apex EdTech Private Limited"
                className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground">
                Workspace URL Slug <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">Auto-generated</span>
            </div>
            <div className="flex items-center rounded-xl bg-muted/40 border border-border overflow-hidden focus-within:border-[#2563EB] focus-within:bg-background transition-colors">
              <span className="px-3 py-2 text-xs text-muted-foreground font-mono select-none bg-muted/60 border-r border-border">
                heeyaku.com/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="apex-edtech"
                className="flex-1 px-3 py-2 bg-transparent text-xs text-[#2563EB] dark:text-blue-400 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Phone & Industry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Official Phone <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Industry Sector
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors font-medium cursor-pointer"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-card text-card-foreground">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* BDA Seat Selection */}
          <div className="space-y-2 pt-3 border-t border-border/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-foreground">
                  Caller Licenses (BDAs)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Active outbound telephony seats requested. CEO & HR accounts are free.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#2563EB] dark:text-blue-400 font-mono font-bold text-xs">
                {effectiveBdas} Seats
              </span>
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
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-2xs'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
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
                className="text-[#2563EB] dark:text-blue-400 hover:underline font-semibold cursor-pointer text-xs"
              >
                {isCustomBdaMode ? 'Pick from presets' : 'Need custom seat count (up to 500)?'}
              </button>

              {isCustomBdaMode && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={customBdas}
                    onChange={(e) => setCustomBdas(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-20 px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-xs text-foreground text-center focus:border-[#2563EB] outline-hidden font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Email Authentication */}
          <div className="space-y-3 pt-3 border-t border-border/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#2563EB] dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground">
                    Corporate Email Authentication <span className="text-destructive">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Verified before workspace provisioning.
                  </p>
                </div>
              </div>

              {otpState.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {/* Email Address Field */}
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                disabled={otpState.verified}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="ceo@yourcompany.com"
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  otpState.verified
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono'
                    : 'bg-muted/40 focus:bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-[#2563EB] outline-hidden'
                }`}
              />
            </div>

            {/* OTP Action or Status Area */}
            {!otpState.verified ? (
              !otpState.sent ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Requires 6-digit confirmation code.
                  </span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!email || otpState.sending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
                  >
                    {otpState.sending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Code</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3">
                  <div className="flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                        <span>Verification Code Sent</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Enter 6-digit code sent to <strong className="text-foreground">{email}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpState.sending || otpState.resendCountdown > 0}
                      className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer"
                    >
                      {otpState.resendCountdown > 0 ? `Resend (${otpState.resendCountdown}s)` : 'Resend'}
                    </button>
                  </div>

                  {otpState.error && (
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
                      className="w-32 px-3 py-1.5 text-center text-sm font-mono font-bold tracking-widest bg-background border border-border text-foreground rounded-xl focus:border-[#2563EB] outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={otpState.verifying || otpState.code.length !== 6}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {otpState.verifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Authenticated: {otpState.verifiedEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEmailChange(email)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !otpState.verified}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99] ${
                otpState.verified
                  ? 'bg-[#2563EB] hover:bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground border border-border opacity-70 cursor-not-allowed shadow-none'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering Organization...</span>
                </>
              ) : !otpState.verified ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify Email Above to Submit</span>
                </>
              ) : (
                <>
                  <span>Submit Workspace Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {!otpState.verified && (
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                🔒 Official email authentication required before workspace registration.
              </p>
            )}
          </div>

          {/* Benefits footer */}
          <div className="pt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t border-border/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              <span>30-Day Pro Trial Included</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              <span>Real-Time Call Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              <span>Zero Credit Card Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
              <span>Fast 2-4h Approval</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
