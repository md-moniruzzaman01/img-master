'use client';

import { useEffect } from 'react';
import { CheckIcon, InfoIcon } from './icons';
import { cx } from './cx';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'success' | 'info';
}

/**
 * Small confirmation (DESIGN.md §4.1). The live region is always in the DOM so
 * screen readers pick up new messages; it hides itself after 3 s.
 * Sits above the sticky action bar on mobile.
 */
export function Toast({
  message,
  onDone,
}: {
  message: ToastMessage | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6"
    >
      {message && (
        <div
          key={message.id}
          className={cx(
            'flex max-w-sm items-center gap-2 rounded-control border border-border bg-text px-4 py-3 text-bg shadow-toast',
          )}
        >
          {message.tone === 'info' ? <InfoIcon size={20} /> : <CheckIcon size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
}
