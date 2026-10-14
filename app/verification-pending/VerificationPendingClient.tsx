'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Clock, 
  RotateCw, 
  ShieldAlert, 
  CheckCircle2, 
  Mail, 
  Sparkles, 
  Users, 
  LogOut,
  AlertTriangle
} from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';
import { SignOutButton } from '@clerk/nextjs';
import { toast } from 'sonner';

interface VerificationPendingClientProps {
  company: {
    id: string;
    name: string;
    slug: string;
    requestedBdas: number;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
  };
  userEmail: string;
  userName: string;
}

export default function VerificationPendingClient({
  company,
  userEmail,
  userName,
}: VerificationPendingClientProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    toast.info('Checking platform verification status...');
    try {
      router.refresh();
      setTimeout(() => {
        setChecking(false);
        toast.info('Status updated.');
      }, 1200);
    } catch {
      setChecking(false);
    }
  };

  const isRejected = company.status === 'REJECTED';
  const referenceId = `CMP-${company.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Background radial glow */}
      <div className="relative w-full max-w-lg">
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 ${isRejected ? 'bg-red-600/15' : 'bg-amber-500/15'} rounded-full blur-3xl pointer-events-none`} />

        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <HeeyakuLogo size={34} color="#FFFFFF" dotColor="#3B82F6" withText textColor="#FFFFFF" />
          </div>

          {/* Status Badge */}
          <div>
            {isRejected ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide">
                <ShieldAlert className="w-4 h-4" />
                <span>Application Rejected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span>Under Platform Verification</span>
              </div>
            )}
          </div>

          {/* Heading & Subtext */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isRejected ? 'Application Not Approved' : 'Workspace Pending Review'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              {isRejected
                ? 'Your company registration application was reviewed and could not be approved at this time.'
                : 'Your organization workspace has been created and is currently undergoing verification by the Heeyaku administration team.'}
            </p>
          </div>

          {/* Rejection Notice if applicable */}
          {isRejected && company.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-left space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Reason from Platform Administrator:</span>
              </div>
              <p className="text-slate-300 italic pl-5">{company.rejectionReason}</p>
            </div>
          )}

          {/* Details Card */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">Reference ID:</span>
              <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                {referenceId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Company</span>
                <span className="font-semibold text-slate-200 truncate block mt-0.5">{company.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Workspace URL</span>
                <span className="font-mono text-slate-300 truncate block mt-0.5">/{company.slug}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Requested Seats</span>
                <span className="font-semibold text-blue-400 flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{company.requestedBdas} BDAs</span>
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Trial Package</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>30-Day Pro</span>
                </span>
              </div>
            </div>
          </div>

          {/* Timeline SLA box */}
          {!isRejected && (
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center gap-3 text-left">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Typical Approval Window: 2–4 Hours</span>
                <span className="text-slate-400 text-[11px]">
                  Once verified, your workspace unlocks instantly with full telephony and squad management.
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {!isRejected ? (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={checking}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
              >
                <RotateCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Checking Status...' : 'Check Verification Status'}</span>
              </button>
            ) : (
              <a
                href="mailto:platform-admin@heeyaku.com?subject=Application%20Inquiry%20-%20"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Platform Support</span>
              </a>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <div className="text-slate-500 text-[11px] truncate max-w-[200px]">
                Signed in as <span className="text-slate-300 font-medium">{userEmail}</span>
              </div>

              <SignOutButton redirectUrl="/sign-in">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
