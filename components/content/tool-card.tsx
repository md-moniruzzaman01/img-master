import Link from 'next/link';
import type { ToolCardData } from '@/lib/types';

/** Bold name + one line; the whole bordered card is the link. No icon, no shadow. */
export function ToolCard({ tool }: { tool: ToolCardData }) {
  return (
    <Link
      href={tool.href}
      className="block h-full min-h-12 rounded-card border border-border bg-card p-4 no-underline transition-colors duration-150 ease-out hover:border-border-strong lg:p-5"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-display font-bold text-steel">{tool.shortName}</span>
        <span aria-hidden="true" className="shrink-0 font-bold text-primary">
          →
        </span>
      </span>
      <span className="mt-1 block type-small text-muted">{tool.description}</span>
    </Link>
  );
}
