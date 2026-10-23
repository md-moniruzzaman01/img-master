import Link from 'next/link';
import type { Crumb } from '@/lib/types';
import { ChevronRightIcon } from '@/components/ui/icons';

/** Home › Category › Tool. Same items as the BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="pt-2">
      <ol className="flex flex-wrap items-center type-small text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  // 48px tall hit area without making the row taller.
                  className="-my-[14px] inline-flex min-h-12 items-center rounded-sm underline-offset-4 hover:text-text hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-text' : ''}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRightIcon size={20} className="mx-0.5 size-4 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
