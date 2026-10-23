import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';
import { MenuDisclosure } from './menu-disclosure';

export const INFO_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
] as const;

const desktopLink =
  'inline-flex min-h-12 items-center rounded-control px-3 font-medium text-text no-underline hover:text-primary';

const menuLink =
  'flex min-h-12 items-center rounded-control px-2 -mx-2 text-text no-underline hover:bg-surface';

/**
 * White bar, text logo, ≤ 52px, not sticky (DESIGN.md §4.2).
 * Mobile: one hamburger that opens a menu of every live tool plus the info pages.
 * The menu's links are server-rendered (crawlable on every page, work without JS).
 * Desktop (≥ 768px): a few plain text links.
 */
export function SiteHeader({ groups }: { groups: ToolNavGroup[] }) {
  const hubs = groups.filter((g) => g.hubHref);
  return (
    <header className="relative border-b border-border bg-bg">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:inline-flex focus:min-h-12 focus:items-center focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-[51px] w-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-12 items-center rounded-control px-1 text-lg font-bold tracking-tight text-text no-underline"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="-mr-3 flex items-center">
            {hubs.map((g) => (
              <li key={g.category}>
                <Link href={g.hubHref!} className={desktopLink}>
                  {g.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/about" className={desktopLink}>
                About
              </Link>
            </li>
          </ul>
        </nav>

        <MenuDisclosure>
          <nav aria-label="All tools" className="mx-auto w-full max-w-[1024px] px-4 pt-2 pb-4 sm:px-6">
            {groups.map((g) => (
              <section key={g.category} className="border-b border-border py-2">
                <h2 className="pt-2 pb-1 type-caption tracking-wide text-muted uppercase">
                  {g.label}
                </h2>
                <ul>
                  {g.tools.map((t) => (
                    <li key={t.slug}>
                      <Link href={t.href} className={menuLink}>
                        {t.shortName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <ul className="pt-2">
              {INFO_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={menuLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </MenuDisclosure>
      </div>
    </header>
  );
}
