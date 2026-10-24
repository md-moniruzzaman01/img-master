'use client';

import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import { copy } from './copy';

/** "More options" disclosure, collapsed by default (native <details>). */
export function AdvancedOptions({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-card border border-border bg-card" data-testid="more-options">
      <summary className="flex min-h-12 list-none items-center justify-between gap-3 rounded-card px-4 font-semibold text-text">
        {copy.moreOptions}
        <ChevronDownIcon
          size={20}
          className="shrink-0 text-muted transition-transform duration-150 ease-out group-open:rotate-180"
        />
      </summary>
      <div className="grid gap-4 border-t border-border px-4 pt-3 pb-4">{children}</div>
    </details>
  );
}
