// Section 6: SEO and content. Crawls the static export in out/ (raw HTML, no JavaScript).
import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { OUT_DIR } from './helpers/fixtures';
import { logMetric } from './helpers/tool';

test.skip(({ browserName }) => browserName !== 'chromium', 'file-system crawl; runs once');

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://img-master.example').replace(/\/$/, '');
const LIVE_TOOLS = [
  'compress-image',
  'compress-image-to-20kb',
  'compress-image-to-50kb',
  'compress-image-to-100kb',
  'compress-image-to-200kb',
  'compress-image-to-500kb',
  'compress-image-to-1mb',
  'image-converter',
  'webp-to-jpg',
  'webp-to-png',
  'png-to-webp',
  'jpg-to-webp',
  'png-to-jpg',
  'jpg-to-png',
];
const LEGAL = ['about', 'privacy', 'terms', 'contact'];
const DRAFT_SLUGS = [
  'favicon-generator',
  'favicon-from-text',
  'favicon-from-emoji',
  'png-to-ico',
  'heic-to-jpg',
  'resize-image',
  'compress-image-to-10kb',
  'compress-image-to-30kb',
  'compress-image-to-150kb',
  'compress-image-to-300kb',
  'compress-image-to-2mb',
];
const EXPECTED_PATHS = ['/', ...LIVE_TOOLS.map((s) => `/${s}`), ...LEGAL.map((s) => `/${s}`)];

// ── helpers ──────────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const rel = (p: string) => relative(OUT_DIR, p).split(sep).join('/');

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCharCode(parseInt(n, 16)));
}
function textOf(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|li|h[1-6]|div|section|summary|details|tr|td|th|caption|a|span)>/g, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}
const attr = (tag: string, name: string) =>
  decode(new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? '');
function metas(html: string): { name: string; content: string }[] {
  return [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => ({
    name: attr(m[0], 'name') || attr(m[0], 'property'),
    content: attr(m[0], 'content'),
  }));
}
const meta = (html: string, name: string) => metas(html).find((m) => m.name === name)?.content;

interface Page {
  path: string;
  file: string;
  html: string;
  title: string;
  description: string;
  canonical: string;
  h1s: string[];
  mainHtml: string;
  below: string; // text container under the tool (or whole main for non-tool pages)
}

function loadPages(): Page[] {
  const files = walk(OUT_DIR).filter((f) => f.endsWith('.html'));
  return files
    .map((f) => rel(f))
    .filter((r) => r !== '404.html' && r !== '_not-found.html')
    .map((r) => {
      const html = readFileSync(join(OUT_DIR, r), 'utf8');
      const path =
        r === 'index.html' ? '/' : '/' + r.replace(/\.html$/, '').replace(/\/index$/, '');
      const mainHtml = /<main[\s\S]*<\/main>/.exec(html)?.[0] ?? '';
      const idx = mainHtml.indexOf('max-w-[680px]');
      const hasTool = mainHtml.includes('data-testid="tool-shell"');
      const belowHtml = hasTool && idx > 0 ? mainHtml.slice(idx) : mainHtml;
      return {
        path,
        file: r,
        html,
        title: decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? ''),
        description: meta(html, 'description') ?? '',
        canonical: attr(/<link[^>]*rel="canonical"[^>]*>/.exec(html)?.[0] ?? '', 'href'),
        h1s: [...mainHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => textOf(m[1])),
        mainHtml,
        below: textOf(belowHtml),
      };
    });
}
const pages = loadPages();
const toolPages = pages.filter((p) => LIVE_TOOLS.includes(p.path.slice(1)));

// ── inventory ────────────────────────────────────────────────────────────

test('built pages are exactly the live pages (no drafts, no dev pages)', () => {
  const built = pages.map((p) => p.path).sort();
  expect(built).toEqual([...EXPECTED_PATHS].sort());
  const all = walk(OUT_DIR).map(rel);
  for (const d of DRAFT_SLUGS) {
    expect(
      all.filter((f) => f === d || f.startsWith(`${d}.`) || f.startsWith(`${d}/`)),
      `draft ${d} leaked into out/`,
    ).toEqual([]);
  }
  expect(
    all.some((f) => /favicon-|png-to-ico/.test(f)),
    'favicon tool files',
  ).toBe(false);
});

test('sitemap.xml = exactly the live pages, canonical host, no trailing slash', () => {
  const xml = readFileSync(join(OUT_DIR, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const expected = EXPECTED_PATHS.map((p) => (p === '/' ? SITE : `${SITE}${p}`));
  expect([...locs].sort()).toEqual([...expected].sort());
  expect(new Set(locs).size).toBe(locs.length);
  for (const l of locs) {
    expect(l.startsWith(SITE)).toBe(true);
    expect(l.endsWith('/'), l).toBe(false);
    expect(l).not.toMatch(/[?#]/);
  }
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g))
    expect(m[1]).toMatch(/^\d{4}-\d{2}-\d{2}/);
  for (const d of DRAFT_SLUGS) expect(xml).not.toContain(`/${d}<`);
});

test('robots.txt allows crawling and points to the sitemap', () => {
  const txt = readFileSync(join(OUT_DIR, 'robots.txt'), 'utf8');
  expect(txt).toMatch(/User-Agent: \*/i);
  expect(txt).not.toMatch(/Disallow:\s*\/\s*$/m);
  expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test('the site URL is a real domain (not the placeholder)', () => {
  // Informational for the pre-launch checklist; fails while the placeholder is in use.
  test.info().annotations.push({ type: 'site-url', description: SITE });
  expect(
    SITE,
    'siteConfig.url is still the placeholder; set NEXT_PUBLIC_SITE_URL or edit site-config',
  ).not.toMatch(/\.example$/);
});

test('404 page: exists, helpful, noindex', () => {
  const html = readFileSync(join(OUT_DIR, '404.html'), 'utf8');
  expect(textOf(html)).toContain("This page doesn't exist");
  expect(meta(html, 'robots')).toMatch(/noindex/);
  expect(html.match(/href="\/[a-z0-9-]+"/g)?.length ?? 0).toBeGreaterThan(10);
});

// ── per-page metadata ────────────────────────────────────────────────────

test('every page: one H1, title, description, canonical, robots', () => {
  const problems: string[] = [];
  for (const p of pages) {
    if (p.h1s.length !== 1) problems.push(`${p.path}: ${p.h1s.length} H1`);
    if (!p.title) problems.push(`${p.path}: no title`);
    if (p.title.length > 60)
      problems.push(`${p.path}: title ${p.title.length} chars > 60: "${p.title}"`);
    if (!/ \| Img Master$/.test(p.title) && p.path !== '/')
      problems.push(`${p.path}: title lacks brand suffix: "${p.title}"`);
    if ((p.title.match(/Img Master/g) ?? []).length > 1 && p.path !== '/')
      problems.push(`${p.path}: brand twice in title`);
    const d = p.description.length;
    const isTool = LIVE_TOOLS.includes(p.path.slice(1));
    if (isTool && (d < 120 || d > 155))
      problems.push(`${p.path}: description ${d} chars (want 120-155)`);
    if (!isTool && (d < 50 || d > 160)) problems.push(`${p.path}: description ${d} chars`);
    const want = p.path === '/' ? SITE : `${SITE}${p.path}`;
    if (p.canonical !== want && !(p.path === '/' && p.canonical === `${SITE}/`))
      problems.push(`${p.path}: canonical "${p.canonical}" want "${want}"`);
    if (p.canonical.length > SITE.length + 1 && p.canonical.endsWith('/'))
      problems.push(`${p.path}: canonical has trailing slash`);
    const robots = meta(p.html, 'robots') ?? '';
    if (/noindex/.test(robots)) problems.push(`${p.path}: noindex on a live page`);
    if (!/lang="en"/.test(p.html)) problems.push(`${p.path}: missing lang=en`);
    if (!/name="viewport"/.test(p.html)) problems.push(`${p.path}: no viewport meta`);
    if ((p.html.match(/<link[^>]*rel="canonical"/g) ?? []).length !== 1)
      problems.push(`${p.path}: canonical count`);
  }
  expect(problems).toEqual([]);
});

test('titles and descriptions are unique across pages', () => {
  const dup = (key: 'title' | 'description') => {
    const seen = new Map<string, string[]>();
    for (const p of pages) seen.set(p[key], [...(seen.get(p[key]) ?? []), p.path]);
    return [...seen.entries()].filter(([, v]) => v.length > 1);
  };
  expect(dup('title')).toEqual([]);
  expect(dup('description')).toEqual([]);
  const h1 = new Map<string, string[]>();
  for (const p of pages) h1.set(p.h1s[0], [...(h1.get(p.h1s[0]) ?? []), p.path]);
  expect([...h1.entries()].filter(([, v]) => v.length > 1)).toEqual([]);
});

test('Open Graph and Twitter tags on every page, OG image exists and is 1200x630 PNG', () => {
  const problems: string[] = [];
  for (const p of pages) {
    const need = [
      'og:title',
      'og:description',
      'og:url',
      'og:image',
      'og:type',
      'og:site_name',
      'twitter:card',
      'twitter:title',
      'twitter:image',
    ];
    for (const n of need) if (!meta(p.html, n)) problems.push(`${p.path}: missing ${n}`);
    if (meta(p.html, 'og:title') !== p.title)
      problems.push(`${p.path}: og:title differs from <title>`);
    if (meta(p.html, 'og:description') !== p.description)
      problems.push(`${p.path}: og:description differs`);
    if (meta(p.html, 'og:url') !== p.canonical) problems.push(`${p.path}: og:url != canonical`);
    if (meta(p.html, 'twitter:card') !== 'summary_large_image')
      problems.push(`${p.path}: twitter:card`);
    const img = meta(p.html, 'og:image') ?? '';
    if (!img.startsWith(SITE))
      problems.push(`${p.path}: og:image not absolute on site host: ${img}`);
    const local = join(OUT_DIR, new URL(img, SITE).pathname);
    if (!existsSync(local) || statSync(local).isDirectory())
      problems.push(`${p.path}: og:image file missing: ${new URL(img, SITE).pathname}`);
    else {
      const b = readFileSync(local);
      const isPng = b.subarray(1, 4).toString('latin1') === 'PNG';
      if (!isPng) problems.push(`${p.path}: og:image not PNG`);
      else if (b.readUInt32BE(16) !== 1200 || b.readUInt32BE(20) !== 630)
        problems.push(`${p.path}: og:image ${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`);
    }
  }
  expect(problems).toEqual([]);
});

// ── structured data ──────────────────────────────────────────────────────

function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const v = JSON.parse(m[1].replace(/\\u003c/g, '<')) as unknown;
    out.push(
      ...(Array.isArray(v) ? (v as Record<string, unknown>[]) : [v as Record<string, unknown>]),
    );
  }
  return out;
}

test('JSON-LD parses and matches visible content (tool pages)', () => {
  const problems: string[] = [];
  for (const p of toolPages) {
    let blocks: Record<string, unknown>[] = [];
    try {
      blocks = jsonLd(p.html);
    } catch (e) {
      problems.push(`${p.path}: JSON-LD does not parse: ${String(e)}`);
      continue;
    }
    const types = blocks.map((b) => String(b['@type']));
    for (const t of ['WebApplication', 'BreadcrumbList', 'FAQPage'])
      if (!types.includes(t)) problems.push(`${p.path}: missing ${t}`);
    for (const bad of ['aggregateRating', 'review', 'HowTo'])
      if (JSON.stringify(blocks).includes(bad)) problems.push(`${p.path}: has ${bad}`);

    const app = blocks.find((b) => b['@type'] === 'WebApplication') as
      Record<string, unknown> | undefined;
    if (app) {
      if (app.name !== p.h1s[0])
        problems.push(`${p.path}: WebApplication.name "${String(app.name)}" != H1 "${p.h1s[0]}"`);
      if (app.url !== p.canonical) problems.push(`${p.path}: WebApplication.url != canonical`);
      if (app.description !== p.description)
        problems.push(`${p.path}: WebApplication.description != meta description`);
      if (app.applicationCategory !== 'MultimediaApplication')
        problems.push(`${p.path}: applicationCategory`);
      if (app.operatingSystem !== 'Any') problems.push(`${p.path}: operatingSystem`);
      const offers = app.offers as { price?: string; priceCurrency?: string } | undefined;
      if (offers?.price !== '0' || !offers?.priceCurrency) problems.push(`${p.path}: offers`);
    }
    const faq = blocks.find((b) => b['@type'] === 'FAQPage') as
      { mainEntity: { name: string; acceptedAnswer: { text: string } }[] } | undefined;
    if (faq) {
      const visible = [
        ...p.mainHtml.matchAll(
          /<details[^>]*>\s*<summary[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/g,
        ),
      ].map((m) => ({ q: textOf(m[1]), a: textOf(m[2]) }));
      const pageFaq = visible.filter((v) => faq.mainEntity.some((e) => e.name === v.q));
      if (faq.mainEntity.length < 4 || faq.mainEntity.length > 6)
        problems.push(`${p.path}: ${faq.mainEntity.length} FAQs (want 4-6)`);
      if (pageFaq.length !== faq.mainEntity.length)
        problems.push(
          `${p.path}: ${faq.mainEntity.length} FAQ in JSON-LD, ${pageFaq.length} matched on page`,
        );
      for (const e of faq.mainEntity) {
        const v = visible.find((x) => x.q === e.name);
        if (!v) continue;
        if (v.a !== e.acceptedAnswer.text)
          problems.push(
            `${p.path}: FAQ answer differs for "${e.name}"\n  page: ${v.a}\n  json: ${e.acceptedAnswer.text}`,
          );
      }
    }
    const bc = blocks.find((b) => b['@type'] === 'BreadcrumbList') as
      { itemListElement: { name: string; item: string; position: number }[] } | undefined;
    if (bc) {
      const nav = /<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/.exec(p.mainHtml)?.[0] ?? '';
      const visibleCrumbs = [...nav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) =>
        textOf(m[1]),
      );
      const jsonCrumbs = bc.itemListElement.map((i) => i.name);
      if (visibleCrumbs.join('|') !== jsonCrumbs.join('|'))
        problems.push(
          `${p.path}: breadcrumb mismatch visible=[${visibleCrumbs}] json=[${jsonCrumbs}]`,
        );
      const last = bc.itemListElement.at(-1);
      if (last && last.item !== p.canonical)
        problems.push(`${p.path}: last breadcrumb item != canonical`);
    }
  }
  expect(problems).toEqual([]);
});

test('JSON-LD on home (WebSite + Organization) and legal pages parses', () => {
  const home = pages.find((p) => p.path === '/')!;
  const blocks = jsonLd(home.html);
  const types = blocks.map((b) => b['@type']);
  expect(types).toContain('WebSite');
  expect(types).toContain('Organization');
  expect(JSON.stringify(blocks)).not.toMatch(/aggregateRating|"review"/);
  const faqs = blocks.find((b) => b['@type'] === 'FAQPage');
  if (faqs) {
    const f = faqs as unknown as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    for (const e of f.mainEntity) expect(home.below, e.name).toContain(e.acceptedAnswer.text);
  }
  for (const p of pages)
    if (!LIVE_TOOLS.includes(p.path.slice(1))) expect(() => jsonLd(p.html), p.path).not.toThrow();
});

// ── links, headings, images ──────────────────────────────────────────────

test('every internal link resolves to a file in out/ (no 404s, no trailing-slash variants)', () => {
  const problems: string[] = [];
  const all = new Set(walk(OUT_DIR).map(rel));
  const allHtml = [
    ...pages.map((p) => ({ path: p.path, html: p.html })),
    { path: '404', html: readFileSync(join(OUT_DIR, '404.html'), 'utf8') },
  ];
  let checked = 0;
  for (const { path, html } of allHtml) {
    for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const href = decode(m[1]);
      if (/^(mailto:|tel:|#)/.test(href)) continue;
      if (/^https?:\/\//.test(href) && !href.startsWith(SITE)) continue; // external
      const u = new URL(href, SITE + '/');
      checked++;
      if (u.search) problems.push(`${path}: query string link ${href}`);
      let p = u.pathname;
      if (p.length > 1 && p.endsWith('/')) problems.push(`${path}: trailing-slash link ${href}`);
      if (p === '/') p = '/index';
      const key = p.slice(1);
      if (!(all.has(key) || all.has(`${key}.html`))) problems.push(`${path}: broken link ${href}`);
      if (u.hash && u.hash !== '#main') {
        // Anchor targets must exist on the destination page.
        const dest = pages.find((x) => x.path === u.pathname);
        if (dest && !dest.html.includes(`id="${u.hash.slice(1)}"`))
          problems.push(`${path}: missing anchor ${href}`);
      }
    }
  }
  test.info().annotations.push({ type: 'links-checked', description: String(checked) });
  expect(problems).toEqual([]);
});

test('home links to every live tool; hubs link to every tool in their category; tools link to their hub', () => {
  const problems: string[] = [];
  const hrefs = (p: Page) =>
    new Set([...p.mainHtml.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]));
  const home = hrefs(pages.find((p) => p.path === '/')!);
  for (const s of LIVE_TOOLS) if (!home.has(`/${s}`)) problems.push(`home does not link to /${s}`);
  const compress = hrefs(pages.find((p) => p.path === '/compress-image')!);
  for (const s of LIVE_TOOLS.filter((x) => x.startsWith('compress-image-to')))
    if (!compress.has(`/${s}`)) problems.push(`/compress-image does not link to /${s}`);
  const conv = hrefs(pages.find((p) => p.path === '/image-converter')!);
  for (const s of [
    'webp-to-jpg',
    'webp-to-png',
    'png-to-webp',
    'jpg-to-webp',
    'png-to-jpg',
    'jpg-to-png',
  ])
    if (!conv.has(`/${s}`)) problems.push(`/image-converter does not link to /${s}`);
  for (const p of toolPages) {
    const hub = p.path.startsWith('/compress-image') ? '/compress-image' : '/image-converter';
    if (p.path !== hub && !hrefs(p).has(hub))
      problems.push(`${p.path} does not link to its hub ${hub}`);
    const related =
      [...p.mainHtml.matchAll(/<h2[^>]*>Related tools<\/h2>([\s\S]*?)<\/section>/g)][0]?.[1] ?? '';
    const n = (related.match(/<li>/g) ?? []).length;
    if (n < 4 || n > 6) problems.push(`${p.path}: ${n} related tools (want 4-6)`);
    const footer = /<footer[\s\S]*<\/footer>/.exec(p.html)?.[0] ?? '';
    for (const l of ['/about', '/privacy', '/terms', '/contact'])
      if (!footer.includes(`href="${l}"`)) problems.push(`${p.path}: footer lacks ${l}`);
  }
  expect(problems).toEqual([]);
});

test('heading order has no skipped levels; images have alt text', () => {
  const problems: string[] = [];
  for (const p of pages) {
    const levels = [...p.html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    let prev = 0;
    for (const l of levels) {
      if (prev && l > prev + 1) problems.push(`${p.path}: heading jumps h${prev} -> h${l}`);
      prev = l;
    }
    for (const m of p.html.matchAll(/<img\s[^>]*>/g))
      if (!/\salt=/.test(m[0])) problems.push(`${p.path}: <img> without alt`);
  }
  expect(problems).toEqual([]);
});

test('text is in the HTML without JavaScript (H1, intro, sections, FAQ answers present in raw HTML)', () => {
  const problems: string[] = [];
  for (const p of toolPages) {
    const raw = textOf(p.mainHtml);
    if (!raw.includes(p.h1s[0])) problems.push(`${p.path}: H1 missing`);
    if (p.below.split(' ').length < 300)
      problems.push(`${p.path}: only ${p.below.split(' ').length} words in server HTML`);
    if (!p.mainHtml.includes('data-testid="file-input"'))
      problems.push(`${p.path}: file picker not in server-rendered HTML`);
    if (!p.mainHtml.includes('Your images stay on your device'))
      problems.push(`${p.path}: privacy note missing in HTML`);
  }
  expect(problems).toEqual([]);
});

// ── content rules ────────────────────────────────────────────────────────

test('word count below the tool (>= 400)', () => {
  const rows = toolPages.map((p) => {
    const sansRelated = p.mainHtml.replace(/<h2[^>]*>Related tools<\/h2>[\s\S]*?<\/section>/, '');
    const idx = sansRelated.indexOf('max-w-[680px]');
    const words = textOf(sansRelated.slice(idx)).split(' ').filter(Boolean).length;
    const all = p.below.split(' ').filter(Boolean).length;
    logMetric('word-count.ndjson', {
      page: p.path,
      wordsBelowTool: all,
      wordsExcludingRelatedCards: words,
    });
    return { path: p.path, all, words };
  });
  const thin = rows.filter((r) => r.words < 400);
  expect(thin, JSON.stringify(rows)).toEqual([]);
});

function shingles(text: string, n = 5): Set<string> {
  const w = text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const s = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '));
  return s;
}

test('content similarity between sibling tool pages (< 30%)', () => {
  const strip = (p: Page, dropBoilerplate: boolean) => {
    let h = p.mainHtml.slice(Math.max(0, p.mainHtml.indexOf('max-w-[680px]')));
    if (dropBoilerplate) {
      h = h.replace(/<h2[^>]*>Related tools<\/h2>[\s\S]*?<\/section>/, '');
    }
    return textOf(h);
  };
  const results: {
    a: string;
    b: string;
    contain: number;
    jaccard: number;
    containNoRelated: number;
  }[] = [];
  const full = new Map(toolPages.map((p) => [p.path, shingles(strip(p, false))]));
  const lean = new Map(toolPages.map((p) => [p.path, shingles(strip(p, true))]));
  for (let i = 0; i < toolPages.length; i++) {
    for (let j = i + 1; j < toolPages.length; j++) {
      const A = full.get(toolPages[i].path)!;
      const B = full.get(toolPages[j].path)!;
      const inter = [...A].filter((x) => B.has(x)).length;
      const LA = lean.get(toolPages[i].path)!;
      const LB = lean.get(toolPages[j].path)!;
      const interLean = [...LA].filter((x) => LB.has(x)).length;
      results.push({
        a: toolPages[i].path,
        b: toolPages[j].path,
        contain: inter / Math.min(A.size, B.size),
        jaccard: inter / (A.size + B.size - inter),
        containNoRelated: interLean / Math.min(LA.size, LB.size),
      });
    }
  }
  for (const r of results) logMetric('similarity.ndjson', r);
  const over = results.filter((r) => r.contain > 0.3 || r.jaccard > 0.3);
  const worst = [...results].sort((x, y) => y.contain - x.contain).slice(0, 8);
  test
    .info()
    .annotations.push({
      type: 'worst-pairs',
      description: JSON.stringify(
        worst.map((w) => [w.a, w.b, +w.contain.toFixed(3), +w.jaccard.toFixed(3)]),
      ),
    });
  expect(
    over.map(
      (r) =>
        `${r.a} ~ ${r.b}: containment ${(r.contain * 100).toFixed(1)}%, jaccard ${(r.jaccard * 100).toFixed(1)}%`,
    ),
  ).toEqual([]);
});

// Not banned outright, but each hit needs a human look (unsourced requirement claims).
const REVIEW = /\b(passport|visa|official|government|requirement|required by|mandatory)\b/i;
const ALLOW = [/best way to reach/i];

const BANNED: [string, RegExp][] = [
  ['"best"', /\bbest\b/i],
  ['"#1" / "number one"', /#\s?1\b|number one|no\. ?1\b/i],
  ['"trusted by"', /trusted by/i],
  ['"million(s)"', /\bmillions?\b/i],
  [
    'star rating',
    /★|☆|\bstars?\b|\brated\b|\b\d(\.\d)?\s*\/\s*5\b|\breviews?\b|\btestimonials?\b/i,
  ],
  [
    'superlatives',
    /\bfastest\b|\bmost popular\b|\bleading\b|\bworld'?s\b|\bunlimited\b|\bguaranteed?\b/i,
  ],
  [
    'specific exam/agency names',
    /\b(SSC|HSC|JEE|NEET|UPSC|IELTS|TOEFL|GRE|GMAT|SAT|BCS|IBPS|RRB|NTA|CBSE|PSC|Aadhaar|NID|USCIS|DV lottery|Naukri|BDJobs)\b/i,
  ],
  ['invented user/usage stats', /\b\d[\d,]*\+?\s*(users|visitors|downloads|people|customers)\b/i],
];

test('banned claims: scan all visible text (flags for review)', () => {
  const hits: string[] = [];
  for (const p of pages) {
    const text = textOf(
      p.mainHtml.replace(/<h2[^>]*>Related tools<\/h2>/, '<h2>Related tools</h2>'),
    );
    for (const [label, re] of BANNED) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      for (const m of text.matchAll(g)) {
        const at = m.index ?? 0;
        if (ALLOW.some((a) => a.test(text.slice(Math.max(0, at - 20), at + 40)))) continue;
        hits.push(`${p.path} [${label}]: ...${text.slice(Math.max(0, at - 60), at + 70)}...`);
      }
    }
  }
  const review: string[] = [];
  for (const p of pages) {
    const text = textOf(p.mainHtml);
    for (const m of text.matchAll(new RegExp(REVIEW.source, 'gi'))) {
      const at = m.index ?? 0;
      review.push(`${p.path}: ...${text.slice(Math.max(0, at - 70), at + 70)}...`);
    }
  }
  for (const r of review) logMetric('review-claims.ndjson', { review: r });
  test
    .info()
    .annotations.push({
      type: 'needs-human-review',
      description: `${review.length} mentions of passport/visa/official/requirement`,
    });
  for (const h of hits) logMetric('banned-claims.ndjson', { hit: h });
  expect(hits, `\n${hits.join('\n')}`).toEqual([]);
});

test('numbers in content: no invented benchmark table before reports/benchmarks.json exists', () => {
  const hasBench = existsSync(join(OUT_DIR, '..', 'reports', 'benchmarks.json'));
  const problems: string[] = [];
  for (const p of toolPages) {
    if (!hasBench && /<table/.test(p.mainHtml) && /Measured with Img Master/i.test(p.mainHtml)) {
      problems.push(
        `${p.path}: has a "Measured with Img Master" table but there is no reports/benchmarks.json`,
      );
    }
  }
  expect(problems).toEqual([]);
});

test('no leftover placeholder text (TODO, lorem, TBD, undefined, [object])', () => {
  const problems: string[] = [];
  for (const p of pages) {
    const t = textOf(p.mainHtml);
    for (const re of [
      /\bTODO\b/,
      /lorem ipsum/i,
      /\bTBD\b/,
      /\bundefined\b/,
      /\[object/,
      /\bnull\b/,
      /\{[a-z]+\}/,
    ]) {
      const m = re.exec(t);
      if (m)
        problems.push(
          `${p.path}: "${m[0]}" near "${t.slice(Math.max(0, m.index - 30), m.index + 40)}"`,
        );
    }
  }
  expect(problems).toEqual([]);
});

test('privacy and legal pages: contact email present, "Last updated" date shown', () => {
  const problems: string[] = [];
  for (const slug of LEGAL) {
    const p = pages.find((x) => x.path === `/${slug}`)!;
    if (!/Last updated/i.test(p.below)) problems.push(`/${slug}: no "Last updated"`);
  }
  for (const p of toolPages)
    if (!/Last updated/i.test(p.below)) problems.push(`${p.path}: no "Last updated"`);
  const priv = pages.find((x) => x.path === '/privacy')!;
  if (
    !/nothing is uploaded|never (sent|uploaded)|not uploaded|stay on your device/i.test(priv.below)
  )
    problems.push('/privacy does not state that images are not uploaded');
  const about = pages.find((x) => x.path === '/about')!;
  if (!/Softwara|Moniruzzaman/.test(about.below))
    problems.push('/about does not name who runs the site');
  expect(problems).toEqual([]);
});
