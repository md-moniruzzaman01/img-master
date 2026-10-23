'use client';

import type { ImageFormat } from '@/lib/types';
import { ChipGroup } from '@/components/ui/chip-group';
import { FORMAT_LABEL } from './format';

/** Segmented JPG / PNG / WebP control, limited to the formats a tool allows. */
export function FormatSelect<F extends ImageFormat>({
  label,
  value,
  formats,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: F;
  formats: readonly F[];
  onChange: (f: F) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <ChipGroup
      label={label}
      variant="segmented"
      inlineLabel
      options={formats.map((f) => ({ value: f, label: FORMAT_LABEL[f] }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}
