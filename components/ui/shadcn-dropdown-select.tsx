'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownSelectOption {
  value: string;
  label: React.ReactNode;
  text?: string; // fallback string for display when label is a JSX element
  icon?: React.ReactNode;
}

interface ShadcnDropdownSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * Modern shadcn-based Dropdown Menu selector.
 * Replaces native HTML <select> and <option> tags with an accessible,
 * floating animated popover menu matching https://ui.shadcn.com/docs/components/base/dropdown-menu.
 */
export default function ShadcnDropdownSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select option...',
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
}: ShadcnDropdownSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative w-full', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs font-medium text-foreground outline-hidden transition-colors hover:bg-muted/60 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-left',
            triggerClassName
          )}
        >
          <span className="truncate">
            {selectedOption ? (selectedOption.text || selectedOption.label) : placeholder}
          </span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[var(--anchor-width)] max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 shadow-lg backdrop-blur-xs',
            contentClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onValueChange(opt.value)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-popover-foreground transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 font-bold'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#2563EB] dark:text-blue-400" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
