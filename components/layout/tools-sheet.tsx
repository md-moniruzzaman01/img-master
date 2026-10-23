'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ToolNavGroup } from '@/lib/types';
import { Sheet } from '@/components/ui/sheet';
import { ChevronRightIcon, MenuIcon } from '@/components/ui/icons';
import { CategoryIcon } from '@/components/content/category-icon';

/** "Tools" button + sheet listing every live tool by category (DESIGN.md §4.2). */
export function ToolsSheet({ groups }: { groups: ToolNavGroup[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-mr-2 inline-flex min-h-12 items-center gap-2 rounded-control px-3 font-semibold text-text transition-colors duration-150 ease-out hover:bg-surface-2"
      >
        <MenuIcon size={20} />
        Tools
      </button>
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
    </>
  );
}
