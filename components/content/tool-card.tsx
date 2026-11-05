import Link from 'next/link';
import type { ToolCardData } from '@/lib/types';

/**
 * Bold name + one line; the whole bordered card is the link. No icon, no shadow.
 *
 * `variant='default'` (the default) — compact card used in grids and related-tools.
 * `variant='tile'` — taller card used on the home page compress / convert sections,
 *   showing the decorative kanji glyph prominently in the top-left corner.
 */
export function ToolCard({
  tool,
  variant = 'default',
}: {
  tool: ToolCardData;
  variant?: 'default' | 'tile';
}) {
  if (variant === 'tile') {
    return (
      <Link
        href={tool.href}
        className="relative flex min-h-[140px] flex-col rounded-card border border-line bg-card p-4 no-underline transition-colors duration-150 ease-out hover:border-line-strong lg:p-5"
      >
        <span
          aria-hidden="true"
          className="kanji block font-extrabold text-2xl leading-none text-accent"
        >
          {tool.glyph}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 font-bold text-accent lg:top-5 lg:right-5"
        >
          →
        </span>
        <span className="mt-auto block font-display font-extrabold text-xl text-ink">
          {tool.shortName}
        </span>
        <span className="mt-1 block type-small text-muted">{tool.description}</span>
      </Link>
    );
  }

  return (
    <Link
      href={tool.href}
      className="block h-full min-h-12 rounded-card border border-line bg-card p-4 no-underline transition-colors duration-150 ease-out hover:border-line-strong lg:p-5"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-display font-bold text-ink">{tool.shortName}</span>
        <span aria-hidden="true" className="shrink-0 font-bold text-accent">
          →
        </span>
      </span>
      <span className="mt-1 block type-small text-muted">{tool.description}</span>
    </Link>
  );
}
