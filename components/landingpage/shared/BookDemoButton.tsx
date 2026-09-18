'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BookDemoButtonProps {
  href?: string;
  text?: string;
  className?: string;
  onClick?: () => void;
}

// Complete 5x7 Dot Matrix font definitions
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
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
};

function DotMatrixText({ text = 'Book a Demo' }: { text?: string }) {
  const dotSize = 1.35;
  const dotGap = 2.8;
  const charSpacing = 3.5;

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
      viewBox={`0 0 ${totalWidth} 22`}
      className="h-5 sm:h-5.5 w-auto overflow-visible select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]"
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
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="13" cy="12" r="1.4" />
      <circle cx="17" cy="12" r="1.4" />

      {/* Upper diagonal arrow head dots */}
      <circle cx="14" cy="8" r="1.4" />
      <circle cx="17" cy="9.8" r="1.4" />
      <circle cx="20.5" cy="12" r="1.5" />

      {/* Lower diagonal arrow head dots */}
      <circle cx="14" cy="16" r="1.4" />
      <circle cx="17" cy="14.2" r="1.4" />
    </svg>
  );
}

export default function BookDemoButton({
  href = '/book-demo',
  text = 'Book a Demo',
  className = '',
  onClick,
}: BookDemoButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative inline-flex items-center justify-between w-[235px] sm:w-[260px] h-[54px] sm:h-[58px] p-1 rounded-full bg-[#0B1F33] text-white shadow-[0_12px_32px_rgba(11,31,51,0.28)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.5)] border border-[#1E293B] hover:border-[#2563EB]/60 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.97] select-none overflow-hidden ${className}`}
    >
      {/* Expanding Electric Blue Pill Background */}
      <motion.div
        initial={false}
        animate={{
          width: isHovered ? '100%' : '46px',
          backgroundColor: isHovered ? '#2563EB' : '#1D4ED8',
        }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 280,
          mass: 0.7,
        }}
        className="absolute left-1 top-1 bottom-1 z-10 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#1D4ED8] flex items-center overflow-hidden shadow-[0_2px_12px_rgba(37,99,235,0.45)]"
      >
        {/* Glass reflection highlight on top half of the pill */}
        <div className="absolute top-0.5 left-2 right-2 h-2.5 bg-gradient-to-b from-white/40 to-transparent blur-[0.5px] rounded-full pointer-events-none" />

        {/* Dotted Arrow Knob Icon: glides slightly right on hover */}
        <motion.div
          animate={{
            x: isHovered ? 12 : 10,
            scale: isHovered ? 1.08 : 1,
          }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
          }}
          className="relative z-20 flex items-center justify-center shrink-0 w-7 h-7"
        >
          <DottedArrowIcon className="w-5 h-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]" />
        </motion.div>
      </motion.div>

      {/* Persistent Dot Matrix Text: perfectly centered with forward glide on hover */}
      <div className="relative z-20 w-full flex items-center justify-center pl-10 pr-4">
        <motion.div
          animate={{
            x: isHovered ? 6 : 0,
            filter: isHovered ? 'drop-shadow(0 0 10px rgba(255,255,255,1))' : 'drop-shadow(0 0 4px rgba(255,255,255,0.6))',
          }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 260,
          }}
          className="flex items-center justify-center"
        >
          <DotMatrixText text={text} />
        </motion.div>
      </div>
    </Link>
  );
}
