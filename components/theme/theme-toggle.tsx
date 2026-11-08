'use client';

import { useSyncExternalStore } from 'react';
import { cx } from '@/components/ui/cx';
import { borderedIconClasses, iconButtonClasses } from '@/components/ui/icon-button';
import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { getTheme, setTheme, subscribeTheme } from './theme';

/** Dark mode on/off. `pill`: labeled button for the mobile menu. */
export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'pill' }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light' as const);
  const dark = theme === 'dark';
  const toggle = () => setTheme(dark ? 'light' : 'dark');
  if (variant === 'pill') {
    return (
      <button
        type="button"
        aria-pressed={dark}
        data-testid="theme-toggle"
        onClick={toggle}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-control border border-line bg-card px-4 font-medium text-ink-2"
      >
        <MoonIcon size={20} />
        Dark mode
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label="Dark mode"
      aria-pressed={dark}
      data-testid="theme-toggle"
      onClick={toggle}
      className={cx(iconButtonClasses, borderedIconClasses)}
    >
      {dark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}
