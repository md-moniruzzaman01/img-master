'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import type { SearchItem } from '@/lib/types';
import { cx } from '@/components/ui/cx';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { SearchIcon } from '@/components/ui/icons';
import type { SearchPaletteProps } from './search-palette';

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Header search: a field-styled button on wide screens ("Search tools ⌘K"), an
 * icon elsewhere, and the Ctrl/⌘+K shortcut. Both are links to /tools, so they
 * work without JavaScript. The palette code loads only when first opened.
 */
export function SearchLauncher({ items }: { items: SearchItem[] }) {
  const [Palette, setPalette] = useState<ComponentType<SearchPaletteProps> | null>(null);
  const [open, setOpen] = useState(false);
  const mac = useSyncExternalStore(noop, isMac, () => false);
  const loading = useRef(false);

  const show = useCallback(() => {
    setOpen(true);
    if (loading.current) return;
    loading.current = true;
    void import('./search-palette')
      .then((m) => setPalette(() => m.SearchPalette))
      .catch(() => {
        loading.current = false;
        // Chunk failed to load: a full page load is the intended fallback, not client routing.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/tools');
      });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        show();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    show();
  };

  return (
    <>
      <Link
        href="/tools"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden h-12 min-w-[10.5rem] items-center gap-2 rounded-control border border-line bg-card px-3 text-[0.9375rem] whitespace-nowrap text-muted no-underline hover:border-line-strong xl:flex"
      >
        <SearchIcon size={18} className="shrink-0 text-ink-2" />
        <span className="flex-1">Search tools</span>
        <kbd className="rounded-[3px] bg-paper-2 px-1.5 font-sans text-xs font-bold text-ink-2">
          {mac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </Link>
      <Link
        href="/tools"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label="Search tools"
        className={cx(iconButtonClasses, 'xl:hidden')}
      >
        <SearchIcon size={24} />
      </Link>
      {open && Palette && <Palette items={items} onClose={() => setOpen(false)} />}
    </>
  );
}
