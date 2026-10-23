'use client';

import { AlertIcon, InfoIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/cx';
import { Button } from '@/components/ui/button';

/** Plain-language message + at most one action. Uses role="alert". */
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
  return (
    <div
      role="alert"
      data-testid="error-banner"
      className={cx(
        'flex flex-col gap-3 rounded-card border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between',
        tone === 'danger' ? 'border-danger' : 'border-warning',
        className,
      )}
    >
      <p className="flex items-start gap-2 text-text">
        {tone === 'danger' ? (
          <AlertIcon size={20} className="mt-0.5 shrink-0 text-danger" />
        ) : (
          <InfoIcon size={20} className="mt-0.5 shrink-0 text-warning" />
        )}
        <span className="min-w-0 [overflow-wrap:anywhere]">{message}</span>
      </p>
      {action && (
        <Button variant="secondary" onClick={action.onClick} className="shrink-0">
          {action.label}
        </Button>
      )}
    </div>
  );
}
