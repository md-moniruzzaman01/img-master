/** Plain numbered list (DESIGN.md §4.5). Steps are plain text. */
export function HowToSteps({
  steps,
  heading = 'How it works',
  glyph,
}: {
  steps: readonly string[];
  heading?: string;
  /** Optional decorative kanji rendered before the heading (e.g. '技'). */
  glyph?: string;
}) {
  return (
    <section className="mt-8 lg:mt-12">
      <div className="flex items-baseline gap-3">
        {glyph && (
          <span
            aria-hidden="true"
            className="kanji shrink-0 font-extrabold text-[2rem] leading-none text-accent"
          >
            {glyph}
          </span>
        )}
        <h2 className="font-display font-extrabold type-h2 text-ink text-balance">{heading}</h2>
      </div>
      <ol className="mt-4 grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-shu bg-shu-soft font-bold tabular-nums text-ink"
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-ink">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
