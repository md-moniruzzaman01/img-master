import type { ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

// Tool and text columns share one width, so on tool pages the tool, its
// results and the content below all start at the same left edge (QA-16).
const widths = {
  tool: 'max-w-[680px]',
  text: 'max-w-[680px]',
  wide: 'max-w-[1024px]',
} as const;

/**
 * The tool column fills the first screen (viewport minus the 52px header),
 * capped at 56rem for very tall screens. Content after it starts at the fold,
 * so results can land without moving anything the visitor can see (CLS),
 * and without holding a whole invisible result card of blank space (QA-18).
 */
const minHeights = {
  tool: 'min-h-[min(calc(100svh-52px),56rem)]',
  text: undefined,
  wide: undefined,
} as const;

/** Centered column with page gutters: 16px on mobile, 24px from 640px. */
export function Container({
  size,
  className,
  children,
}: {
  size: 'tool' | 'text' | 'wide';
  className?: string;
  children: ReactNode;
}) {
  // Max widths include the gutters' content box, so add the padding on top.
  return (
    <div className={cx('mx-auto w-full px-4 sm:px-6', minHeights[size], className)}>
      <div className={cx('mx-auto w-full', widths[size])}>{children}</div>
    </div>
  );
}
