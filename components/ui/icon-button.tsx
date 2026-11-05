import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  'aria-label': string;
  children: ReactNode;
  /** Bordered square (header controls) instead of a bare icon. */
  bordered?: boolean;
};

/** Classes for a 48 × 48 icon-only control (also used on <summary> and links). */
export const iconButtonClasses =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-control text-ink ' +
  'transition-colors duration-150 ease-out hover:bg-paper-2 active:bg-paper-2';

export const borderedIconClasses = 'border border-line bg-card';

/** 48 × 48 icon-only button. `aria-label` is required. */
export function IconButton({ className, bordered, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(iconButtonClasses, bordered && borderedIconClasses, className)}
      {...props}
    />
  );
}
