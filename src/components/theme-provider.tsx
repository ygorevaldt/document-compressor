'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'document-compressor-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light');

  // Apply theme to document
  const applyTheme = React.useCallback((targetTheme: Theme) => {
    const isDark =
      targetTheme === 'dark' ||
      (targetTheme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
    }
  }, []);

  // Initialize theme from storage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme('system');
    }
  }, [applyTheme]);

  // Listen to OS color scheme changes when theme === 'system'
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, applyTheme]);

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore localStorage errors (e.g. private browsing)
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      let next: Theme;
      if (current === 'system') next = 'dark';
      else if (current === 'dark') next = 'light';
      else next = 'system';

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
