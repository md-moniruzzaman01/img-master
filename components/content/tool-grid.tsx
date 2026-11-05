import Link from 'next/link';
import type { ToolCardData, ToolNavGroup } from '@/lib/types';
import { categoryGlyphs } from '@/lib/tools/glyphs';
import { ToolCard } from './tool-card';

/**
 * All live tools grouped by category; an H2 per category; 1 → 2 → 3 columns.
 *
 * `variant='default'` (unchanged) — the full grid used on 404, /tools, related tools.
 * `variant='home'` — Figma home layout:
 *   - category 'compress': size-tile grid (3-col desktop, 2-col mobile), only compress-to-size tools.
 *   - category 'convert': format-pair tiles (3-col desktop, 2-col mobile), only convert pair tools,
 *     plus "Any format to JPG, PNG or WebP →" link below.
 */
export function ToolGrid({
  groups,
  headingLevel = 2,
  variant = 'default',
}: {
  groups: ToolNavGroup[];
  headingLevel?: 2 | 3;
  variant?: 'default' | 'home' | 'index';
}) {
  if (variant === 'index') {
    const H = headingLevel === 2 ? 'h2' : 'h3';
    return (
      <div className="mt-8 grid gap-10 lg:mt-12">
        {groups.map((g) => (
          <section key={g.category}>
            <H className="flex items-baseline gap-3 type-h2">
              <span aria-hidden="true" className="kanji text-shu">
                {categoryGlyphs[g.category]}
              </span>
              {g.label}
              <span className="type-small font-normal text-muted">
                <span className="sr-only">, </span>
                {g.tools.length}
                <span className="sr-only"> tools</span>
              </span>
            </H>
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {g.tools.map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} variant="tile" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  if (variant === 'home') {
    return (
      <div className="grid gap-0">
        {groups.map((g) => (
          <HomeSection key={g.category} group={g} headingLevel={headingLevel} />
        ))}
      </div>
    );
  }

  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="mt-6 grid gap-8 lg:mt-10">
      {groups.map((g) => (
        <section key={g.category}>
          <H className={headingLevel === 2 ? 'type-h2' : 'type-h3'}>{g.label}</H>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.tools.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function HomeSection({
  group,
  headingLevel,
}: {
  group: ToolNavGroup;
  headingLevel: 2 | 3;
}) {
  if (group.category === 'compress') {
    const sizeTools = group.tools.filter((t) => t.kind === 'compress-to-size');
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sizeTools.map((t) => (
          <li key={t.slug}>
            <ToolCard tool={t} variant="tile" />
          </li>
        ))}
      </ul>
    );
  }

  if (group.category === 'convert') {
    // Exclude the hub card (its href matches hubHref, e.g. /image-converter).
    const pairTools = group.tools.filter((t) => t.kind === 'convert' && t.href !== group.hubHref);
    return (
      <div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairTools.map((t) => (
            <li key={t.slug}>
              <ConvertTile tool={t} />
            </li>
          ))}
        </ul>
        {group.hubHref && (
          <p className="mt-4 text-right">
            <Link
              href={group.hubHref}
              className="type-small font-semibold text-accent hover:underline underline-offset-4"
            >
              Any format to JPG, PNG or WebP →
            </Link>
          </p>
        )}
      </div>
    );
  }

  // Fallback for other categories
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section>
      <H className={headingLevel === 2 ? 'type-h2' : 'type-h3'}>{group.label}</H>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.tools.map((t) => (
          <li key={t.slug}>
            <ToolCard tool={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A convert pair tile: "WEBP → JPG  For forms and old apps".
 * Source format in ink, arrow in accent, target format in accent.
 */
function ConvertTile({ tool }: { tool: ToolCardData }) {
  const { from, to } = parsePair(tool.shortName);

  return (
    <Link
      href={tool.href}
      className="relative flex min-h-[80px] items-center rounded-card border border-line bg-card px-4 py-3 no-underline transition-colors duration-150 ease-out hover:border-line-strong lg:px-5 lg:py-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="font-display font-extrabold text-lg uppercase text-ink">{from}</span>
          <span className="font-display font-extrabold text-lg text-accent"> → </span>
          <span className="font-display font-extrabold text-lg uppercase text-accent">{to}</span>
          {tool.description && (
            <span className="ml-2 type-small text-muted">{tool.description}</span>
          )}
        </div>
      </div>
      <span aria-hidden="true" className="ml-3 shrink-0 font-bold text-accent">
        →
      </span>
    </Link>
  );
}

/** Extract from/to from shortName like "WEBP → JPG" or "WebP to JPG". */
function parsePair(shortName: string): { from: string; to: string } {
  // Try "X → Y" or "X to Y"
  const arrowMatch = shortName.match(/^(.+?)\s*[→→]\s*(.+)$/);
  if (arrowMatch) return { from: arrowMatch[1].trim(), to: arrowMatch[2].trim() };
  const toMatch = shortName.match(/^(.+?)\s+to\s+(.+)$/i);
  if (toMatch) return { from: toMatch[1].trim(), to: toMatch[2].trim() };
  return { from: shortName, to: '' };
}
