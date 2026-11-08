import type { ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

/**
 * Crimson glyph + Mincho H2 + optional one-line intro (every Figma section).
 * The glyph is decorative (aria-hidden); the heading text carries the meaning.
 */
export function SectionHeading({
  glyph,
  heading,
  intro,
  id,
  as: H = 'h2',
  count,
  aside,
  className,
  onBand = false,
}: {
  glyph?: string;
  heading: string;
  intro?: ReactNode;
  id?: string;
  as?: 'h2' | 'h3';
  /** Small superscript count after the heading ("Compress ⁷"). */
  count?: number;
  /** Right-hand label, e.g. "EXAMPLE IMAGE". */
  aside?: ReactNode;
  className?: string;
  onBand?: boolean;
}) {
  return (
    <div className={cx('flex items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3 lg:gap-5">
        {glyph && (
          <span
            aria-hidden="true"
            className="kanji shrink-0 text-[1.5rem] leading-[1.875rem] text-shu lg:text-[2.375rem] lg:leading-[2.75rem]"
          >
            {glyph}
          </span>
        )}
        <div className="min-w-0">
          <H
            id={id}
            className={cx(
              H === 'h2' ? 'type-h2' : 'type-h3',
              'text-balance',
              onBand ? 'text-on-band' : 'text-ink',
            )}
          >
            {heading}
            {count !== undefined && (
              <sup className="ml-1.5 align-super font-sans text-xs font-bold text-muted">{count}</sup>
            )}
          </H>
          {intro && (
            <p className={cx('mt-2 max-w-[42rem] type-subtitle', onBand ? 'text-on-band-muted' : 'text-muted')}>
              {intro}
            </p>
          )}
        </div>
      </div>
      {aside && <div className="hidden shrink-0 pb-1 sm:block">{aside}</div>}
    </div>
  );
}
