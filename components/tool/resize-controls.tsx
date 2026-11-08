'use client';

import { useId } from 'react';
import { ChipGroup } from '@/components/ui/chip-group';
import { Switch } from '@/components/ui/switch';
import { copy } from './copy';
import { NumberField } from './number-field';
import { RESIZE_LIMITS, resizeProblem, type ToolOptions } from './tool-options';
import type { ImageFormat } from '@/lib/types';

type Patch = Partial<ToolOptions>;

function hintFor(o: ToolOptions, waiting: boolean): { text: string; bad: boolean } {
  const problem = resizeProblem(o);
  if (problem) {
    const text =
      problem === 'percent'
        ? copy.resizeBadPercent
        : problem === 'range'
          ? copy.resizeBadPixels
          : copy.resizeNeedSize;
    return { text: waiting ? `${text} ${copy.resizeWaiting}` : text, bad: true };
  }
  if (o.resizeBy === 'percent') return { text: copy.resizePercentHint, bad: false };
  if (o.keepRatio && o.width > 0 && o.height > 0) return { text: copy.resizeFitHint, bad: false };
  return { text: copy.resizeHint, bad: false };
}

/** Primary resize controls: Pixels | Percent, size fields, ratio lock. */
export function ResizePrimary({
  options,
  onChange,
  waiting,
}: {
  options: ToolOptions;
  onChange: (patch: Patch) => void;
  /** A file is waiting for valid input. */
  waiting: boolean;
}) {
  const hintId = useId();
  const px = options.resizeBy === 'px';
  const problem = resizeProblem(options);
  const { text, bad } = hintFor(options, waiting);
  const bothEmpty = problem === 'empty';
  const badPx = problem === 'range';

  return (
    <div className="grid gap-2" data-testid="resize-controls">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <ChipGroup
          label={copy.resizeBy}
          hideLabel
          variant="segmented"
          options={[
            { value: 'px', label: copy.byPixels },
            { value: 'percent', label: copy.byPercent },
          ]}
          value={options.resizeBy}
          onChange={(resizeBy) => onChange({ resizeBy })}
        />
        {px ? (
          <Switch
            label={copy.keepRatio}
            checked={options.keepRatio}
            onChange={(keepRatio) => onChange({ keepRatio })}
          />
        ) : (
          <span />
        )}
      </div>
      {px ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={copy.width}
            value={options.width}
            onChange={(width) => onChange({ width })}
            placeholder={copy.auto}
            suffix="px"
            invalid={bothEmpty || (badPx && options.width > RESIZE_LIMITS.max)}
            describedBy={hintId}
          />
          <NumberField
            label={copy.height}
            value={options.height}
            onChange={(height) => onChange({ height })}
            placeholder={copy.auto}
            suffix="px"
            invalid={bothEmpty || (badPx && options.height > RESIZE_LIMITS.max)}
            describedBy={hintId}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 items-end gap-3">
          <NumberField
            label={copy.percent}
            value={options.percent}
            onChange={(percent) => onChange({ percent })}
            suffix="%"
            invalid={problem === 'percent'}
            describedBy={hintId}
          />
          <p className="type-small leading-4 text-muted">{copy.percentKeeps}</p>
        </div>
      )}
      <p
        id={hintId}
        aria-live="polite"
        className={bad ? 'min-h-5 type-small font-semibold text-accent-strong' : 'min-h-5 type-small text-muted'}
      >
        {text}
      </p>
    </div>
  );
}

export type ResizeFormatValue = ImageFormat | 'same';

/** "Format" row for More options. */
export function ResizeFormat({
  value,
  onChange,
}: {
  value: ResizeFormatValue;
  onChange: (v: ResizeFormatValue) => void;
}) {
  return (
    <ChipGroup
      label={copy.formatLabel}
      variant="segmented"
      className="[&>div]:flex"
      options={[
        { value: 'same', label: copy.sameShort, ariaLabel: copy.sameFormat },
        { value: 'jpeg', label: 'JPG' },
        { value: 'png', label: 'PNG' },
        { value: 'webp', label: 'WebP' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
