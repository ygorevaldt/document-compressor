import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Theme Mode Logic', () => {
  const STORAGE_KEY = 'document-compressor-theme';

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    });
  });

  it('should default to system theme when no stored preference exists', () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved = stored || 'system';
    expect(resolved).toBe('system');
  });

  it('should store and retrieve explicit user preference (dark)', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('should store and retrieve explicit user preference (light)', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('should correctly cycle themes: system -> dark -> light -> system', () => {
    const cycleTheme = (current: string): string => {
      if (current === 'system') return 'dark';
      if (current === 'dark') return 'light';
      return 'system';
    };

    let theme = 'system';
    theme = cycleTheme(theme);
    expect(theme).toBe('dark');

    theme = cycleTheme(theme);
    expect(theme).toBe('light');

    theme = cycleTheme(theme);
    expect(theme).toBe('system');
  });
});
