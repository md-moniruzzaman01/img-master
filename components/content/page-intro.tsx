/**
 * H1 + one subtitle sentence with tight spacing, so the tool stays above the fold.
 * Optional `glyph` renders a crimson Mincho kanji to the LEFT of the H1 (aria-hidden).
 * Optional `h1Accent` wraps a substring of h1 in crimson.
 */
export function PageIntro({
  h1,
  subtitle,
  glyph,
  h1Accent,
}: {
  h1: string;
  subtitle?: string;
  /** Decorative kanji rendered to the left of the H1 in crimson (e.g. "五十"). */
  glyph?: string;
  /** Substring of h1 to render in crimson (e.g. "50 KB"). */
  h1Accent?: string;
}) {
  const h1Node = buildH1(h1, h1Accent);

  // Mobile anatomy (spec §5.2) has no big glyph and a one-line subtitle, so the
  // tool stays above the fold; the glyph and the full subtitle return at lg.
  return (
    <div className="pt-3 pb-3 lg:pt-8">
      {glyph ? (
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="kanji hidden shrink-0 text-[3.5rem] leading-[1.1] font-extrabold text-accent [writing-mode:vertical-rl] lg:block"
          >
            {glyph}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="type-h1 text-balance">{h1Node}</h1>
            {subtitle && (
              <p className="mt-1 line-clamp-1 type-subtitle text-muted lg:line-clamp-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1 className="type-h1 text-balance">{h1Node}</h1>
          {subtitle && (
            <p className="mt-1 line-clamp-1 type-subtitle text-muted lg:line-clamp-none">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function buildH1(h1: string, h1Accent?: string): React.ReactNode {
  if (!h1Accent) return h1;
  const idx = h1.indexOf(h1Accent);
  if (idx === -1) return h1;
  const before = h1.slice(0, idx);
  const after = h1.slice(idx + h1Accent.length);
  return (
    <>
      {before}
      <span className="text-accent">{h1Accent}</span>
      {after}
    </>
  );
}
