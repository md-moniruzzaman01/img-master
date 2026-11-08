import Link from 'next/link';
import type { Crumb } from '@/lib/types';
import { cx } from '@/components/ui/cx';

/** Home / Compress / 50 KB. Same items as the BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cx('pt-4 lg:pt-8', className)}>
      <ol className="flex flex-wrap items-center type-small text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  // 48px tall hit area without making the row taller.
                  className="-my-[14px] inline-flex min-h-12 items-center underline-offset-4 hover:text-ink hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="font-bold text-ink">
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="mx-2 text-line-strong">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
