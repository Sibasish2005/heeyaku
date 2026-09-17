'use client';

import React from 'react';
import { ShieldCheck, Copy, Check, ArrowRight } from 'lucide-react';

interface CredentialsData {
  employeeCode: string;
  name: string;
  email: string;
  temporaryPassword: string;
}

interface CreateEmployeeCredentialsCardProps {
  credentials: CredentialsData;
  copied: boolean;
  onCopy: () => void;
  onFinish: () => void;
}

export default function CreateEmployeeCredentialsCard({
  credentials,
  copied,
  onCopy,
  onFinish,
}: CreateEmployeeCredentialsCardProps) {
  return (
    <div className="p-6 space-y-5">
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Employee Created Successfully</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
            The password has been securely hashed in the database. Plaintext temporary password is shown here once.
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Employee Name:</span>
          <span className="font-bold text-foreground">{credentials.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Employee Code:</span>
          <span className="font-mono font-bold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50">
            {credentials.employeeCode}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Email Address:</span>
          <span className="font-semibold text-foreground">{credentials.email}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
          <span className="text-muted-foreground font-medium">Temporary Password:</span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/50 select-all">
            {credentials.temporaryPassword}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Copy Credentials</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-500 rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <span>Done</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
