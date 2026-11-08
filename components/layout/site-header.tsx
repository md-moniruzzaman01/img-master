import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SearchItem, ToolCardData, ToolNavGroup } from '@/lib/types';
import { categoryGlyphs } from '@/lib/tools/glyphs';
import { siteConfig } from '@/lib/site-config';
import { SearchLauncher } from '@/components/search/search-launcher';
import { SoundToggle } from '@/components/sound/sound-toggle';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button-styles';
import { cx } from '@/components/ui/cx';
import { iconButtonClasses } from '@/components/ui/icon-button';
import { ArrowRightIcon, ChevronDownIcon, MenuIcon, SearchIcon, XIcon } from '@/components/ui/icons';
import { BrandSeal } from './brand-seal';
import { navCopy as t } from './copy';
import { HeaderMenus } from './header-menus';
import { groupOf, isTabTool, pairTools, sizeLabel, sizeTools, standaloneTools } from './nav-data';

const navItem =
  'relative inline-flex min-h-12 items-center gap-1 rounded-control px-3 whitespace-nowrap text-[0.9375rem] font-medium text-ink no-underline hover:text-accent';

interface MenuRow {
  href: string;
  glyph: string;
  title: string;
  line: string;
  badge?: string;
}

function Row({ row, highlight }: { row: MenuRow; highlight?: boolean }) {
  return (
    <li>
      <Link
        href={row.href}
        className={cx(
          'flex min-h-14 items-start gap-4 rounded-card px-3 py-2.5 no-underline hover:bg-paper-2',
          highlight && 'bg-shu-soft hover:bg-shu-soft',
        )}
      >
        <span aria-hidden="true" className="kanji w-10 shrink-0 pt-0.5 text-center text-lg text-shu">
          {row.glyph}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 font-bold text-ink">
            {row.title}
            {row.badge && <Badge tone="accent">{row.badge}</Badge>}
          </span>
          <span className="block type-small text-ink-2">{row.line}</span>
        </span>
      </Link>
    </li>
  );
}

function PlainRow({ row }: { row: Omit<MenuRow, 'glyph'> }) {
  return (
    <li>
      <Link href={row.href} className="block min-h-14 rounded-card px-3 py-2.5 no-underline hover:bg-paper-2">
        <span className="block font-bold text-ink">{row.title}</span>
        <span className="block type-small text-ink-2">{row.line}</span>
      </Link>
    </li>
  );
}

function Promo({
  glyph,
  title,
  text,
  link,
  href,
}: {
  glyph: string;
  title: string;
  text: string;
  link: string;
  href: string;
}) {
  return (
    <div className="rounded-card bg-band p-6 text-on-band">
      <p aria-hidden="true" className="kanji text-[2rem] leading-10 text-shu">
        {glyph}
      </p>
      <p className="mt-2 font-display text-[1.375rem] leading-7 font-extrabold">{title}</p>
      <p className="mt-3 type-small text-on-band-muted">{text}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-12 items-center gap-2 font-bold text-on-band underline-offset-4 hover:underline"
      >
        {link}
        <ArrowRightIcon size={16} className="text-shu" />
      </Link>
    </div>
  );
}

/** One desktop mega menu on a native <details>: opens without JS, links in the HTML. */
function MegaMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details data-menu="" className="group">
      <summary
        className={cx(
          navItem,
          'list-none group-open:text-accent',
          'after:absolute after:inset-x-3 after:-bottom-[14px] after:h-[2px] after:bg-shu after:opacity-0 group-open:after:opacity-100',
        )}
      >
        {label}
        <ChevronDownIcon
          size={16}
          className="transition-transform duration-150 group-open:rotate-180"
        />
      </summary>
      <div
        data-menu-panel=""
        className="im-slide-down absolute inset-x-0 top-full z-40 border-y border-line bg-card shadow-float after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-screen after:bg-scrim"
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_280px] gap-8 px-12 py-8">
          {children}
        </div>
      </div>
    </details>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 px-3 type-eyebrow text-kin-text">{children}</p>;
}

function compressMenu(groups: ToolNavGroup[]) {
  const sizes = sizeTools(groups);
  const hub = groupOf(groups, 'compress')?.tools.find((x) => x.kind === 'compress');
  const resize = groupOf(groups, 'resize')?.tools[0];
  const fifty = sizes.find((s) => s.kb === 50);
  return (
    <MegaMenu label={t.compress}>
      <div>
        <MenuLabel>{t.compressToSize}</MenuLabel>
        <ul className="grid grid-flow-col grid-cols-2 grid-rows-3 gap-1">
          {sizes.map((s) => (
            <Row
              key={s.slug}
              highlight={s.kb === 50}
              row={{
                href: s.href,
                glyph: s.glyph,
                title: s.shortName,
                line: s.description,
                badge: s.kb === 50 ? t.startHere : undefined,
              }}
            />
          ))}
        </ul>
      </div>
      <div>
        <MenuLabel>{t.otherWays}</MenuLabel>
        <ul className="grid gap-1">
          {hub && <PlainRow row={{ href: hub.href, title: hub.shortName, line: hub.description }} />}
          {resize && (
            <PlainRow row={{ href: resize.href, title: resize.shortName, line: resize.description }} />
          )}
          <PlainRow row={{ href: '/how-it-works', title: t.batchTips, line: t.batchTipsLine }} />
        </ul>
      </div>
      {fifty ? (
        <Promo
          glyph={fifty.glyph}
          title={t.promo50Title}
          text={t.promo50Text}
          link={t.promo50Link}
          href={fifty.href}
        />
      ) : (
        <div />
      )}
    </MegaMenu>
  );
}

function convertMenu(groups: ToolNavGroup[]) {
  const pairs = pairTools(groups);
  const hub = groupOf(groups, 'convert')?.tools.find((x) => !pairs.some((p) => p.slug === x.slug));
  const promo = pairs.find((p) => p.slug === 'webp-to-jpg');
  return (
    <MegaMenu label={t.convert}>
      <div>
        <MenuLabel>{t.convertFormat}</MenuLabel>
        <ul className="grid grid-cols-2 gap-1">
          {pairs.map((p) => (
            <Row
              key={p.slug}
              row={{ href: p.href, glyph: p.glyph, title: p.shortName, line: p.description }}
            />
          ))}
        </ul>
      </div>
      <div>
        <MenuLabel>{t.otherWays}</MenuLabel>
        <ul className="grid gap-1">
          {hub && <PlainRow row={{ href: hub.href, title: hub.shortName, line: hub.description }} />}
          <PlainRow row={{ href: '/tools', title: t.allTools, line: t.allToolsLine }} />
        </ul>
      </div>
      {promo ? (
        <Promo
          glyph={categoryGlyphs.convert}
          title={t.promoConvertTitle}
          text={t.promoConvertText}
          link={t.promoConvertLink}
          href={promo.href}
        />
      ) : (
        <div />
      )}
    </MegaMenu>
  );
}

function faviconMenu(groups: ToolNavGroup[]) {
  const tools = groupOf(groups, 'favicon')?.tools ?? [];
  const gen = tools.find((x) => x.kind === 'favicon-image');
  return (
    <MegaMenu label={t.favicon}>
      <div>
        <MenuLabel>{t.faviconTools}</MenuLabel>
        <ul className="grid grid-cols-2 gap-1">
          {tools.map((x) => (
            <Row key={x.slug} row={{ href: x.href, glyph: x.glyph, title: x.shortName, line: x.description }} />
          ))}
        </ul>
      </div>
      <div />
      {gen ? (
        <Promo
          glyph={categoryGlyphs.favicon}
          title={t.promoFaviconTitle}
          text={t.promoFaviconText}
          link={t.promoFaviconLink}
          href={gen.href}
        />
      ) : (
        <div />
      )}
    </MegaMenu>
  );
}

const chip =
  'inline-flex min-h-12 items-center rounded-control border border-line bg-card px-4 font-bold text-ink-2 no-underline hover:border-line-strong hover:text-ink';

function MobileGroup({ glyph, label, children }: { glyph: string; label: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="flex items-baseline gap-2">
        <span aria-hidden="true" className="kanji text-xl text-shu">
          {glyph}
        </span>
        <span className="type-eyebrow text-kin-text">{label}</span>
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">{children}</ul>
    </section>
  );
}

/** Full-screen menu for phones (spec §6), on a native <details>: works without JS. */
function MobileMenu({ groups }: { groups: ToolNavGroup[] }) {
  const count = standaloneTools(groups).length;
  const sizes = sizeTools(groups);
  const pairs = pairTools(groups);
  const convertHub = groupOf(groups, 'convert')?.hubHref;
  const icons = [
    ...(groupOf(groups, 'favicon')?.tools.filter((x) => !isTabTool(x)) ?? []),
    ...(groupOf(groups, 'resize')?.tools ?? []),
  ];
  return (
    <details data-menu="mobile" className="group -mr-3 lg:hidden">
      <summary
        aria-label={t.menu}
        className={cx(
          iconButtonClasses,
          'relative z-[60] list-none group-open:fixed group-open:top-2 group-open:right-1 sm:group-open:right-3',
        )}
      >
        <MenuIcon size={26} className="group-open:hidden" />
        <XIcon size={26} className="hidden group-open:block" />
      </summary>
      <div
        data-menu-panel=""
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-paper px-4 pb-10 sm:px-6"
      >
        <div className="flex h-16 items-center">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-3 font-display text-[1.375rem] font-extrabold text-ink no-underline"
          >
            <BrandSeal />
            {siteConfig.name}
          </Link>
        </div>
        <form action="/tools" role="search" className="mt-2">
          <label className="flex h-14 items-center gap-3 rounded-card border-[1.5px] border-ink bg-card px-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus">
            <SearchIcon size={22} className="shrink-0 text-ink-2" />
            <span className="sr-only">{t.searchTools(count)}</span>
            <input
              type="search"
              name="q"
              enterKeyHint="search"
              autoComplete="off"
              placeholder={t.searchTools(count)}
              className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
            />
          </label>
        </form>
        <nav aria-label="All tools">
          {sizes.length > 0 && (
            <MobileGroup glyph={categoryGlyphs.compress} label={t.compress}>
              {sizes.map((s) => (
                <li key={s.slug}>
                  <Link href={s.href} className={chip}>
                    To {sizeLabel(s.kb)}
                  </Link>
                </li>
              ))}
            </MobileGroup>
          )}
          {pairs.length > 0 && (
            <MobileGroup glyph={categoryGlyphs.convert} label={t.convert}>
              {pairs.slice(0, 3).map((p) => (
                <li key={p.slug}>
                  <Link href={p.href} className={chip}>
                    {p.pair[0]} → {p.pair[1]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={convertHub ?? '/tools'} className={chip}>
                  {t.more}
                </Link>
              </li>
            </MobileGroup>
          )}
          {icons.length > 0 && (
            <MobileGroup glyph={categoryGlyphs.favicon} label={t.iconsAndSize}>
              {icons.map((x) => (
                <li key={x.slug}>
                  <Link href={x.href} className={chip}>
                    {x.shortName}
                  </Link>
                </li>
              ))}
            </MobileGroup>
          )}
        </nav>
        <div className="mt-6 flex flex-wrap gap-2">
          <SoundToggle variant="pill" />
          <ThemeToggle variant="pill" />
        </div>
        <ul className="mt-6">
          {[
            { label: t.howItWorks, href: '/how-it-works' },
            { label: 'About', href: '/about' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Contact', href: '/contact' },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex min-h-14 items-center font-display text-[1.375rem] font-extrabold text-ink no-underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/**
 * Site header (spec §6). Desktop (≥ 1024px): seal + name, mega menus (Compress,
 * Convert, Favicon), Resize and How it works links, search, sound, theme, CTA.
 * Phones: seal + name, search icon, menu icon → full-screen menu.
 * Every link is in the static HTML; the menus open without JavaScript.
 */
export function SiteHeader({
  groups,
  searchIndex,
}: {
  groups: ToolNavGroup[];
  searchIndex: SearchItem[];
}) {
  const resizeHref = groupOf(groups, 'resize')?.hubHref ?? groupOf(groups, 'resize')?.tools[0]?.href;
  const fifty: ToolCardData | undefined = sizeTools(groups).find((s) => s.kb === 50);
  return (
    <header data-site-header="" className="relative z-30 border-b border-line bg-paper">
      <a
        href="#main"
        className="sr-only z-[70] rounded-control bg-shu px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:inline-flex focus:min-h-12 focus:items-center"
      >
        {t.skip}
      </a>
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:h-[76px] lg:px-12">
        <Link
          href="/"
          className="-ml-1 mr-auto inline-flex min-h-12 items-center gap-3 rounded-control px-1 font-display text-[1.375rem] font-extrabold whitespace-nowrap text-ink no-underline lg:mr-4 lg:text-2xl"
        >
          <BrandSeal />
          {siteConfig.name}
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center">
            <li>{compressMenu(groups)}</li>
            <li>{convertMenu(groups)}</li>
            {resizeHref && (
              <li>
                <Link href={resizeHref} className={navItem}>
                  {t.resize}
                </Link>
              </li>
            )}
            <li>{faviconMenu(groups)}</li>
            <li>
              <Link href="/how-it-works" className={navItem}>
                {t.howItWorks}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2 lg:ml-auto">
          <SearchLauncher items={searchIndex} />
          <div className="hidden items-center gap-2 lg:flex">
            <SoundToggle />
            <ThemeToggle />
          </div>
          {fifty && (
            <Link href={fifty.href} className={buttonClasses('primary', 'md', 'max-xl:hidden whitespace-nowrap')}>
              {t.cta}
            </Link>
          )}
          <MobileMenu groups={groups} />
        </div>
      </div>
      <HeaderMenus />
    </header>
  );
}
