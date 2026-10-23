import type { ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

const widths = {
  tool: 'max-w-[640px]',
  text: 'max-w-[680px]',
  wide: 'max-w-[1024px]',
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
    <div className={cx('mx-auto w-full px-4 sm:px-6', className)}>
      <div className={cx('mx-auto w-full', widths[size])}>{children}</div>
    </div>
  );
}
