'use client';

import { useId, type CSSProperties } from 'react';
import { cx } from './cx';

/** Native range input with a visible label and value. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  hint,
  disabled,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cx('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-small font-semibold text-text">
          {label}
        </label>
        <output htmlFor={id} className="font-semibold tabular-nums text-text">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        className="im-range block h-12 w-full cursor-pointer appearance-none bg-transparent disabled:opacity-60"
      />
      {hint && <p className="type-small text-muted">{hint}</p>}
    </div>
  );
}
