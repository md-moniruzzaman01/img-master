'use client';

import { Slider } from '@/components/ui/slider';

/** Quality 10–100. Lower makes smaller files. */
export function QualitySlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <Slider
      label="Quality"
      min={10}
      max={100}
      value={value}
      onChange={onChange}
      disabled={disabled}
      hint="Lower quality makes a smaller file." // invented
    />
  );
}
