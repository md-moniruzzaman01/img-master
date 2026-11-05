'use client';

import { useId, useState } from 'react';
import { cx } from './cx';

export type SizeUnit = 'KB' | 'MB';

/**
 * Size field with a KB/MB unit picker inside one bordered box ("75 KB ▾  Max file size").
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
  labelAfter,
}: {
  label: string;
  valueKB: number;
  onCommit: (kb: number) => void;
  minKB?: number;
  maxKB?: number;
  disabled?: boolean;
  className?: string;
  /** Label to the right of the box (desktop compressor) instead of above it. */
  labelAfter?: boolean;
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

  const labelEl = (
    <label
      htmlFor={id}
      className={cx(
        'type-small',
        labelAfter ? 'text-muted' : 'mb-2 block font-bold text-ink',
      )}
    >
      {label}
    </label>
  );

  return (
    <div className={cx('min-w-0', className)}>
      {!labelAfter && labelEl}
      <div className="flex items-center gap-3">
        <div
          className={cx(
            'flex h-12 items-center gap-1 rounded-control border-[1.5px] bg-card pr-1.5 pl-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
            error ? 'border-shu' : 'border-ink',
          )}
        >
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
            className="w-14 bg-transparent text-base font-bold tabular-nums text-ink outline-none"
          />
          <select
            aria-label={`${label}: unit`}
            value={unit}
            disabled={disabled}
            onChange={(e) => {
              const u = e.target.value as SizeUnit;
              setUnit(u);
              commit(text, u);
            }}
            className="im-select h-9 rounded-control bg-paper-2 pl-2 text-[1rem] font-bold text-ink"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
        {labelAfter && labelEl}
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1 type-small text-accent-strong">
          Enter a size between {minKB} KB and {maxKB / 1000} MB.
        </p>
      )}
    </div>
  );
}
