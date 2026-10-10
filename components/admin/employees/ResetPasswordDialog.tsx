'use client';

import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldAlert,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { resetEmployeePasswordAction } from '@/app/admin/employees/actions';

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

  if (!isOpen || !employee) return null;

  const handleReset = async () => {
    setError(null);
    if (customPassword.trim() && customPassword.trim().length < 15) {
      setError('Password must be at least 15 characters long to satisfy security policies.');
      return;
    }
    setLoading(true);

    try {
      const res = await resetEmployeePasswordAction(employee.id, customPassword.trim() || undefined);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to reset password');
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
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
                {employee.name} ({employee.employeeCode})
              </p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {newPassword ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="text-xs text-muted-foreground">
                A new cryptographically secure password has been hashed and updated in the database and login directory.
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
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Password'}</span>
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

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Are you sure you want to reset this password?</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed">
                  The employee&apos;s previous credentials will be immediately invalidated and updated across the web and mobile systems.
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">New Password</label>
                <span className="text-[10px] text-muted-foreground">Optional (leave blank to auto-generate 16-char password)</span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter custom password (min 15 chars) or leave blank"
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
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{customPassword.trim() ? 'Save New Password' : 'Reset & Auto-Generate'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
