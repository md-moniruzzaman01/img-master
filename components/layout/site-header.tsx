import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';
import { ToolsSheet } from './tools-sheet';

/** Logo left, "Tools" button right, skip link first. 56px tall, not sticky. */
export function SiteHeader({ groups }: { groups: ToolNavGroup[] }) {
  return (
    <header className="border-b border-border bg-bg">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:inline-flex focus:min-h-12 focus:items-center focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-12 items-center gap-2 rounded-control px-1 text-text no-underline"
        >
          <LogoMark />
          <span className="text-lg font-bold tracking-tight">{siteConfig.name}</span>
        </Link>
        <ToolsSheet groups={groups} />
      </div>
    </header>
  );
}

/** Simple square mark in the accent color. */
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="7" className="fill-primary" />
      <rect x="7" y="7" width="14" height="14" rx="3" className="fill-on-primary" />
      <path d="M8.5 19 13 14l3 3 1.5-1.5L20 18v1.5a1 1 0 0 1-1 1H9z" className="fill-primary" />
    </svg>
  );
}
