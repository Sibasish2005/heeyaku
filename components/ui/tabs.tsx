'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be rendered inside a <Tabs> component");
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [selected, setSelected] = React.useState(defaultValue);
  const current = value !== undefined ? value : selected;
  const handleChange = onValueChange || setSelected;

  return (
    <TabsContext.Provider value={{ value: current, onValueChange: handleChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500",
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs();
  const isActive = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-[#2563EB] shadow-xs"
          : "text-slate-600 hover:text-[#0B1F33]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: selectedValue } = useTabs();
  if (selectedValue !== value) return null;

  return (
    <div
      className={cn(
        "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
