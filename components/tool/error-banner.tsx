'use client';

import { AlertIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/cx';
import { Button } from '@/components/ui/button';

/**
 * Plain-language message + at most one action. Uses role="alert".
 * `danger` (errors) uses the one red; `warning` is a plain bordered note.
 */
export function ErrorBanner({
  message,
  tone = 'danger',
  action,
  className,
}: {
  message: string;
  tone?: 'danger' | 'warning';
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  const danger = tone === 'danger';
  return (
    <div
      role="alert"
      data-testid="error-banner"
      className={cx(
        'flex flex-col gap-3 rounded-card border bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
        danger ? 'border-danger' : 'border-border-strong',
        className,
      )}
    >
      <p className={cx('flex items-start gap-2', danger ? 'text-danger' : 'text-text')}>
        <AlertIcon size={20} className="mt-0.5 shrink-0" />
        <span className="min-w-0 font-display text-lg [overflow-wrap:anywhere]">{message}</span>
      </p>
      {action && (
        <Button variant="secondary" onClick={action.onClick} className="shrink-0">
          {action.label}
        </Button>
      )}
    </div>
  );
}
