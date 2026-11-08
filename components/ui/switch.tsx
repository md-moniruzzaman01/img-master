'use client';

import { cx } from './cx';

/** Accessible on/off toggle with a visible label (the whole row is the 48px target). */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'flex min-h-12 w-full items-center justify-between gap-4 rounded-control py-2 text-left',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block type-small font-bold text-ink">{label}</span>
        {description && <span className="block type-small text-muted">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out',
          checked ? 'border-shu bg-shu' : 'border-line-strong bg-paper-2',
        )}
      >
        <span
          className={cx(
            'absolute left-0.5 size-[22px] rounded-full transition-transform duration-150 ease-out',
            checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-line-strong',
          )}
        />
      </span>
    </button>
  );
}
