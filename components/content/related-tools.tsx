import type { ToolCardData } from '@/lib/types';
import { ToolCard } from './tool-card';

/** 4–6 ToolCards from the content file's `related`, right after the tool area. */
export function RelatedTools({
  tools,
  heading = 'Related tools',
}: {
  tools: ToolCardData[];
  heading?: string;
}) {
  if (tools.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="type-h2">{heading}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.slug}>
            <ToolCard tool={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
