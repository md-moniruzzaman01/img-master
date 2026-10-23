import type { ReactNode } from 'react';
import { cx } from './cx';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<BadgeTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-muted',
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
        'inline-flex items-center gap-1 rounded-full border border-current/30 px-2 py-0.5 type-caption whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
