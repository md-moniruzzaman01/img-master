/** Numbered 3-step list (DESIGN.md §4.5). Steps are plain text. */
export function HowToSteps({
  steps,
  heading = 'How it works',
}: {
  steps: readonly string[];
  heading?: string;
}) {
  return (
    <section className="mt-8 lg:mt-12">
      <h2 className="type-h2 text-text">{heading}</h2>
      <ol className="mt-4 grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold tabular-nums text-primary"
            >
              {i + 1}
            </span>
            <span className="pt-1 text-text">
              {s}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
