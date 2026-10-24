'use client';

import { useId, useState } from 'react';
import { ChipGroup } from './chip-group';
import { cx } from './cx';

export type SizeUnit = 'KB' | 'MB';

const UNIT_OPTIONS = [
  { value: 'KB', label: 'KB' },
  { value: 'MB', label: 'MB' },
] as const;

/**
 * Number field with a KB/MB unit toggle, for a custom target size.
 * Commits on Enter, on blur and on unit change; reports the value in decimal KB.
 */
export function NumberInput({
  label,
  valueKB,
  onCommit,
  minKB = 5,
  maxKB = 50_000,
  disabled,
  className,
}: {
  label: string;
  valueKB: number;
  onCommit: (kb: number) => void;
  minKB?: number;
  maxKB?: number;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const errId = `${id}-err`;
  const [unit, setUnit] = useState<SizeUnit>(valueKB >= 1000 && valueKB % 100 === 0 ? 'MB' : 'KB');
  const [text, setText] = useState(() => String(unit === 'MB' ? valueKB / 1000 : valueKB));
  const [error, setError] = useState(false);

  function commit(raw: string, u: SizeUnit) {
    const n = Number(raw.trim().replace(',', '.'));
    const kb = Math.round(u === 'MB' ? n * 1000 : n);
    if (!raw.trim() || !Number.isFinite(n) || kb < minKB || kb > maxKB) {
      setError(true);
      return;
    }
    setError(false);
    if (kb !== valueKB) onCommit(kb);
  }

  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className="mb-2 block type-small font-semibold text-text">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={error ? errId : undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text, unit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(text, unit);
            }
          }}
          className={cx(
            'h-12 w-28 rounded-control border bg-card px-3 text-base tabular-nums text-text',
            error ? 'border-danger' : 'border-border-strong',
          )}
        />
        <ChipGroup
          label={`${label} unit`}
          hideLabel
          variant="segmented"
          options={UNIT_OPTIONS}
          value={unit}
          disabled={disabled}
          onChange={(u) => {
            setUnit(u);
            commit(text, u);
          }}
        />
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1 type-small text-danger">
          Enter a size between {minKB} KB and {maxKB / 1000} MB.
        </p>
      )}
    </div>
  );
}
