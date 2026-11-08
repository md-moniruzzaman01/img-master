'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { SearchItem } from '@/lib/types';
import { cx } from '@/components/ui/cx';
import { ReturnIcon, SearchIcon } from '@/components/ui/icons';
import { searchTools } from './match';

export interface SearchPaletteProps {
  items: SearchItem[];
  onClose: () => void;
}

const MAX = 8;

/**
 * Ctrl+K palette (spec §6): a modal dialog with a combobox input and a listbox
 * of tools (aria-activedescendant). ↑↓ move, ↵ opens, Esc closes. Focus stays
 * on the input and goes back to what opened it. Loaded on demand by SearchLauncher.
 */
export function SearchPalette({ items, onClose }: SearchPaletteProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => searchTools(items, query).slice(0, MAX), [items, query]);
  const current = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('sheet-open');
    inputRef.current?.focus();
    return () => {
      document.documentElement.classList.remove('sheet-open');
    };
  }, []);

  function handleClose() {
    document.documentElement.classList.remove('sheet-open');
    const el = returnTo.current;
    if (el && document.contains(el)) el.focus();
    onClose();
  }

  function go(item: SearchItem | undefined) {
    if (!item) return;
    router.push(item.href);
    ref.current?.close();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      const d = e.key === 'ArrowDown' ? 1 : -1;
      const next = (current + d + results.length) % results.length;
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[current]);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-label="Search tools"
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      onKeyDown={(e) => {
        // Two stops (input, Esc button): keep Tab inside the dialog.
        if (e.key !== 'Tab') return;
        const stops = Array.from(ref.current?.querySelectorAll<HTMLElement>('input, button') ?? []);
        const i = stops.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        stops[(i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus();
      }}
      className="fixed inset-x-0 top-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-card p-0 text-ink backdrop:bg-scrim sm:top-[12vh] sm:mx-auto sm:h-auto sm:max-h-[76vh] sm:w-[640px] sm:rounded-card sm:shadow-float"
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <div className="flex items-center gap-3 border-b border-line px-4 sm:px-5">
          <SearchIcon size={22} className="shrink-0 text-ink-2" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label="Search tools"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `${listId}-${current}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Try “webp” or “50”"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-16 min-w-0 flex-1 bg-transparent text-lg font-bold text-ink caret-shu outline-none placeholder:font-normal placeholder:text-muted sm:h-20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="inline-flex min-h-12 shrink-0 items-center rounded-control px-2 text-xs font-bold text-ink-2"
          >
            <kbd className="rounded-[3px] bg-paper-2 px-1.5 py-0.5 font-sans">Esc</kbd>
            <span className="sr-only"> Close search</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <p aria-hidden="true" className="px-3 pt-2 pb-1 type-eyebrow text-kin-text">
            Tools
          </p>
          <ul id={listId} role="listbox" aria-label="Tools">
            {results.map((item, i) => (
              <li
                key={item.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === current}
                onPointerMove={() => setActive(i)}
                onClick={() => go(item)}
                className={cx(
                  'flex min-h-16 cursor-pointer items-center gap-4 rounded-card px-3 py-2',
                  i === current ? 'bg-shu-soft' : 'hover:bg-paper-2',
                )}
              >
                <span aria-hidden="true" className="kanji w-10 shrink-0 text-center text-lg text-shu">
                  {item.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink">{item.title}</span>
                  <span className="block truncate type-small text-ink-2">{item.description}</span>
                </span>
                {i === current && <ReturnIcon size={20} className="shrink-0 text-accent-strong" />}
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p role="status" className="px-3 py-6 text-ink-2">
              No tool matches “{query.trim()}”. Try “webp” or “50”.
            </p>
          )}
        </div>
        <div
          aria-hidden="true"
          className="hidden gap-5 border-t border-line bg-paper-2 px-5 py-3 type-caption text-ink-2 sm:flex"
        >
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </dialog>
  );
}
