'use client';

import { useId, type ReactNode, type Ref } from 'react';
import { copy } from './copy';

/** "Results" heading (receives focus when done) + ordered list of cards. */
export function ResultList({
  headingRef,
  status,
  children,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  /** Progress bar or summary under the heading, in a fixed-height slot. */
  status?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} data-testid="results">
      <h2 id={id} ref={headingRef} tabIndex={-1} className="scroll-mt-4 type-h3 text-text focus:outline-none">
        {copy.results}
      </h2>
      <div className="mt-2 min-h-11">{status}</div>
      <ol className="mt-2 grid gap-3">{children}</ol>
    </section>
  );
}
