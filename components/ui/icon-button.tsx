import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  'aria-label': string;
  children: ReactNode;
};

/** Classes for a 48 × 48 icon-only control (also used on <summary>). */
export const iconButtonClasses =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-control text-text ' +
  'transition-colors duration-150 ease-out hover:bg-surface active:bg-surface';

/** 48 × 48 icon-only button. `aria-label` is required. */
export function IconButton({ className, type = 'button', ...props }: IconButtonProps) {
  return <button type={type} className={cx(iconButtonClasses, className)} {...props} />;
}
