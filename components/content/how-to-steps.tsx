/** Plain numbered list (DESIGN.md §4.5). Steps are plain text. */
export function HowToSteps({
  steps,
  heading = 'How it works',
}: {
  steps: readonly string[];
  heading?: string;
}) {
  return (
    <section className="mt-8 lg:mt-12">
      <h2 className="type-h2 text-balance text-text">{heading}</h2>
      <ol className="mt-4 grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border font-bold tabular-nums text-primary"
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-text">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
