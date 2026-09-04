'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue;
    return values[queries.findIndex(q => window.matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get);
    const mediaQueries = queries.map(q => window.matchMedia(q));
    mediaQueries.forEach(mq => mq.addEventListener('change', handler));
    return () => mediaQueries.forEach(mq => mq.removeEventListener('change', handler));
  }, [queries]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

export interface MasonryItem {
  id: string;
  img: string;
  url?: string;
  height: number;
  title?: string;
  category?: string;
}

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MasonryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  className?: string;
}

export default function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.5,
  stagger = 0.03,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.98,
  blurToFocus = false,
  colorShiftOnHover = false,
  className = '',
}: MasonryProps) {
  const columns = useMedia(
    ['(min-width:1280px)', '(min-width:1024px)', '(min-width:640px)', '(min-width:400px)'],
    [4, 3, 2, 2],
    1
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { grid, totalHeight } = useMemo<{ grid: GridItem[]; totalHeight: number }>(() => {
    if (!width) return { grid: [], totalHeight: 0 };
    const colHeights = new Array(columns).fill(0);
    const gap = 20;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = Math.floor((width - totalGaps) / columns);

    const gridItems = items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const height = child.height;
      const y = colHeights[col];

      colHeights[col] += height + gap;
      return { ...child, x, y, w: columnWidth, h: height };
    });

    return { grid: gridItems, totalHeight: Math.max(...colHeights, 0) };
  }, [columns, items, width]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!grid.length) return;

    grid.forEach((item, index) => {
      const el = itemRefs.current.get(item.id);
      if (!el) return;

      if (!hasMounted.current) {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 40,
            x: item.x,
          },
          {
            opacity: 1,
            x: item.x,
            y: item.y,
            duration: 0.6,
            ease: 'power3.out',
            delay: index * stagger,
            force3D: true,
          }
        );
      } else {
        gsap.to(el, {
          x: item.x,
          y: item.y,
          duration,
          ease,
          overwrite: 'auto',
          force3D: true,
        });
      }
    });

    hasMounted.current = true;
  }, [grid, stagger, duration, ease]);

  const handleMouseEnter = (id: string) => {
    if (scaleOnHover) {
      const el = itemRefs.current.get(id);
      if (el) {
        gsap.to(el, {
          scale: hoverScale,
          duration: 0.25,
          ease: 'power2.out',
          force3D: true,
        });
      }
    }
  };

  const handleMouseLeave = (id: string) => {
    if (scaleOnHover) {
      const el = itemRefs.current.get(id);
      if (el) {
        gsap.to(el, {
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
          force3D: true,
        });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ minHeight: totalHeight > 0 ? `${totalHeight}px` : '400px' }}
    >
      {grid.map(item => (
        <div
          key={item.id}
          ref={el => {
            if (el) itemRefs.current.set(item.id, el);
            else itemRefs.current.delete(item.id);
          }}
          className="absolute box-border cursor-pointer group/item transition-[box-shadow] duration-200"
          style={{
            width: `${item.w}px`,
            height: `${item.h}px`,
            transform: `translate3d(${item.x}px, ${item.y}px, 0px)`,
            willChange: 'transform',
          }}
          onClick={() => item.url && window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={() => handleMouseLeave(item.id)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/70 overflow-hidden transition-all duration-300 group-hover/item:shadow-[0_12px_36px_rgba(37,99,235,0.18)] group-hover/item:border-blue-200"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            {/* Subtle Gradient Shade for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-[#0B1F33]/15 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 sm:p-5" />

            {/* Hover Caption Pill */}
            {(item.title || item.category) && (
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover/item:opacity-100 translate-y-2 group-hover/item:translate-y-0 transition-all duration-200 z-10 flex flex-col">
                {item.category && (
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                    {item.category}
                  </span>
                )}
                {item.title && (
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                    {item.title}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

