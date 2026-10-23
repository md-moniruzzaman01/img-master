/**
 * Where results will appear (DESIGN.md §3.1). It takes no height of its own:
 * the tool column (`Container size="tool"`) fills the first screen, so the
 * content after the tool starts at the fold and results land without moving
 * anything in view. Kept as an empty marker for tests.
 */
export function ResultsPlaceholder() {
  return <div data-testid="results-placeholder" aria-hidden="true" />;
}
