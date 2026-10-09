import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import HeeyakuLogo from '@/components/landingpage/shared/HeeyakuLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center mb-2">
          <HeeyakuLogo size={36} color="currentColor" dotColor="#2563EB" withText textColor="currentColor" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <span className="text-2xl font-black tracking-tight">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Resource Not Found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested page or record does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-blue-600 text-white transition-all shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
