'use client';

import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface TiltedCardProps {
  imageSrc: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  className?: string;
}

const springValues = {
  damping: 25,
  stiffness: 150,
  mass: 1,
};

export default function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  imageHeight = '300px',
  imageWidth = '100%',
  scaleOnHover = 1.03,
  rotateAmplitude = 12,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  className = '',
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useSpring(0, springValues);
  const y = useSpring(0, springValues);
  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });

  const lastYRef = useRef(0);

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastYRef.current;
    rotateFigcaption.set(-velocityY * 0.6);
    lastYRef.current = offsetY;
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  return (
    <figure
      ref={ref}
      className={`relative w-full h-full flex flex-col items-center justify-center [perspective:800px] ${className}`}
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
        }}
      >
        <motion.img
          src={imageSrc}
          alt={altText}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl select-none"
        />

        {displayOverlayContent && overlayContent && (
          <motion.div className="absolute inset-0 z-[2] will-change-transform [transform:translateZ(30px)]">
            {overlayContent}
          </motion.div>
        )}

        {/* Dynamic Light Glare on Hover */}
        <motion.div
          className="absolute inset-0 z-[3] bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none rounded-2xl"
          style={{
            opacity,
          }}
        />
      </motion.div>

      {showTooltip && captionText && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 rounded-[6px] bg-[#0E1014]/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-cyan-300 font-semibold border border-white/10 z-[4] hidden sm:block shadow-lg"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
