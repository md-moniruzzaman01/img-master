import type { ToolCardData } from '@/lib/types';
import { ToolCard } from './tool-card';

/** 4–6 ToolCards from the content file's `related`. */
export function RelatedTools({
  tools,
  heading = 'Related tools',
}: {
  tools: ToolCardData[];
  heading?: string;
}) {
  if (tools.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <h2 className="type-h2 text-text">{heading}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.slug}>
            <ToolCard tool={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
