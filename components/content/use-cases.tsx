import type { UseCase } from '@/lib/types';
import { SectionHeading } from '@/components/layout/section-heading';
import { UseCaseGlyph } from '@/components/ui/icons';
import { pageGlyphs } from '@/lib/tools/glyphs';

/**
 * Use-case cards right after the tool, on a paper-2 band (spec §5.2, §6).
 * `app/[slug]/page.tsx` renders this inside `<Container size="text">` (a
 * 760px reading column), so the band is a rounded panel sized to that column
 * rather than a full-bleed section. Server component; props spread directly
 * from `ToolContent['useCases']`.
 */
export function UseCases({
  heading,
  intro,
  items,
}: {
  heading: string;
  intro?: string;
  items: UseCase[];
}) {
  return (
    <section className="my-10 rounded-card bg-paper-2 p-5 sm:p-8">
      <SectionHeading glyph={pageGlyphs.useCases} heading={heading} intro={intro} />
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="rounded-card border border-line bg-card p-4">
            <UseCaseGlyph icon={item.icon} size={24} className="text-accent" />
            <p className="mt-3 leading-6 font-bold text-ink">{item.title}</p>
            <p className="mt-1 type-small text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
