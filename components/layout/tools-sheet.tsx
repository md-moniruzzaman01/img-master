'use client';

import { lazy, Suspense, useState } from 'react';
import type { ToolNavGroup } from '@/lib/types';

const loadPanel = () => import('./tools-sheet-panel');
const ToolsSheetPanel = lazy(() => loadPanel().then((m) => ({ default: m.ToolsSheetPanel })));

/**
 * "Tools" button (DESIGN.md §4.2). The sheet is fetched on first intent
 * (hover, focus, touch) and mounted on first tap, then kept for reuse.
 */
export function ToolsSheet({ groups }: { groups: ToolNavGroup[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const warm = () => void loadPanel().catch(() => {});

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={warm}
        onPointerDown={warm}
        onFocus={warm}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="-mr-2 inline-flex min-h-12 items-center gap-2 rounded-control px-3 font-semibold text-text transition-colors duration-150 ease-out hover:bg-surface-2"
      >
        {/* Same path as MenuIcon, inlined so the header doesn't pull in the icon set. */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Tools
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <ToolsSheetPanel groups={groups} open={open} close={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
