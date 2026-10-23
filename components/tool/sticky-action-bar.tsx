'use client';

import { useEffect, type ReactNode } from 'react';
import { cx } from '@/components/ui/cx';

/**
 * Main actions after processing (DESIGN.md §4.3). Fixed to the bottom on
 * mobile (with safe-area padding), inline on ≥ 768px.
 *
 * `reserve` keeps the inline slot's height on desktop while results are on
 * the way, so nothing below jumps when the buttons appear. On mobile the page
 * gets bottom padding (html.has-action-bar) so the bar never covers content.
 */
export function StickyActionBar({
  visible,
  reserve,
  children,
}: {
  visible: boolean;
  reserve: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.classList.add('has-action-bar');
    return () => root.classList.remove('has-action-bar');
  }, [visible]);

  if (!visible && !reserve) return null;

  return (
    <div className={cx('max-md:-mt-4 md:min-h-[52px]', !visible && 'hidden md:block')}>
      {visible && (
        <div
          data-testid="action-bar"
          className={cx(
            'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg px-4 pt-3 shadow-raised',
            'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
            'md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none',
          )}
        >
          <div className="mx-auto flex max-w-[640px] gap-2 [&>*]:flex-1 md:[&>*]:flex-none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
