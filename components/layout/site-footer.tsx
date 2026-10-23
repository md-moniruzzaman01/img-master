import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';

const INFO_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
] as const;

const linkClass =
  'inline-flex min-h-12 items-center text-text underline-offset-4 hover:underline lg:min-h-10';

/** Category link lists, info pages, credit and copyright (DESIGN.md §4.2). */
export function SiteFooter({ groups }: { groups: ToolNavGroup[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface lg:mt-16">
      <div className="mx-auto w-full max-w-[1024px] px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <nav key={g.category} aria-label={`${g.label} tools`}>
              <h2 className="mb-1 type-caption tracking-wide text-muted uppercase">
                {g.hubHref ? (
                  <Link href={g.hubHref} className="inline-flex min-h-12 items-center hover:text-text lg:min-h-10">
                    {g.label}
                  </Link>
                ) : (
                  g.label
                )}
              </h2>
              <ul>
                {g.tools.map((t) => (
                  <li key={t.slug}>
                    <Link href={t.href} className={linkClass}>
                      {t.shortName}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Site">
            <h2 className="mb-1 type-caption tracking-wide text-muted uppercase">
              {siteConfig.name}
            </h2>
            <ul>
              {INFO_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 type-small text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.owner.company}. Your images never leave your device.
          </p>
          <a
            href={siteConfig.credit.url}
            rel="noopener"
            className="inline-flex min-h-12 items-center font-medium text-text underline-offset-4 hover:underline lg:min-h-10"
          >
            {siteConfig.credit.label}
          </a>
        </div>
      </div>
    </footer>
  );
}
