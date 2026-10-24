'use client';

/** Determinate bar with a text label ("Compressing photo 2 of 5…"). */
export function ProgressBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="grid gap-2">
      <p className="type-small font-medium text-text tabular-nums">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
