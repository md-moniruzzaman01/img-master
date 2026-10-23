'use client';

import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/sheet';
import { ChevronRightIcon } from '@/components/ui/icons';
import { CategoryIcon } from '@/components/content/category-icon';

/**
 * The Tools sheet itself (DESIGN.md §4.2). Loaded on demand by ToolsSheet, so
 * it adds no JavaScript or hydration work to first load. Every tool link is
 * also in the server-rendered footer.
 */
export function ToolsSheetPanel({
  groups,
  open,
  close,
}: {
  groups: ToolNavGroup[];
  open: boolean;
  close: () => void;
}) {
  return (
    <Sheet open={open} onClose={close} title="All tools">
      <nav aria-label="All tools">
        {groups.map((g) => (
          <section key={g.category} className="py-2">
            <h3 className="flex items-center gap-2 py-2 type-caption tracking-wide text-muted uppercase">
              <CategoryIcon category={g.category} size={20} />
              {g.hubHref ? (
                <Link
                  href={g.hubHref}
                  onClick={close}
                  className="-my-3 inline-flex min-h-12 items-center hover:text-text"
                >
                  {g.label}
                </Link>
              ) : (
                g.label
              )}
            </h3>
            <ul>
              {g.tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.href}
                    onClick={close}
                    className="-mx-2 flex min-h-12 items-center justify-between gap-3 rounded-control px-2 hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{t.shortName}</span>
                    </span>
                    <ChevronRightIcon size={20} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </Sheet>
  );
}
