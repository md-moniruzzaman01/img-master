import type { HTMLAttributes } from 'react';
import { cx } from './cx';

/** White card with a 1px border and 8px radius (no shadow). Padding 16px mobile, 20px desktop. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-card border border-border bg-card p-4 lg:p-5', className)}
      {...props}
    />
  );
}
