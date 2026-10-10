'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { validateAdminEmailAction } from '@/app/sign-up/actions';

export default function AdminSignUpCard() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorizedEmail, setAuthorizedEmail] = useState<string | null>(null);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await validateAdminEmailAction(trimmedEmail);
      if (!res.allowed) {
        setError(res.error || 'This email is not authorized for Administrator access.');
        return;
      }

      setAuthorizedEmail(trimmedEmail);
    } catch {
      setError('An unexpected error occurred while validating admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // If email is authorized against .env, render Clerk's SignUp with OTP & Password creation
  if (authorizedEmail) {
    return (
      <div className="w-full max-w-[440px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Authorized Admin: {authorizedEmail}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthorizedEmail(null)}
            className="text-[11px] underline hover:text-foreground cursor-pointer"
          >
            Change
          </button>
        </div>

        <div className="w-full flex justify-center">
          <SignUp
            initialValues={{
              emailAddress: authorizedEmail,
            }}
            fallbackRedirectUrl="/admin/dashboard"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    );
  }

  // Pre-flight authorization step: Only .env ADMIN_EMAIL can register
  return (
    <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 border border-[#2563EB]/20 mb-1 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Root Administrator Setup
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sign-up is strictly restricted to CEO / Admin emails specified in the system (.env).
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 text-xs text-destructive animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{error}</div>
        </div>
      )}

      <form onSubmit={handleVerifyEmail} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Admin Email Address</span>
            <span className="text-[10px] text-muted-foreground font-normal">Must match ADMIN_EMAIL in .env</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="email"
              required
              placeholder="subhra1234c@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 focus:bg-background border border-border focus:border-[#2563EB] text-foreground rounded-xl outline-hidden transition-colors placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>How first-time Admin setup works:</span>
          </div>
          <p>
            1. We verify your email belongs to the authorized CEO list in <code className="text-[#2563EB]">.env</code>.<br />
            2. Clerk will dispatch a 6-digit OTP code to your inbox.<br />
            3. You enter the OTP and create your static admin password.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Authorization...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue with Clerk OTP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Already set up your static password?{' '}
          <Link href="/sign-in" className="font-bold text-[#2563EB] dark:text-blue-400 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
