'use client';

import React, { useRef, useEffect, useState, useCallback, CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { gsap } from 'gsap';

export interface AccordionGalleryItem {
  image: string;
  label?: string;
  link?: string;
  alt?: string;
  badge?: string;
  description?: string;
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
  onActiveChange?: (index: number) => void;
}

const DEFAULT_ITEMS: AccordionGalleryItem[] = [
  { image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', label: '01. Ingestion', link: '#' },
  { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80', label: '02. Routing', link: '#' },
  { image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80', label: '03. Conversion', link: '#' },
  { image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', label: '04. Delivery', link: '#' },
  { image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', label: '05. Expansion', link: '#' }
];

export default function AccordionGallery({
  items = DEFAULT_ITEMS,
  defaultIndex = 2,
  accentColor = '#38BDF8',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 500,
  gap = 12,
  radius = 20,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 6,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = false,
  className = '',
  onActiveChange
}: AccordionGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const badgeRefs = useRef<(HTMLElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(360);

  const vertical = orientation === 'vertical';
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const updateActive = useCallback((newIndex: number) => {
    setActive(newIndex);
    if (onActiveChange) {
      onActiveChange(newIndex);
    }
  }, [onActiveChange]);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const overlayBg = `linear-gradient(180deg, transparent 35%, color-mix(in srgb, ${overlayColor} 82%, transparent) 100%), color-mix(in srgb, ${overlayColor} calc(var(--ag-dim, 0.35) * 100%), transparent)`;

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = animate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];
        const badge = badgeRefs.current[i];

        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease, force3D: true }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.06;
          const gray = grayscale ? (isActive ? 0 : 0.8) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.45,
              duration: dur,
              ease,
              force3D: true,
            },
            0
          );
        }

        if (showLabels && (bar || text || badge)) {
          const targets = [bar, text, badge].filter(Boolean) as HTMLElement[];
          if (isActive) {
            tl.to(targets, { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger, force3D: true }, 0);
          } else {
            tl.to(targets, { opacity: 0, x: -14, duration: dur * 0.6, ease, force3D: true }, 0);
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      tilt,
      parallax,
      grayscale,
      showLabels,
      stagger,
      prefersReduced
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(160, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.25);
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const handleEnter = (i: number) => {
    if (trigger === 'hover') updateActive(i);
  };

  const handleClick = (i: number, e: MouseEvent) => {
    if (i !== active) {
      e.preventDefault();
      updateActive(i);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      updateActive((i + 1) % count);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      updateActive((i - 1 + count) % count);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`flex ${vertical ? 'flex-col' : 'flex-row'} w-full max-w-full [perspective:1400px] max-[640px]:!flex-col max-[640px]:[perspective:none] max-[640px]:!h-[520px] ${className}`}
      style={{ gap: `${gap}px`, height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px` }}
      role="list"
      aria-label="Interactive student journey gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const Tag = (item.link ? 'a' : 'div') as 'a';
        return (
          <Tag
            key={i}
            ref={(el: HTMLElement | null) => {
              panelRefs.current[i] = el;
            }}
            className="group relative block min-w-0 min-h-0 flex-[1_1_0] cursor-pointer overflow-hidden bg-slate-950 no-underline outline-none [transform-style:preserve-3d] [transform-origin:center] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-slate-800/80 focus-visible:[box-shadow:0_0_0_2px_var(--ag-accent),0_10px_30px_-18px_rgba(0,0,0,0.8)] max-[640px]:min-h-[90px] max-[640px]:!transform-none"
            style={
              {
                borderRadius: `${radius}px`,
                '--ag-accent': accentColor,
                willChange: 'flex-grow, transform'
              } as CSSProperties
            }
            href={item.link || undefined}
            onClick={e => handleClick(i, e)}
            onMouseEnter={() => handleEnter(i)}
            onFocus={() => updateActive(i)}
            onKeyDown={e => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
          >
            {/* Background Media Container */}
            <span className="absolute inset-0 overflow-hidden [border-radius:inherit]">
              <span
                ref={(el: HTMLElement | null) => {
                  mediaRefs.current[i] = el;
                }}
                className="absolute top-1/2 left-1/2 [filter:grayscale(var(--ag-gray,0))]"
                style={{
                  width: vertical ? '100%' : 'var(--ag-media-size, 360px)',
                  height: vertical ? 'var(--ag-media-size, 360px)' : '100%',
                  willChange: 'transform, filter'
                }}
              >
                <img
                  src={item.image}
                  alt={item.alt || item.label || ''}
                  draggable={false}
                  className="block h-full w-full select-none object-cover [-webkit-user-drag:none] scale-105"
                />
              </span>
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: overlayBg }}
                aria-hidden="true"
              />
            </span>

            {/* Inactive Vertical Pill Label for Collapsed Panels */}
            {!isActive && (
              <div className="absolute top-4 left-4 z-[2] max-[640px]:hidden">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 font-bold">
                  0{i + 1}
                </span>
              </div>
            )}

            {/* Active Reveal Captions & Details */}
            {showLabels && (
              <span
                className="pointer-events-none absolute bottom-5 left-5 right-5 z-[2] flex flex-col gap-2"
                aria-hidden="true"
              >
                {item.badge && (
                  <span
                    ref={(el: HTMLElement | null) => {
                      badgeRefs.current[i] = el;
                    }}
                    className="self-start px-2.5 py-0.5 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-400/40 text-[10px] font-mono text-cyan-300 font-bold opacity-0"
                  >
                    {item.badge}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span
                    ref={(el: HTMLElement | null) => {
                      barRefs.current[i] = el;
                    }}
                    className="h-[28px] w-[3.5px] flex-none rounded-[3px] opacity-0"
                    style={{
                      background: accentColor,
                      boxShadow: `0 0 14px color-mix(in srgb, ${accentColor} 70%, transparent)`
                    }}
                  />
                  <div className="overflow-hidden">
                    <span
                      ref={(el: HTMLElement | null) => {
                        textRefs.current[i] = el;
                      }}
                      className="block overflow-hidden text-ellipsis whitespace-nowrap text-lg sm:text-xl font-extrabold tracking-tight opacity-0 [text-shadow:0_2px_14px_rgba(0,0,0,0.7)]"
                      style={{ color: textColor }}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="block text-xs font-mono text-slate-300 opacity-90 mt-0.5 truncate max-w-md">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
