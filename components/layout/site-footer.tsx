import Link from 'next/link';
import type { ToolNavGroup } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';
import { BrandSeal } from './brand-seal';
import { navCopy as t } from './copy';
import { groupOf, isTabTool, sizeLabel, sizeTools } from './nav-data';

const link =
  'inline-flex min-h-10 items-center text-[0.9375rem] text-on-band-muted no-underline hover:text-on-band hover:underline underline-offset-4';

/** Ink mountain edge from docs/figma-export/svg/footer.svg (its first two paths). */
function MountainEdge() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1280 120"
      preserveAspectRatio="none"
      className="block h-12 w-full sm:h-20 lg:h-[120px]"
    >
      <path
        d="M0 120V70l90-42 70 30L280 0l110 52 80-30 140 46L730 18l130 54 90-28 150 40 180-34v110L0 120Z"
        className="fill-band-2"
      />
      <path
        d="M0 120V92l140-30 120 26 160-40 140 34 130-22 170 36 150-30 120 20 150-24v78L0 120Z"
        className="fill-band"
      />
    </svg>
  );
}

function Column({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h2 className="type-eyebrow text-kin">{label}</h2>
      <ul className="mt-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={link}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Dark footer with the ink mountain edge (spec §6). Desktop: blurb and four
 * columns (Compress / Convert / More tools / Img Master). Phones: name and a
 * few links (Figma mobile-home-04).
 */
export function SiteFooter({ groups }: { groups: ToolNavGroup[] }) {
  const year = new Date().getFullYear();
  const compressGroup = groupOf(groups, 'compress');
  const compress = [
    ...(compressGroup?.hubHref ? [{ label: t.anySize, href: compressGroup.hubHref }] : []),
    ...sizeTools(groups).map((s) => ({ label: `To ${sizeLabel(s.kb)}`, href: s.href })),
  ];
  const convertGroup = groupOf(groups, 'convert');
  const convert = (convertGroup?.tools ?? []).map((x) => ({
    label: x.href === convertGroup?.hubHref ? t.anyFormat : x.shortName,
    href: x.href,
  }));
  const more = [
    ...(groupOf(groups, 'resize')?.tools ?? []),
    ...(groupOf(groups, 'favicon')?.tools.filter((x) => !isTabTool(x)) ?? []),
  ].map((x) => ({ label: x.shortName, href: x.href }));
  more.push({ label: t.allTools, href: '/tools' });
  const site = [
    { label: t.howItWorks, href: '/how-it-works' },
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="mt-16 lg:mt-24">
      <MountainEdge />
      <div className="bg-band text-on-band">
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-8 sm:px-6 lg:px-12 lg:pt-12">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-12">
            <div>
              <p className="flex items-center gap-3 font-display text-2xl font-extrabold">
                <span className="hidden lg:inline-flex">
                  <BrandSeal />
                </span>
                {siteConfig.name}
              </p>
              <p className="mt-5 hidden max-w-[20rem] type-body text-on-band-muted lg:block">
                {t.footerBlurb}
              </p>
            </div>
            {/* Phones: three links. */}
            <ul className="mt-4 lg:hidden">
              <li>
                <Link href="/tools" className={link}>
                  {t.allTools}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={link}>
                  {t.howItWorks}
                </Link>
              </li>
              <li className="flex items-center gap-2 text-on-band-muted">
                <Link href="/about" className={link}>
                  About
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/privacy" className={link}>
                  Privacy
                </Link>
                <span aria-hidden="true">·</span>
                <Link href="/terms" className={link}>
                  Terms
                </Link>
              </li>
            </ul>
            <nav aria-label="Footer" className="hidden grid-cols-4 gap-8 lg:grid">
              <Column label={t.compress} links={compress} />
              <Column label={t.convert} links={convert} />
              <Column label={t.footerMoreTools} links={more} />
              <Column label={siteConfig.name} links={site} />
            </nav>
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-on-band-muted/40 pt-5 type-small text-on-band-muted sm:flex-row sm:items-center sm:justify-between lg:mt-10">
            <p>
              © {year} {siteConfig.name} ·{' '}
              <a href={siteConfig.credit.url} rel="noopener" className="underline-offset-4 hover:underline">
                {t.builtIn}
              </a>
            </p>
            <p aria-hidden="true" className="kanji hidden tracking-[0.3em] sm:block">
              {t.motto}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
