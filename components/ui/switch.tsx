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
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block font-medium text-text">{label}</span>
        {description && <span className="block type-small text-muted">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out',
          checked ? 'border-primary bg-primary' : 'border-border-strong bg-surface-2',
        )}
      >
        <span
          className={cx(
            'absolute left-0.5 size-[22px] rounded-full transition-transform duration-150 ease-out',
            checked ? 'translate-x-5 bg-on-primary' : 'translate-x-0 bg-border-strong',
          )}
        />
      </span>
    </button>
  );
}
