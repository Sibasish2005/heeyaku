'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin portal error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Unable to Load Admin Module
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.message && !error.message.includes('digest')
          ? error.message
          : 'A temporary connection issue occurred while communicating with the database. Please reload to reconnect.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Try Again
        </button>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-muted text-foreground font-medium rounded-xl text-sm hover:bg-muted/80 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
