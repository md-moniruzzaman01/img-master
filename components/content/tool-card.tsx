import Link from 'next/link';
import type { ToolCardData } from '@/lib/types';
import { CategoryIcon } from './category-icon';

/** Icon + short name + one line; the whole card is the link. */
export function ToolCard({ tool }: { tool: ToolCardData }) {
  return (
    <Link
      href={tool.href}
      className="group flex h-full min-h-12 items-start gap-3 rounded-card border border-border bg-surface p-4 no-underline transition-colors duration-150 ease-out hover:border-primary lg:p-5"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-primary"
      >
        <CategoryIcon category={tool.category} size={20} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-text group-hover:text-primary">
          {tool.shortName}
        </span>
        <span className="mt-0.5 block type-small text-muted">{tool.description}</span>
      </span>
    </Link>
  );
}
