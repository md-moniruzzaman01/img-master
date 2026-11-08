import type { ReactNode } from 'react';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'busy' | 'accent';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-paper-2 text-ink-2',
  success: 'bg-matcha-soft text-matcha',
  danger: 'bg-shu-soft text-accent-strong',
  busy: 'bg-shu-soft text-accent-strong',
  // Solid crimson ("MOST USED").
  accent: 'bg-shu text-white type-eyebrow !text-[0.625rem] !tracking-[0.12em]',
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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.8125rem] leading-5 font-bold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
