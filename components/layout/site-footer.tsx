import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';

const LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
] as const;

const link =
  'inline-flex min-h-12 items-center text-text underline-offset-4 hover:text-primary hover:underline';

/**
 * Two lines (DESIGN.md §4.2): copyright with the builder credit, then the
 * legal links. Tools are linked from the header menu on every page.
 * `groups` is kept for the layout's call signature.
 */
export function SiteFooter(props: { groups: ToolNavGroup[] }) {
  void props;
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface lg:mt-16">
      <div className="mx-auto flex w-full max-w-[1024px] flex-col px-4 py-3 type-small text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {siteConfig.name} · Built by{' '}
          <a href={siteConfig.credit.url} rel="noopener" className={link}>
            {siteConfig.owner.company}
          </a>
        </p>
        <ul className="-ml-1 flex items-center gap-1">
          {LINKS.map((l, i) => (
            <li key={l.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">·</span>}
              <Link href={l.href} className={`${link} px-1`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
