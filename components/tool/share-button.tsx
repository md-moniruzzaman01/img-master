'use client';

import { Button } from '@/components/ui/button';
import { copy } from './copy';

/** True when this browser can share image files (Web Share API level 2). */
export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })
    );
  } catch {
    return false;
  }
}

/**
 * Shares result files to WhatsApp, Messenger, Photos… Renders nothing where
 * file sharing isn't supported. `supported` is decided once by the parent so
 * the button never pops in after the card is on screen.
 */
export function ShareButton({
  supported,
  getFiles,
  onShared,
  className,
}: {
  supported: boolean;
  getFiles: () => File[];
  onShared?: () => void;
  className?: string;
}) {
  if (!supported) return null;

  async function share() {
    const files = getFiles();
    if (files.length === 0) return;
    try {
      if (navigator.canShare && !navigator.canShare({ files })) return;
      await navigator.share({ files });
      onShared?.();
    } catch {
      // User closed the share sheet, or the browser refused: nothing to do.
    }
  }

  return (
    <Button variant="secondary" onClick={share} data-testid="share" className={className}>
      {copy.share}
    </Button>
  );
}
