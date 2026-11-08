'use client';

import { useId, useState } from 'react';
import { cx } from '@/components/ui/cx';

/**
 * Whole-number field (resize width, height, percent). Reports 0 when empty, so
 * the parent decides what "empty" means (Auto, or invalid). Digits only.
 */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  invalid,
  describedBy,
  disabled,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  suffix?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const show = (n: number) => (n > 0 && Number.isFinite(n) ? String(n) : '');
  const [text, setText] = useState(() => show(value));
  // Follow outside changes (remembered values arriving, a reset) without fighting typing.
  if ((text === '' ? 0 : Number(text)) !== value) setText(show(value));

  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block type-small font-bold text-ink">
        {label}
      </label>
      <div
        className={cx(
          'flex h-12 items-center gap-1 rounded-control border-[1.5px] bg-card px-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
          invalid ? 'border-shu' : 'border-ink',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={6}
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
            setText(digits);
            onChange(digits === '' ? 0 : Number(digits));
          }}
          className="-my-[1.5px] h-12 min-w-0 flex-1 bg-transparent text-base font-bold tabular-nums text-ink outline-none placeholder:font-semibold placeholder:text-muted"
        />
        {suffix && (
          <span aria-hidden="true" className="shrink-0 type-small font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
