import type { HTMLAttributes } from 'react';
import { cx } from './cx';

/** Card surface: card fill, 1px line border, 6px radius, no shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-card border border-line bg-card p-5 lg:p-7', className)} {...props} />
  );
}
