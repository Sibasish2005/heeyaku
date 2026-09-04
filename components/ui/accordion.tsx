'use client';

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  activeItem: string | null;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  type = "single",
  defaultValue,
  children,
  className,
}: {
  type?: "single";
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [activeItem, setActiveItem] = React.useState<string | null>(defaultValue || null);

  const toggleItem = (value: string) => {
    setActiveItem((prev) => (prev === value ? null : value));
  };

  return (
    <AccordionContext.Provider value={{ activeItem, toggleItem }}>
      <div className={cn("divide-y divide-slate-100", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-2", className)} data-value={value}>
      {children}
    </div>
  );
}

export function AccordionTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context?.activeItem === value;

  return (
    <button
      type="button"
      onClick={() => context?.toggleItem(value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-bold text-base sm:text-lg text-[#0B1F33] transition-colors hover:text-[#2563EB]",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180 text-[#2563EB]"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  const isOpen = context?.activeItem === value;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={cn("pb-4 pt-1 text-sm text-slate-600 leading-relaxed", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
