'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { XIcon } from './icons';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on mobile, side panel from the right on ≥ 768px (DESIGN.md §4.1).
 * Built on a modal <dialog>: the page behind is inert, Esc closes, Tab wraps
 * inside the sheet, and focus returns to whatever opened it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.classList.add('sheet-open');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Runs on every close path (Esc, backdrop, link, button).
  function handleClose() {
    document.documentElement.classList.remove('sheet-open');
    const el = returnTo.current;
    returnTo.current = null;
    if (el && document.contains(el)) el.focus();
    if (open) onClose();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key !== 'Tab') return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // A click on the dialog box itself (not its content) is a backdrop click.
        if (e.target === e.currentTarget) onClose();
      }}
      className={
        'fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-hidden ' +
        'rounded-t-card border border-border bg-card p-0 text-text backdrop:bg-scrim ' +
        'md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:max-h-none md:w-[400px] md:rounded-none md:border-y-0 md:border-r-0'
      }
    >
      <div className="flex max-h-[85dvh] flex-col md:h-dvh md:max-h-none">
        <div className="flex items-center justify-between gap-2 border-b border-border py-1 pr-2 pl-4">
          <h2 id={titleId} className="type-h3">
            {title}
          </h2>
          <IconButton aria-label="Close" onClick={onClose}>
            <XIcon />
          </IconButton>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
