import type { ReactNode } from 'react';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-border text-text',
  danger: 'border-danger text-danger',
};

/** Small status label. Pair it with an icon or words, never color alone. */
export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border bg-bg px-2 py-0.5 type-caption whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
