import React from 'react';

export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Skeleton Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-muted/60 rounded-full animate-pulse" />
          <div className="h-7 w-48 bg-muted/80 rounded-xl animate-pulse" />
          <div className="h-3 w-64 bg-muted/50 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-muted/60 rounded-xl animate-pulse" />
      </div>

      {/* Skeleton Metric / Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted/70 rounded-full animate-pulse" />
              <div className="w-5 h-5 bg-muted/60 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted/80 rounded-lg animate-pulse" />
            <div className="h-2.5 w-28 bg-muted/50 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      {/* Skeleton Content / Table Area */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {/* Table Toolbar Skeleton */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between gap-4 bg-muted/20">
          <div className="h-9 w-64 bg-muted/60 rounded-xl animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-9 w-28 bg-muted/60 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-border/60">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted/70 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-muted/80 rounded-full animate-pulse" />
                  <div className="h-2.5 w-24 bg-muted/50 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-20 bg-muted/60 rounded-full animate-pulse" />
              <div className="h-3.5 w-24 bg-muted/60 rounded-full animate-pulse hidden sm:block" />
              <div className="h-8 w-16 bg-muted/60 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
