import type { ReactNode } from 'react';

/**
 * Empty space where results will appear (DESIGN.md §3.1). Its height comes
 * from an invisible copy of one finished result (children), so picking a file
 * replaces it in place with no layout shift. Visually empty on purpose.
 */
export function ResultsPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div data-testid="results-placeholder" aria-hidden="true" className="invisible grid gap-4">
      {children}
    </div>
  );
}
