'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X, Loader2, ShieldCheck } from 'lucide-react';
import {
  createEmployeeAction,
  sendEmployeeOtpAction,
  verifyEmployeeOtpAction,
} from '@/app/admin/employees/actions';
import { zodPhoneNumberSchema } from '@/lib/lead/phone';
import CreateEmployeeCredentialsCard from './dialogs/CreateEmployeeCredentialsCard';
import CreateEmployeeFormFields, {
  EmployeeFormData,
  OtpVerificationState,
} from './dialogs/CreateEmployeeFormFields';
import { toast } from 'sonner';

interface CreateEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateEmployeeDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'BDA',
    teamLeadId: '',
    team: 'Business Development Associates',
    notes: '',
  });

  const [createdCredentials, setCreatedCredentials] = useState<{
    employeeCode: string;
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const [otpState, setOtpState] = useState<OtpVerificationState & { verifiedEmail: string; emailAddressId?: string; verificationId?: string }>({
    sent: false,
    sending: false,
    verified: false,
    verifying: false,
    verifiedEmail: '',
    code: '',
    error: null,
    resendCountdown: 0,
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

  if (!isOpen) return null;

  const handleFormDataChange = (newData: EmployeeFormData) => {
    const emailChanged = newData.email.trim().toLowerCase() !== formData.email.trim().toLowerCase();
    setFormData(newData);
    if (emailChanged && (otpState.verified || otpState.sent)) {
      setOtpState((prev) => ({
        ...prev,
        sent: false,
        verified: false,
        verifiedEmail: '',
        code: '',
        error: null,
      }));
    }
  };

  const handleSendOtp = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const err = 'Please provide a valid email address before requesting an OTP.';
      setError(err);
      toast.error(err);
      return;
    }

    setOtpState((prev) => ({ ...prev, sending: true, error: null }));
    setError(null);

    try {
      const res = await sendEmployeeOtpAction({
        email: cleanEmail,
        name: formData.name,
        password: formData.password,
      });

      if (!res.success || !res.data) {
        const err = res.error || 'Failed to dispatch verification email.';
        setOtpState((prev) => ({
          ...prev,
          sending: false,
          error: err,
        }));
        toast.error(err);
        return;
      }

      const otpPayload = res.data;
      setOtpState((prev) => ({
        ...prev,
        sent: true,
        sending: false,
        verified: false,
        emailAddressId: otpPayload.emailAddressId,
        verificationId: otpPayload.verificationId,
        error: null,
        resendCountdown: 45,
      }));
      toast.success('Clerk verification code dispatched to email!');
    } catch {
      const err = 'An unexpected error occurred while sending OTP.';
      setOtpState((prev) => ({
        ...prev,
        sending: false,
        error: err,
      }));
      toast.error(err);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpState.code).trim();
    if (!code || code.length !== 6) {
      const err = 'Please enter the complete 6-digit verification code.';
      setOtpState((prev) => ({
        ...prev,
        error: err,
      }));
      toast.error(err);
      return;
    }

    if (!otpState.emailAddressId || !otpState.verificationId) {
      const err = 'Please send an OTP first before verifying.';
      setOtpState((prev) => ({
        ...prev,
        error: err,
      }));
      toast.error(err);
      return;
    }

    setOtpState((prev) => ({ ...prev, verifying: true, error: null }));

    try {
      const res = await verifyEmployeeOtpAction({
        emailAddressId: otpState.emailAddressId,
        verificationId: otpState.verificationId,
        code,
      });

      if (!res.success) {
        const err = res.error || 'Invalid OTP code. Please check employee email.';
        setOtpState((prev) => ({
          ...prev,
          verifying: false,
          error: err,
        }));
        toast.error(err);
        return;
      }

      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        verified: true,
        verifiedEmail: formData.email.trim().toLowerCase(),
        error: null,
      }));
      setError(null);
      toast.success('Email successfully verified by Clerk!');
    } catch {
      const err = 'Verification request failed. Please try again.';
      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        error: err,
      }));
      toast.error(err);
    }
  };

  const isEmailVerified =
    otpState.verified && formData.email.trim().toLowerCase() === otpState.verifiedEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailVerified) {
      setError('Real mail OTP verification by Clerk is required before confirming employee account.');
      return;
    }

    const phoneValidation = zodPhoneNumberSchema.safeParse(formData.phoneNumber);
    if (!phoneValidation.success) {
      setError(phoneValidation.error.issues[0]?.message || 'Phone number must be a valid 10-digit number.');
      return;
    }

    setLoading(true);

    try {
      const res = await createEmployeeAction(formData);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create employee.');
        return;
      }

      setCreatedCredentials({
        employeeCode: res.data.employeeCode,
        name: res.data.name,
        email: res.data.email,
        temporaryPassword: res.data.tempPassword,
      });
      if (onCreated) onCreated();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `Staff Account Credentials\nName: ${createdCredentials.name}\nEmployee Code: ${createdCredentials.employeeCode}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin URL: ${window.location.origin}/sign-in`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFinish = () => {
    setCreatedCredentials(null);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      role: 'BDA',
      teamLeadId: '',
      team: 'Business Development Associates',
      notes: '',
      password: '',
    });
    setOtpState({
      sent: false,
      sending: false,
      verified: false,
      verifying: false,
      verifiedEmail: '',
      code: '',
      error: null,
      resendCountdown: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {createdCredentials ? 'Employee Credentials Generated' : 'Create New Employee'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {createdCredentials ? 'Share these credentials securely with staff' : 'Add staff account with Clerk OTP email verification'}
              </p>
            </div>
          </div>
          <button
            onClick={createdCredentials ? handleFinish : onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCredentials ? (
          <CreateEmployeeCredentialsCard
            credentials={createdCredentials}
            copied={copied}
            onCopy={handleCopy}
            onFinish={handleFinish}
          />
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
                {error}
              </div>
            )}

            <CreateEmployeeFormFields
              formData={formData}
              onChange={handleFormDataChange}
              otpState={otpState}
              onSendOtp={handleSendOtp}
              onVerifyOtp={handleVerifyOtp}
              onOtpCodeChange={(code) => setOtpState((prev) => ({ ...prev, code }))}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isEmailVerified}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEmailVerified ? (
                  <UserPlus className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{isEmailVerified ? 'Create Staff Account' : 'Verify OTP to Confirm'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
