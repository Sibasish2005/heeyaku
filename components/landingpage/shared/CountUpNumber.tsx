'use client';

import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUpNumber({
  value,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: CountUpNumberProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView || !numberRef.current) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const targetValue = value;

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const formatNum = (val: number) => {
      return decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toString();
    };

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = easeOutExpo(progress);

      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      if (numberRef.current) {
        numberRef.current.textContent = formatNum(currentValue);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        if (numberRef.current) {
          numberRef.current.textContent = formatNum(targetValue);
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, value, duration, decimals]);

  const initialFormatted = decimals > 0 ? (0).toFixed(decimals) : '0';

  return (
    <span ref={containerRef} className={`font-mono tabular-nums inline-flex items-baseline ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span ref={numberRef}>{initialFormatted}</span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

