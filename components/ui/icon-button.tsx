import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  'aria-label': string;
  children: ReactNode;
};

/** 48 × 48 icon-only button. `aria-label` is required. */
export function IconButton({ className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-control text-text',
        'transition-colors duration-150 ease-out hover:bg-surface-2 active:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
