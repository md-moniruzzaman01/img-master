'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

export interface ChipOption<V extends string> {
  value: V;
  label: ReactNode;
  /** Accessible name when the label isn't plain text. */
  ariaLabel?: string;
}

export interface ChipGroupProps<V extends string> {
  /** Visible label for the group. */
  label: string;
  /** Hide the label visually (it stays the group's accessible name). */
  hideLabel?: boolean;
  options: readonly ChipOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** `chips`: rounded pills, horizontal scroll on mobile. `segmented`: joined control. */
  variant?: 'chips' | 'segmented';
  disabled?: boolean;
  className?: string;
  /** Layout of the label: above (default) or inline to the left. */
  inlineLabel?: boolean;
}

/**
 * Single-choice chips (DESIGN.md §4.1). role="radiogroup" with a roving tabindex:
 * Tab enters on the selected chip, arrow keys / Home / End move the selection.
 */
export function ChipGroup<V extends string>({
  label,
  hideLabel,
  options,
  value,
  onChange,
  variant = 'chips',
  disabled,
  className,
  inlineLabel,
}: ChipGroupProps<V>) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const found = options.findIndex((o) => o.value === value);
  const selectedIndex = Math.max(0, found);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    let next = -1;
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = selectedIndex === last ? 0 : selectedIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = selectedIndex === 0 ? last : selectedIndex - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    const btn = refs.current[next];
    btn?.focus();
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    onChange(options[next].value);
  }

  const segmented = variant === 'segmented';

  return (
    <div className={cx('min-w-0', inlineLabel && 'flex items-center gap-3', className)}>
      <span
        id={labelId}
        className={cx(
          hideLabel
            ? 'sr-only'
            : inlineLabel
              ? 'shrink-0 type-small font-semibold text-text'
              : 'mb-2 block type-small font-semibold text-text',
        )}
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        className={cx(
          segmented
            ? 'inline-flex max-w-full gap-1 rounded-control border border-border bg-surface-2 p-1'
            : 'no-scrollbar fade-end -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0',
        )}
      >
        {options.map((o, i) => {
          const checked = i === selectedIndex && found !== -1;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={o.ariaLabel}
              tabIndex={i === selectedIndex ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={cx(
                'shrink-0 whitespace-nowrap text-base font-semibold tabular-nums',
                'transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60',
                segmented
                  ? cx(
                      'min-h-12 min-w-12 flex-1 rounded-[8px] px-4',
                      checked ? 'bg-primary text-on-primary' : 'text-text hover:bg-bg',
                    )
                  : cx(
                      'min-h-12 rounded-full border px-4',
                      checked
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-border bg-surface-2 text-text hover:border-border-strong',
                    ),
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
