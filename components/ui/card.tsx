import type { HTMLAttributes } from 'react';
import { cx } from './cx';

/** Surface + 1px border + 12px radius. Padding 16px mobile, 20px desktop. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-card border border-border bg-surface p-4 lg:p-5', className)}
      {...props}
    />
  );
}
