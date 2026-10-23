'use client';

import { ChipGroup } from '@/components/ui/chip-group';
import { faviconCopy as t } from './copy';
import type { FaviconMode } from './favicon-options';

const OPTIONS = [
  { value: 'image', label: t.modeImage },
  { value: 'text', label: t.modeText },
  { value: 'emoji', label: t.modeEmoji },
] as const;

/** Image / Text / Emoji switch (a radiogroup: arrow keys move the choice). */
export function FaviconModeTabs({
  mode,
  onChange,
}: {
  mode: FaviconMode;
  onChange: (mode: FaviconMode) => void;
}) {
  return (
    <ChipGroup
      label={t.modeLabel}
      variant="segmented"
      className="[&>div]:flex"
      options={OPTIONS}
      value={mode}
      onChange={onChange}
    />
  );
}
