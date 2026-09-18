'use client';

import React from 'react';
import Link from 'next/link';

interface BookDemoButtonProps {
  href?: string;
  text?: string;
  className?: string;
  onClick?: () => void;
}

// 5x7 Dot Matrix font definitions for clean, authentic LED typography
const DOT_FONT: Record<string, number[][]> = {
  B: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  o: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  k: [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
  ],
  a: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
  ],
  D: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  e: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  m: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  w: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
  ],
  ' ': [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
};

function DotMatrixText({ text = 'Book a Demo' }: { text?: string }) {
  const dotSize = 1.15;
  const dotGap = 2.3;
  const charSpacing = 2.4;

  const { charData, totalWidth } = text.split('').reduce(
    (acc, char) => {
      const grid = DOT_FONT[char] || DOT_FONT[' '] || [];
      const width = (grid[0]?.length || 3) * dotGap;
      acc.charData.push({ grid, startX: acc.totalWidth });
      acc.totalWidth += width + charSpacing;
      return acc;
    },
    { charData: [] as { grid: number[][]; startX: number }[], totalWidth: 0 }
  );

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 20`}
      className="h-4 sm:h-[18px] w-auto overflow-visible select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {charData.map(({ grid, startX }, charIdx) =>
        grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <circle
                key={`${charIdx}-${r}-${c}`}
                cx={startX + c * dotGap + dotSize}
                cy={r * dotGap + dotSize + 1}
                r={dotSize}
                fill="#ffffff"
              />
            );
          })
        )
      )}
    </svg>
  );
}

export function DottedArrowIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Horizontal stem dots */}
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="13" cy="12" r="1.3" />
      <circle cx="17" cy="12" r="1.3" />

      {/* Upper diagonal arrow head dots */}
      <circle cx="14" cy="8" r="1.3" />
      <circle cx="17" cy="9.8" r="1.3" />
      <circle cx="20.5" cy="12" r="1.4" />

      {/* Lower diagonal arrow head dots */}
      <circle cx="14" cy="16" r="1.3" />
      <circle cx="17" cy="14.2" r="1.3" />
    </svg>
  );
}

export default function BookDemoButton({
  href = '/book-demo',
  text = 'Book a Demo',
  className = '',
  onClick,
}: BookDemoButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative inline-flex items-center w-[255px] sm:w-[275px] h-[52px] sm:h-[56px] p-1 rounded-full bg-[#0B1F33] text-white shadow-[0_12px_32px_rgba(11,31,51,0.28)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.45)] border border-[#1E293B] hover:border-[#2563EB]/70 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.97] select-none overflow-hidden ${className}`}
    >
      {/* Expanding Electric Blue Pill Background */}
      <div className="absolute left-1 top-1 bottom-1 z-10 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#1D4ED8] w-[44px] group-hover:w-[calc(100%-8px)] transition-all duration-300 ease-out flex items-center overflow-hidden shadow-[0_2px_12px_rgba(37,99,235,0.4)]">
        {/* Subtle glass reflection highlight */}
        <div className="absolute top-0.5 left-2 right-2 h-2 bg-gradient-to-b from-white/30 to-transparent blur-[0.5px] rounded-full pointer-events-none" />

        {/* Dotted Arrow Knob Icon: stays cleanly anchored on the left */}
        <div className="relative z-20 flex items-center justify-center shrink-0 w-7 h-7 ml-2 transition-transform duration-300 ease-out group-hover:translate-x-1">
          <DottedArrowIcon className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </div>
      </div>

      {/* Persistent Dot Matrix Text: safely offset so arrow NEVER overlaps the text */}
      <div className="relative z-20 w-full flex items-center justify-center pl-[52px] sm:pl-[56px] pr-4 transition-transform duration-300 ease-out group-hover:translate-x-1">
        <div className="transition-all duration-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.65)] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,1)]">
          <DotMatrixText text={text} />
        </div>
      </div>
    </Link>
  );
}
