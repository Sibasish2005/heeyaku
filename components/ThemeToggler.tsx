'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeTogglerProps {
  className?: string;
  showLabels?: boolean;
}

export default function ThemeToggler({ className = '', showLabels = false }: ThemeTogglerProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`p-1.5 rounded-lg border border-border bg-muted/40 w-8 h-8 ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/80 bg-card/60 backdrop-blur-xs transition-[color,background-color,border-color] duration-160 cursor-pointer ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current theme: ${theme}. Click to switch.`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-[transform,opacity] duration-200 ease-out" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 transition-[transform,opacity] duration-200 ease-out" />
        )}
      </div>
      {showLabels && (
        <span className="text-xs font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
