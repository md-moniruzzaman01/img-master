import type { ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

// One page grid: 16px gutters on phones, 24px from 640px, 48px from 1024px
// (1184px content at 1280, as in the Figma frames).
const widths = {
  page: 'max-w-[1184px]',
  /** Reading width for legal and info text. */
  text: 'max-w-[760px]',
  /** Old names, same as `page`. */
  tool: 'max-w-[1184px]',
  wide: 'max-w-[1184px]',
} as const;

/** Centered column with page gutters. */
export function Container({
  size = 'page',
  className,
  children,
  as: Tag = 'div',
}: {
  size?: keyof typeof widths;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'header' | 'footer';
}) {
  return (
    <Tag className={cx('mx-auto w-full px-4 sm:px-6 lg:px-12', className)}>
      <div className={cx('mx-auto w-full', widths[size])}>{children}</div>
    </Tag>
  );
}
