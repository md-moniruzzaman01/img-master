/** H1 + one subtitle sentence with tight spacing, so the tool stays above the fold. */
export function PageIntro({ h1, subtitle }: { h1: string; subtitle?: string }) {
  return (
    <div className="pt-4 pb-4 lg:pt-8">
      <h1 className="type-h1 text-balance text-text">{h1}</h1>
      {subtitle && <p className="mt-1 type-subtitle text-muted">{subtitle}</p>}
    </div>
  );
}
