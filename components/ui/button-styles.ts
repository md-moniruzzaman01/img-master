import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold no-underline ' +
  'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'border border-border-strong bg-bg text-text hover:bg-surface-2 active:bg-surface-2',
  ghost: 'bg-transparent text-primary hover:bg-surface-2 active:bg-surface-2',
  danger: 'bg-danger text-bg hover:opacity-90 active:opacity-90',
};

const sizes: Record<ButtonSize, string> = {
  lg: 'min-h-[52px] w-full px-5 text-base sm:w-auto',
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
