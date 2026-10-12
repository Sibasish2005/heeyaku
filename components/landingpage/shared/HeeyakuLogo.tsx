import React from 'react';

export interface HeeyakuLogoProps {
  className?: string;
  size?: number;
  color?: string;
  dotColor?: string;
  withText?: boolean;
  withTagline?: boolean;
  textColor?: string;
  taglineColor?: string;
}

export default function HeeyakuLogo({
  className = "",
  size = 48,
  color = "currentColor",
  dotColor,
  withText = false,
  withTagline = false,
  textColor = "#0B1F33",
  taglineColor = "#475569",
}: HeeyakuLogoProps) {
  const finalDotColor = dotColor || color;

  return (
    <div className={`inline-flex items-center gap-4 ${className}`}>
      {/* SVG Icon */}
      <svg
        width={size}
        height={(size * 244) / 252}
        viewBox="0 0 252 244"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Top bar (longest): sharp top-left & bottom-right, rounded top-right & bottom-left */}
        <path
          d="M 0 0 H 230 A 22 22 0 0 1 252 22 V 66 H 22 A 22 22 0 0 1 0 44 Z"
          fill={color}
        />
        {/* Middle bar (medium, right-aligned): sharp top-left, top-right & bottom-right, rounded bottom-left */}
        <path
          d="M 90 89 H 252 V 155 H 112 A 22 22 0 0 1 90 133 Z"
          fill={color}
        />
        {/* Bottom bar (shortest, right-aligned): sharp top-left & top-right, rounded bottom-left & bottom-right */}
        <path
          d="M 160 178 H 252 V 222 A 22 22 0 0 1 230 244 H 182 A 22 22 0 0 1 160 222 Z"
          fill={color}
        />
        {/* Dot: centered under top-bar overhang */}
        <circle cx="46.5" cy="176" r="22" fill={finalDotColor} />
      </svg>

      {/* Brand Text Lockup */}
      {withText && (
        <div className="flex flex-col">
          <span
            className="font-extrabold tracking-[0.28em] text-lg sm:text-xl uppercase leading-none"
            style={{ color: textColor }}
          >
            HEEYAKU
          </span>
          {withTagline && (
            <span
              className="text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase mt-1.5 leading-none"
              style={{ color: taglineColor }}
            >
              A SUDDEN LEAP TO FUTURE
            </span>
          )}
        </div>
      )}
    </div>
  );
}
