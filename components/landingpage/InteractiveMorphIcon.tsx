'use client';

import React from 'react';
import { MorphIcon, type MorphIconProps } from 'morphicons/react';

export interface InteractiveMorphIconProps extends MorphIconProps {
  fromIcon?: string;
  toIcon?: string;
  isToggled?: boolean;
}

export default function InteractiveMorphIcon({
  fromIcon,
  toIcon,
  isToggled = false,
  icon,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  spring = 'snappy',
  ...props
}: InteractiveMorphIconProps) {
  const activeIcon = fromIcon && toIcon ? (isToggled ? toIcon : fromIcon) : icon;

  return (
    <MorphIcon
      icon={activeIcon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      spring={spring}
      {...props}
    />
  );
}
