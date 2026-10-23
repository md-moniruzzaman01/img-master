/** H1 + subtitle with tight spacing, so the tool stays above the fold. */
export function PageIntro({ h1, subtitle }: { h1: string; subtitle?: string }) {
  return (
    <div className="pt-3 pb-4">
      <h1 className="type-h1 text-balance text-text">{h1}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
