import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold no-underline ' +
  'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  // The one brand color.
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  // Gray button: light gray fill, 1px border.
  secondary:
    'border border-border bg-surface text-text hover:border-border-strong active:border-border-strong',
  // Plain text button (low emphasis, e.g. "Compress another").
  ghost: 'bg-transparent text-primary underline-offset-4 hover:underline',
  danger: 'bg-danger text-on-primary hover:opacity-90 active:opacity-90',
};

const sizes: Record<ButtonSize, string> = {
  lg: 'min-h-[52px] w-full px-5 text-base',
  md: 'min-h-12 px-4 text-base',
};

/** Shared classes so labels and download links can look like buttons. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(base, variants[variant], sizes[size], className);
}
