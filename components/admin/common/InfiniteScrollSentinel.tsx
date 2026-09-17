'use client';

import React, { useEffect, useRef } from 'react';

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  onLoadMore: () => void;
  totalCount: number;
  currentCount: number;
  itemName?: string;
  isLoading?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function InfiniteScrollSentinel({
  hasMore,
  onLoadMore,
  totalCount,
  currentCount,
  itemName = 'records',
  isLoading = false,
  scrollContainerRef,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef?.current ?? null,
        rootMargin: '100px',
      }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, onLoadMore, scrollContainerRef]);

  if (totalCount === 0) return null;

  return (
    <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground bg-muted/20">
      <div>
        Showing <span className="font-semibold text-foreground font-mono">{currentCount}</span> of{' '}
        <span className="font-semibold text-foreground font-mono">{totalCount}</span> {itemName}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="flex items-center gap-2 font-medium text-xs text-muted-foreground">
          <div className="w-3.5 h-3.5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{isLoading ? 'Fetching next 10 from backend...' : 'Loading more as you scroll...'}</span>
        </div>
      ) : (
        <span className="text-[11px] font-mono text-muted-foreground/80 font-medium">
          All {totalCount} {itemName} loaded
        </span>
      )}
    </div>
  );
}
