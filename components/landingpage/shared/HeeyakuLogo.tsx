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
        height={(size * 54) / 64}
        viewBox="0 0 64 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Top bar (longest) */}
        <rect x="0" y="0" width="64" height="13" rx="4.5" fill={color} />
        {/* Middle bar (medium, right-aligned) */}
        <rect x="23" y="19" width="41" height="13" rx="4.5" fill={color} />
        {/* Bottom bar (shortest, right-aligned) */}
        <rect x="39" y="38" width="25" height="13" rx="4.5" fill={color} />
        {/* Dot (bottom left) */}
        <circle cx="8" cy="44.5" r="5.5" fill={finalDotColor} />
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
