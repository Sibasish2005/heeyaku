'use client';

import React, { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(37, 99, 235, 0.08)',
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !spotlightRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    spotlightRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`;
  };

  const handleMouseEnter = () => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className={`relative rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md overflow-hidden p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-blue-400/50 hover:shadow-[0_12px_36px_rgba(37,99,235,0.12)] active:scale-[0.99] ${className}`}
    >
      {/* Mouse-Following Radial Spotlight in Light Mode */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-200 rounded-3xl"
        style={{
          background: `radial-gradient(600px circle at 50% 50%, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

