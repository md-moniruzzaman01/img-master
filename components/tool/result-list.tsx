'use client';

import { useId, type ReactNode, type Ref } from 'react';
import { copy } from './copy';

const HEADING = 'scroll-mt-4 type-h3 text-text focus:outline-none';

/** "Results" heading (receives focus when done) + ordered list of cards. */
export function ResultList({
  headingRef,
  status,
  ghost = false,
  children,
}: {
  headingRef?: Ref<HTMLHeadingElement>;
  /** Progress bar or summary under the heading, in a fixed-height slot. */
  status?: ReactNode;
  /** Invisible stand-in for the idle placeholder: same boxes, no heading or QA hooks. */
  ghost?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      className="min-w-0"
      aria-labelledby={ghost ? undefined : id}
      data-testid={ghost ? undefined : 'results'}
    >
      {ghost ? (
        <p className={HEADING}>{copy.results}</p>
      ) : (
        <h2 id={id} ref={headingRef} tabIndex={-1} className={HEADING}>
          {copy.results}
        </h2>
      )}
      <div className="mt-2 min-h-11">{status}</div>
      <ol className="mt-2 grid gap-3 [&>*]:min-w-0">{children}</ol>
    </section>
  );
}
