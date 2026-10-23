'use client';

import { ChipGroup } from '@/components/ui/chip-group';
import { NumberInput } from '@/components/ui/number-input';
import { targetChip } from './format';
import { SIZE_PRESETS } from './tool-options';

const OPTIONS = [
  ...SIZE_PRESETS.map((kb) => ({ value: String(kb), label: targetChip(kb) })),
  { value: 'custom', label: 'Custom' },
];

/** Preset target sizes + Custom (number with KB/MB). */
export function TargetSizeChips({
  targetKB,
  custom,
  onChange,
  disabled,
}: {
  targetKB: number;
  custom: boolean;
  /** `custom` true when the value came from the Custom field. */
  onChange: (kb: number, custom: boolean) => void;
  disabled?: boolean;
}) {
  const isPreset = (SIZE_PRESETS as readonly number[]).includes(targetKB);
  const selected = custom || !isPreset ? 'custom' : String(targetKB);
  return (
    <div className="grid gap-3">
      <ChipGroup
        label="Target size"
        options={OPTIONS}
        value={selected}
        disabled={disabled}
        onChange={(v) => {
          if (v === 'custom') onChange(targetKB, true);
          else onChange(Number(v), false);
        }}
      />
      {selected === 'custom' && (
        <NumberInput
          key={targetKB}
          label="Custom size"
          valueKB={targetKB}
          disabled={disabled}
          onCommit={(kb) => onChange(kb, true)}
        />
      )}
    </div>
  );
}
