// Metadata, JSON-LD, sitemap and robots checks (docs/SEO.md §5). Owned by seo-content.
import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { homeContent } from '@/content/home';
import { legalContent } from '@/content/legal';
import { howItWorksContent } from '@/content/pages/how-it-works';
import { toolsIndexContent } from '@/content/pages/tools-index';
import { homeJsonLd, infoPageJsonLd, toolJsonLd, toolsIndexJsonLd } from '@/lib/seo/jsonld';
import {
  absoluteUrl,
  buildInfoMetadata,
  buildPageMetadata,
  buildRootMetadata,
  buildToolMetadata,
  toPlainText,
} from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { getBreadcrumbs, getLiveToolPage, getLiveTools, getToolContent, tools } from '@/lib/tools';

const origin = siteConfig.url.replace(/\/+$/, '');
const live = getLiveTools().map((t) => getLiveToolPage(t.slug));

function roundTrip(data: unknown): unknown {
  return JSON.parse(JSON.stringify(data));
}

/** Walk any JSON value and collect every "@type". */
function types(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => types(x, out));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (k === '@type' && typeof x === 'string') out.push(x);
      else types(x, out);
    }
  }
  return out;
}

describe('absoluteUrl', () => {
  it('builds canonical URLs without trailing slashes', () => {
    expect(absoluteUrl('/webp-to-jpg')).toBe(`${origin}/webp-to-jpg`);
    expect(absoluteUrl('webp-to-jpg/')).toBe(`${origin}/webp-to-jpg`);
    expect(absoluteUrl('/')).toBe(origin);
  });

  it('turns inline syntax into plain text', () => {
    expect(toPlainText('Use **this** [tool](/compress-image) now')).toBe('Use this tool now');
  });
});

describe('metadata builders', () => {
  it('root metadata has metadataBase, default title and site name', () => {
    const m = buildRootMetadata();
    expect(m.metadataBase?.toString()).toBe(`${origin}/`);
    expect(m.title).toMatchObject({ default: homeContent.title });
    expect(m.openGraph).toMatchObject({ siteName: siteConfig.name, type: 'website' });
    expect(m.formatDetection).toMatchObject({ telephone: false });
  });

  it.each(live.map((p) => [p.tool.slug, p] as const))('%s: full tool metadata', (slug, p) => {
    const m = buildToolMetadata(p.tool, p.content);
    expect(m.title).toEqual({ absolute: p.content.title });
    expect(String((m.title as { absolute: string }).absolute).match(/Img Master/g)).toHaveLength(1);
    expect(m.description).toBe(p.content.description);
    expect(m.alternates?.canonical).toBe(`${origin}/${slug}`);
    expect(m.robots).toEqual({ index: true, follow: true });
    expect(m.openGraph).toMatchObject({
      title: p.content.title,
      description: p.content.description,
      url: `${origin}/${slug}`,
      type: 'website',
      siteName: siteConfig.name,
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('page metadata supports noindex and drops the canonical', () => {
    const m = buildPageMetadata({
      title: 'Not found | Img Master',
      description: 'x',
      path: '/404',
      noindex: true,
    });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates).toBeUndefined();
  });

  it('legal pages get canonical URLs', () => {
    for (const c of Object.values(legalContent)) {
      const m = buildPageMetadata({
        title: c.title,
        description: c.description,
        path: `/${c.slug}`,
      });
      expect(m.alternates?.canonical).toBe(`${origin}/${c.slug}`);
    }
  });
});

describe('JSON-LD', () => {
  it('home is WebSite + Organization and round-trips through JSON', () => {
    const data = homeJsonLd();
    expect(roundTrip(data)).toEqual(data);
    expect(data.map((d) => (d as { '@type': string })['@type'])).toEqual([
      'WebSite',
      'Organization',
    ]);
  });

  it.each(live.map((p) => [p.tool.slug, p] as const))('%s: valid tool JSON-LD', (slug, p) => {
    const data = toolJsonLd(p.tool, p.content);
    expect(roundTrip(data)).toEqual(data);
    const all = types(data);
    for (const banned of ['AggregateRating', 'Review', 'HowTo']) expect(all).not.toContain(banned);

    const [app, crumbs, faq] = data as Record<string, unknown>[];
    expect(app['@type']).toBe('WebApplication');
    expect(app.url).toBe(`${origin}/${slug}`);
    expect(app.offers).toMatchObject({ price: '0', priceCurrency: 'USD' });

    // Breadcrumbs match the visible trail exactly.
    const visible = getBreadcrumbs(slug);
    const items = crumbs.itemListElement as { name: string; item: string; position: number }[];
    expect(items.map((i) => i.name)).toEqual(visible.map((c) => c.label));
    expect(items.at(-1)!.item).toBe(`${origin}/${slug}`);

    // FAQPage matches the visible FAQs exactly (as plain text).
    const qs = faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(qs.map((q) => q.name)).toEqual(p.content.faqs.map((f) => toPlainText(f.q)));
    expect(qs.map((q) => q.acceptedAnswer.text)).toEqual(
      p.content.faqs.map((f) => toPlainText(f.a)),
    );
  });
});

describe('sitemap and robots', () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it('lists exactly home, the info pages, every live tool and the legal pages', () => {
    const expected = [
      origin,
      `${origin}/tools`,
      `${origin}/how-it-works`,
      ...getLiveTools().map((t) => `${origin}/${t.slug}`),
      ...Object.keys(legalContent).map((s) => `${origin}/${s}`),
    ];
    expect([...urls].sort()).toEqual([...expected].sort());
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses one home URL form in the sitemap, canonical and og:url (QA-07)', () => {
    const m = buildPageMetadata({ title: 'Home | Img Master', description: 'x', path: '/' });
    expect(urls).toContain(origin);
    expect(urls).not.toContain(`${origin}/`);
    expect(m.alternates?.canonical).toBe(origin);
    expect((m.openGraph as { url?: string }).url).toBe(origin);
  });

  it('gives site pages the shared Open Graph and Twitter image (QA-05)', () => {
    const m = buildPageMetadata({ title: 'About | Img Master', description: 'x', path: '/about' });
    const og = (m.openGraph as { images?: { url: string }[] }).images ?? [];
    const tw = (m.twitter as { images?: { url: string }[] }).images ?? [];
    expect(og[0]?.url).toBe(`${origin}/opengraph-image`);
    expect(tw[0]?.url).toBe(`${origin}/opengraph-image`);
  });

  it('leaves tool pages to their own opengraph-image file', () => {
    for (const tool of getLiveTools()) {
      const content = getToolContent(tool.slug);
      if (!content) continue;
      const m = buildToolMetadata(tool, content);
      expect((m.openGraph as { images?: unknown }).images, tool.slug).toBeUndefined();
      expect((m.twitter as { images?: unknown }).images, tool.slug).toBeUndefined();
    }
  });

  it('never lists draft tools', () => {
    for (const t of tools.filter((t) => t.status === 'draft')) {
      expect(urls).not.toContain(`${origin}/${t.slug}`);
    }
  });

  it('every entry has a lastModified date', () => {
    for (const e of entries) expect(String(e.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('robots allows everything and points to the sitemap', () => {
    const r = robots();
    expect(r.sitemap).toBe(`${origin}/sitemap.xml`);
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/' });
  });
});

describe('info pages: metadata and JSON-LD', () => {
  const info = [
    ['/how-it-works', howItWorksContent],
    ['/tools', toolsIndexContent],
  ] as const;

  it.each(info)('%s: canonical, title and shared OG image', (path, c) => {
    const m = buildInfoMetadata(c, path);
    expect(m.title).toEqual({ absolute: c.title });
    expect(m.description).toBe(c.description);
    expect(m.alternates?.canonical).toBe(`${origin}${path}`);
    expect(m.robots).toEqual({ index: true, follow: true });
    const og = (m.openGraph as { images?: { url: string }[]; url?: string }) ?? {};
    expect(og.url).toBe(`${origin}${path}`);
    expect(og.images?.[0]?.url).toBe(`${origin}/opengraph-image`);
  });

  it('how it works: WebPage + FAQPage matching the visible FAQs', () => {
    const data = infoPageJsonLd(howItWorksContent, '/how-it-works');
    expect(roundTrip(data)).toEqual(data);
    const [page, faq] = data as Record<string, unknown>[];
    expect(page['@type']).toBe('WebPage');
    expect(page.url).toBe(`${origin}/how-it-works`);
    expect(page.name).toBe(howItWorksContent.h1);
    const qs = faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(qs.map((q) => q.name)).toEqual(
      (howItWorksContent.faqs ?? []).map((f) => toPlainText(f.q)),
    );
    for (const banned of ['AggregateRating', 'Review', 'HowTo'])
      expect(types(data)).not.toContain(banned);
  });

  it('every tool: CollectionPage with an ItemList of live tools', () => {
    const data = toolsIndexJsonLd(toolsIndexContent);
    expect(roundTrip(data)).toEqual(data);
    const [page] = data as Record<string, unknown>[];
    expect(page['@type']).toBe('CollectionPage');
    expect(page.url).toBe(`${origin}/tools`);
    const list = page.mainEntity as { itemListElement: { url: string; position: number }[] };
    const liveUrls = getLiveTools().map((t) => `${origin}/${t.slug}`);
    expect(list.itemListElement.map((i) => i.url)).toEqual(liveUrls);
    expect(list.itemListElement.map((i) => i.position)).toEqual(liveUrls.map((_, i) => i + 1));
    expect(JSON.stringify(data)).not.toContain('{count}');
  });

  it('every tool: ItemList follows the slugs the page renders', () => {
    const data = toolsIndexJsonLd(toolsIndexContent, { slugs: ['webp-to-jpg', 'compress-image'] });
    const list = (data[0] as { mainEntity: { itemListElement: { url: string }[] } }).mainEntity;
    expect(list.itemListElement.map((i) => i.url)).toEqual([
      `${origin}/webp-to-jpg`,
      `${origin}/compress-image`,
    ]);
  });
});
