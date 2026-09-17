'use client';

import * as React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from './theme-provider';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('inline-flex items-center gap-1 p-1 rounded-full bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300/60 dark:border-slate-700/60 h-9 w-[108px]', className)}>
        <span className="w-7 h-7" />
      </div>
    );
  }

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5" /> },
    { value: 'system', label: 'Sistema', icon: <Monitor className="w-3.5 h-3.5" /> },
    { value: 'dark', label: 'Escuro', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      role="group"
      aria-label="Alternar tema de cores"
      className={cn(
        'inline-flex items-center gap-0.5 p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/70 backdrop-blur-xs transition-colors',
        className
      )}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={isActive}
            title={`Tema ${opt.label}${opt.value === 'system' ? ' (padrão)' : ''}`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
