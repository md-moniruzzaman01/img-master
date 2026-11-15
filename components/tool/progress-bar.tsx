'use client';

/**
 * Determinate bar with a text label ("Compressing photo 2 of 5…").
 * `note` is an optional second line; `reserveNote` keeps its space even when empty.
 */
export function ProgressBar({
  label,
  value,
  note,
  reserveNote,
}: {
  label: string;
  value: number;
  note?: string | null;
  reserveNote?: boolean;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="grid gap-2">
      <p className="type-small font-medium text-ink tabular-nums">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 w-full overflow-hidden rounded-full bg-paper"
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {(note || reserveNote) && (
        <p data-testid="decode-note" className={reserveNote ? 'type-small min-h-10 text-muted' : 'type-small text-muted'}>
          {note}
        </p>
      )}
    </div>
  );
}
