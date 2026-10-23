import Link from 'next/link';
import type { ToolCardData } from '@/lib/types';

/** Bold name + one line; the whole bordered card is the link. No icon, no shadow. */
export function ToolCard({ tool }: { tool: ToolCardData }) {
  return (
    <Link
      href={tool.href}
      className="group block h-full min-h-12 rounded-card border border-border bg-bg p-4 no-underline transition-colors duration-150 ease-out hover:border-border-strong lg:p-5"
    >
      <span className="block font-bold text-text underline-offset-4 group-hover:underline">
        {tool.shortName}
      </span>
      <span className="mt-1 block type-small text-muted">{tool.description}</span>
    </Link>
  );
}
