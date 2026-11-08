// Light/dark theme: <html data-theme>, saved in localStorage (try/catch).
// app/layout.tsx sets the attribute before first paint with the same key.
import type { Theme } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';

const listeners = new Set<() => void>();

export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTheme(): Theme {
  try {
    const t = document.documentElement.getAttribute(siteConfig.theme.attribute);
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute(siteConfig.theme.attribute, theme);
  try {
    localStorage.setItem(siteConfig.theme.storageKey, theme);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  for (const fn of listeners) fn();
}
