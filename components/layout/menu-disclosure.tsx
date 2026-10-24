'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { ChevronDownIcon } from '@/components/ui/icons';

/**
 * Mobile menu (DESIGN.md §4.2) on a native <details>: it opens and closes
 * without JavaScript, and its links (server-rendered children) are in the HTML.
 * With JavaScript it also closes on Esc (focus back on the button), on a link
 * tap, and on a tap outside. The panel overlays the page below the header,
 * so opening it never moves the layout. Hidden from 768px (desktop links).
 * On short screens where the panel scrolls, a fade with "More below" sits on
 * its bottom edge until the end is reached (QA-22).
 */
export function MenuDisclosure({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);

  // "More below" cue: shown while part of the panel is out of view.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) {
      setMore(false);
      return;
    }
    const check = () => setMore(panel.scrollTop + panel.clientHeight < panel.scrollHeight - 8);
    check();
    panel.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      panel.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const details = ref.current;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || !details) return;
      details.open = false;
      details.querySelector('summary')?.focus();
    }
    function onPointer(e: PointerEvent) {
      if (details && !details.contains(e.target as Node)) details.open = false;
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <details
      ref={ref}
      className="group md:hidden"
      onToggle={(e) => setOpen(e.currentTarget.open)}
      onClick={(e) => {
        // A tap on a menu link closes the menu (client navigation keeps the header).
        if ((e.target as HTMLElement).closest('a') && ref.current) ref.current.open = false;
      }}
    >
      <summary
        aria-label="Menu"
        aria-expanded={open}
        className={`-mr-3 list-none ${iconButtonClasses}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </summary>
      <div
        ref={panelRef}
        className="im-anim im-slide-down absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-52px)] overflow-y-auto overscroll-contain border-b border-border bg-card"
      >
        {children}
        {more && (
          <div
            aria-hidden="true"
            data-testid="menu-more"
            className="pointer-events-none sticky bottom-0 -mt-14 flex h-14 items-end justify-center bg-linear-to-t from-card from-40% to-transparent pb-1.5"
          >
            <span className="flex items-center gap-1 type-caption text-muted">
              More below
              <ChevronDownIcon size={20} className="size-4" />
            </span>
          </div>
        )}
      </div>
    </details>
  );
}
