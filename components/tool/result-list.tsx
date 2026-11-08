'use client';

import { useId, type ReactNode, type Ref } from 'react';
import { cx } from '@/components/ui/cx';
import { copy } from './copy';

export type ResultTone = 'processing' | 'done' | 'partial' | 'error';

/**
 * "Results" heading (receives focus when done, visually hidden) + a summary
 * banner with the hanko stamp + the ordered list of cards.
 */
export function ResultList({
  headingRef,
  status,
  tone = 'done',
  children,
}: {
  headingRef?: Ref<HTMLHeadingElement>;
  status?: ReactNode;
  tone?: ResultTone;
  children: ReactNode;
}) {
  const id = useId();
  const stamped = tone !== 'processing';
  return (
    <section className="min-w-0" aria-labelledby={id} data-testid="results">
      <h2 id={id} ref={headingRef} tabIndex={-1} className="sr-only focus:outline-none">
        {copy.results}
      </h2>
      <div
        className={cx(
          'flex min-h-[5.5rem] items-center gap-4 rounded-card p-4',
          tone === 'done' && 'bg-matcha-soft',
          (tone === 'partial' || tone === 'error') && 'bg-shu-soft',
        )}
      >
        {stamped ? (
          <span
            aria-hidden="true"
            className="kanji grid size-14 shrink-0 -rotate-6 place-items-center rounded-[6px] border-[3px] border-shu text-2xl leading-none font-extrabold text-shu"
          >
            {tone === 'done' ? '済' : '断'}
          </span>
        ) : (
          // Holds the stamp's room, so the text beside it doesn't slide when the stamp lands.
          <span aria-hidden="true" className="size-14 shrink-0" />
        )}
        <div
          className={cx(
            'flex min-h-14 min-w-0 flex-1 flex-col justify-center',
            stamped &&
              '[&_p]:font-display [&_p]:text-xl [&_p]:leading-7 [&_p]:font-extrabold sm:[&>div]:flex sm:[&>div]:flex-wrap sm:[&>div]:items-center sm:[&>div]:justify-between sm:[&>div]:gap-3',
          )}
        >
          {status}
        </div>
      </div>
      <ol className="mt-3 grid gap-3 [&>*]:min-w-0">{children}</ol>
    </section>
  );
}
