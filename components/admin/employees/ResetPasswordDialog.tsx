'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  X, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { 
  sendResetPasswordOtpAction, 
  verifyResetPasswordOtpAndResetAction 
} from '@/app/admin/employees/actions';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
  } | null;
  onClose: () => void;
}

export default function ResetPasswordDialog({
  isOpen,
  employee,
  onClose,
}: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Reset local state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError(null);
      setCustomPassword('');
      setShowPassword(false);
      setNewPassword(null);
      setCopied(false);
      setOtpSent(false);
      setOtpSending(false);
      setOtpCode('');
      setEmailAddressId(null);
      setVerificationId(null);
      setResendCountdown(0);
    }
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleSendOtp = async () => {
    setError(null);
    setOtpSending(true);

    try {
      const res = await sendResetPasswordOtpAction(employee.id);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to dispatch verification email via Clerk.');
        setOtpSending(false);
        return;
      }

      setEmailAddressId(res.data.emailAddressId);
      setVerificationId(res.data.verificationId);
      setOtpSent(true);
      setResendCountdown(45);
    } catch {
      setError('An unexpected error occurred while sending OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndReset = async () => {
    setError(null);
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!emailAddressId || !verificationId) {
      setError('Verification session expired. Please request a new OTP code.');
      return;
    }

    if (customPassword.trim() && customPassword.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyResetPasswordOtpAndResetAction({
        employeeId: employee.id,
        emailAddressId,
        verificationId,
        code: cleanCode,
        newPassword: customPassword.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setError(res.error || 'Failed to verify OTP or reset password.');
        setLoading(false);
        return;
      }

      setNewPassword(res.data.tempPassword);
    } catch {
      setError('An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!newPassword) return;
    const text = `HEEYAKU Password Reset:\nEmployee ID: ${employee.employeeCode}\nEmail: ${employee.email}\nNew Temporary Password: ${newPassword}\nLogin URL: ${window.location.origin}/sign-in`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setNewPassword(null);
    setCustomPassword('');
    setShowPassword(false);
    setError(null);
    setOtpSent(false);
    setOtpCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {newPassword ? 'Password Updated Successfully' : 'Reset Employee Password'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {employee.name} ({employee.employeeCode}) • {employee.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Password successfully reset */}
        {newPassword ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified via Clerk Email OTP</span>
              </div>
              <div className="text-xs text-muted-foreground">
                A new cryptographically secure password has been updated in both PostgreSQL and Clerk.
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground font-medium">Assigned Password:</span>
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border select-all">
                  {newPassword}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 text-xs font-semibold text-foreground bg-card border border-border hover:bg-muted/60 rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Warning Callout */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Email OTP Verification Required</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed">
                  To safeguard employee credentials, a real 6-digit OTP code must be verified via Clerk before the password can be updated.
                </div>
              </div>
            </div>

            {/* Step 1: Send OTP Button */}
            {!otpSent ? (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Target Email:</span>
                    <span className="font-semibold text-foreground">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ShieldCheck className="w-3 h-3 text-[#2563EB]" />
                    <span>Real-time Clerk email delivery</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {otpSending ? (
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
              </div>
            ) : (
              /* Step 2: OTP Sent - Enter Code & Password */
              <div className="space-y-3 pt-1">
                {/* OTP Dispatch Card */}
                <div className="p-3 rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Clerk OTP Code Dispatched</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Sent to <span className="font-semibold text-foreground">{employee.email}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || resendCountdown > 0}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-foreground">6-Digit Verification Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 text-center text-base tracking-[0.3em] font-mono font-bold bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Optional Custom Password Input */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">New Password</label>
                    <span className="text-[10px] text-muted-foreground">Optional (leave blank to auto-generate 16-char)</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter custom password or leave blank"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
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

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyAndReset}
                    disabled={loading || otpCode.trim().length !== 6}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{customPassword.trim() ? 'Verify & Save Password' : 'Verify & Auto-Generate'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
