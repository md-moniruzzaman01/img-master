import type { ToolNavGroup } from '@/lib/types';
import { ToolCard } from './tool-card';

/** All live tools grouped by category, an H2 per category; 1 → 2 → 3 columns (home, 404). */
export function ToolGrid({
  groups,
  headingLevel = 2,
}: {
  groups: ToolNavGroup[];
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="mt-6 grid gap-8 lg:mt-10">
      {groups.map((g) => (
        <section key={g.category}>
          <H className={headingLevel === 2 ? 'type-h2 text-text' : 'type-h3 text-text'}>
            {g.label}
          </H>
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
