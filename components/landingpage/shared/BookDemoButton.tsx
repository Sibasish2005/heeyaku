'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface BookDemoButtonProps {
  href?: string;
  text?: string;
  className?: string;
  onClick?: () => void;
}

// Custom 5x7 Dot Matrix font definitions
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

function DotMatrixText({ text = "Book a Demo" }: { text?: string }) {
  const dotSize = 1.25;
  const dotGap = 2.6;
  const charSpacing = 3.2;

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
      className="h-5 sm:h-5.5 w-auto overflow-visible select-none drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
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

export function DottedArrowIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Horizontal stem dots */}
      <circle cx="4" cy="12" r="1.3" />
      <circle cx="8" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="16" cy="12" r="1.3" />

      {/* Upper diagonal arrow head dots */}
      <circle cx="13" cy="8" r="1.3" />
      <circle cx="16" cy="9.5" r="1.3" />
      <circle cx="19.5" cy="12" r="1.4" />

      {/* Lower diagonal arrow head dots */}
      <circle cx="13" cy="16" r="1.3" />
      <circle cx="16" cy="14.5" r="1.3" />
    </svg>
  );
}

export default function BookDemoButton({
  href = "#book-demo",
  text = "Book a Demo",
  className = "",
  onClick,
}: BookDemoButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative inline-flex items-center justify-between w-[225px] sm:w-[250px] h-[54px] sm:h-[60px] p-[2.5px] rounded-full bg-[#0B1F33] text-white shadow-[0_12px_32px_rgba(11,31,51,0.28)] hover:shadow-[0_18px_45px_rgba(37,99,235,0.45)] border-[2px] border-[#0B1F33] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:scale-[1.02] active:scale-[0.97] select-none overflow-hidden ${className}`}
    >
      {/* 
        Expanding Blue Gradient Region:
        Starts on the left circular knob, and expands smoothly left-to-right to 100% width,
        leaving the dark outer container as a slight border.
      */}
      <motion.div
        initial={false}
        animate={{
          width: isHovered ? 'calc(100% - 2px)' : '48px',
          boxShadow: isHovered
            ? '0 0 25px rgba(56, 189, 248, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.45)'
            : '0 4px 14px rgba(37, 99, 235, 0.4)',
        }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 260,
          mass: 0.8,
        }}
        className="absolute left-[1px] top-[1px] bottom-[1px] z-10 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#1D4ED8] flex items-center overflow-hidden"
      >
        {/* Glass reflection streak */}
        <div className="absolute top-1 left-3 right-3 h-3 bg-white/35 blur-[1px] rounded-full pointer-events-none" />

        {/* Dotted Arrow: fades out and disappears as the region expands */}
        <motion.div
          initial={false}
          animate={{
            opacity: isHovered ? 0 : 1,
            transform: isHovered ? 'translateX(18px) scale(0.8)' : 'translateX(12px) scale(1)',
          }}
          transition={{
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-20 flex items-center justify-center shrink-0 ml-1"
        >
          <DottedArrowIcon className="w-5 sm:w-6 h-5 sm:h-6 text-white drop-shadow-md" />
        </motion.div>
      </motion.div>

      {/* Text Area Transition */}
      <div className="relative z-20 w-full flex items-center justify-center pl-10 pr-4 sm:pl-12 sm:pr-5">
        <AnimatePresence mode="wait">
          {!isHovered ? (
            <motion.span
              key="standard-text"
              initial={{ opacity: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(2px)' }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="font-bold text-base sm:text-lg tracking-wide text-white font-sans drop-shadow-sm ml-2"
            >
              {text}
            </motion.span>
          ) : (
            <motion.div
              key="dotmatrix-text"
              initial={{ opacity: 0, filter: 'blur(2px)', transform: 'scale(0.95)' }}
              animate={{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }}
              exit={{ opacity: 0, filter: 'blur(2px)', transform: 'scale(0.95)' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center -ml-6 sm:-ml-8"
            >
              <DotMatrixText text={text} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}
