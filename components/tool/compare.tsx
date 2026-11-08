'use client';

import { CompareSlider } from '@/components/ui/compare-slider';
import { Sheet } from '@/components/ui/sheet';
import { copy } from './copy';

export interface CompareProps {
  open: boolean;
  onClose: () => void;
  /** Shown in the dialog title ("Compare: photo.jpg"). */
  fileName: string;
  /** Object URL of the original file. The caller owns it (create on open, revoke on close). */
  originalUrl: string;
  /** Object URL of the result (ResultItem.url). */
  resultUrl: string;
  originalLabel?: string;
  resultLabel?: string;
}

/**
 * Before/after dialog opened from a ResultCard's "Compare" button (spec §6).
 * Built on Sheet, which already has the focus trap, Esc, backdrop click and
 * return-focus behaviour.
 */
export function Compare({
  open,
  onClose,
  fileName,
  originalUrl,
  resultUrl,
  originalLabel = copy.original,
  resultLabel = copy.result,
}: CompareProps) {
  return (
    <Sheet open={open} onClose={onClose} title={copy.compareTitle(fileName)}>
      <div className="grid gap-3 pb-2">
        <CompareSlider
          className="aspect-square w-full sm:aspect-[4/3]"
          label={copy.sliderLabel}
          beforeLabel={originalLabel}
          afterLabel={resultLabel}
          before={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={originalUrl} alt={originalLabel} className="size-full object-contain bg-card" />
          }
          after={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resultUrl} alt={resultLabel} className="size-full object-contain bg-card" />
          }
        />
        <p className="type-small text-muted">{copy.compareHint}</p>
      </div>
    </Sheet>
  );
}
