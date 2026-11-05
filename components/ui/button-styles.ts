import { cx } from './cx';

export type ButtonVariant =
  | 'primary'
  | 'solid'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'white';
export type ButtonSize = 'lg' | 'md';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-bold no-underline ' +
  'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  // Crimson with white text, in both themes.
  primary: 'bg-shu text-white hover:bg-shu-deep active:bg-shu-deep',
  // Ink fill ("Download"): paper text on ink.
  solid: 'bg-strong text-on-strong hover:opacity-90 active:opacity-90',
  // Ink outline ("Compress more images", "Copy HTML").
  outline: 'border-[1.5px] border-ink bg-transparent text-ink hover:bg-paper-2 active:bg-paper-2',
  // Card with a thin line ("Compare").
  secondary: 'border border-line-strong bg-card text-ink hover:bg-paper-2 active:bg-paper-2',
  // Text link look.
  ghost: 'bg-transparent text-accent underline-offset-4 hover:underline',
  // Crimson outline ("Remove").
  danger: 'border border-shu bg-transparent text-accent-strong hover:bg-shu-soft active:bg-shu-soft',
  // White on the crimson CTA band.
  white: 'bg-white text-art-ink hover:bg-paper active:bg-paper',
};

const sizes: Record<ButtonSize, string> = {
  lg: 'min-h-14 w-full px-6 text-base',
  md: 'min-h-12 px-5 text-[0.9375rem]',
};

/** Shared classes so labels and download links can look like buttons. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(base, variants[variant], sizes[size], className);
}
