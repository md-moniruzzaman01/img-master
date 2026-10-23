// Content validation (docs/SEO.md §2–4). Owned by seo-content.
import { describe, expect, it } from 'vitest';
import { toolContent } from '@/content/pages';
import { homeContent } from '@/content/home';
import { legalContent } from '@/content/legal';
import { getLiveTools, getTool, tools } from '@/lib/tools';
import type { ToolContent } from '@/lib/types';
import {
  allLinks,
  belowToolText,
  containsKeyword,
  inlineLinks,
  overlap,
  shingles,
  wordCount,
} from './content-text';

const live = getLiveTools();
const liveSlugs = new Set(live.map((t) => t.slug));
// Every tool that has content is checked, live or draft, so drafts are validated before launch.
const withContent = tools.filter((t) => toolContent[t.slug]);
const knownSlugs = new Set(withContent.map((t) => t.slug));
const pages: [string, ToolContent][] = withContent.map((t) => [t.slug, toolContent[t.slug]!]);

const BANNED = [
  /\bbest\b/i,
  /#1\b/,
  /\bnumber one\b/i,
  /\bmillions?\b/i,
  /\brating\b/i,
  /\breviews?\b/i,
];

describe('tool page content', () => {
  it('exists for every live tool', () => {
    for (const t of live) expect(toolContent[t.slug], t.slug).toBeDefined();
  });

  it.each(pages)('%s: title, description and short fields fit their limits', (slug, c) => {
    expect(c.title.length, `${slug} title`).toBeLessThanOrEqual(60);
    expect(c.title.endsWith(' | Img Master'), `${slug} title brand`).toBe(true);
    expect(c.description.length, `${slug} description`).toBeGreaterThanOrEqual(120);
    expect(c.description.length, `${slug} description`).toBeLessThanOrEqual(155);
    expect(c.shortName.length, `${slug} shortName`).toBeLessThanOrEqual(18);
    expect(c.cardDescription.length, `${slug} cardDescription`).toBeLessThanOrEqual(70);
    expect(c.subtitle.length, `${slug} subtitle`).toBeLessThanOrEqual(100);
  });

  it.each(pages)('%s: has 2–4 sections, 4–6 FAQs, 3–8 secondary keywords', (_slug, c) => {
    expect(c.sections.length).toBeGreaterThanOrEqual(2);
    expect(c.sections.length).toBeLessThanOrEqual(4);
    expect(c.faqs.length).toBeGreaterThanOrEqual(4);
    expect(c.faqs.length).toBeLessThanOrEqual(6);
    expect(c.secondaryKeywords.length).toBeGreaterThanOrEqual(3);
    expect(c.secondaryKeywords.length).toBeLessThanOrEqual(8);
    expect(c.howTo).toHaveLength(3);
  });

  it.each(pages)('%s: related has 4–6 live slugs, not itself, no duplicates', (slug, c) => {
    expect(c.related.length).toBeGreaterThanOrEqual(4);
    expect(c.related.length).toBeLessThanOrEqual(6);
    expect(new Set(c.related).size).toBe(c.related.length);
    expect(c.related).not.toContain(slug);
    for (const r of c.related) expect(knownSlugs.has(r), `${slug} → ${r}`).toBe(true);
  });

  it.each(pages)('%s: a live page links only to live pages', (slug, c) => {
    if (!liveSlugs.has(slug)) return;
    for (const r of c.related) expect(liveSlugs.has(r), `${slug} related ${r} is draft`).toBe(true);
    for (const href of allLinks(c)) {
      if (
        href.startsWith('/') &&
        href !== '/' &&
        !['/about', '/privacy', '/terms', '/contact'].includes(href)
      )
        expect(liveSlugs.has(href.slice(1)), `${slug} links to draft ${href}`).toBe(true);
    }
  });

  it.each(pages)('%s: every internal link points to a live page', (slug, c) => {
    const known = new Set(['/', '/about', '/privacy', '/terms', '/contact']);
    for (const href of allLinks(c)) {
      if (!href.startsWith('/')) continue;
      expect(href.endsWith('/') && href !== '/', `${slug} trailing slash ${href}`).toBe(false);
      const ok = known.has(href) || knownSlugs.has(href.slice(1));
      expect(ok, `${slug} links to ${href}`).toBe(true);
      expect(href, `${slug} links to itself`).not.toBe(`/${slug}`);
    }
  });

  it.each(pages)('%s: 1–2 contextual links in the text (hub tables excluded)', (_slug, c) => {
    const n = inlineLinks(c).length;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(2);
  });

  it.each(pages)('%s: primary keyword in title, H1, intro and one H2', (slug, c) => {
    expect(containsKeyword(c.title, c.primaryKeyword), `${slug} title`).toBe(true);
    expect(containsKeyword(c.h1, c.primaryKeyword), `${slug} h1`).toBe(true);
    const intro = `${c.subtitle} ${c.sections[0].paragraphs[0]}`;
    expect(containsKeyword(intro, c.primaryKeyword), `${slug} subtitle/intro`).toBe(true);
    // An H2 carries the keyword's distinctive words ("50kb", "webp … jpg", "converter").
    const key = c.primaryKeyword.split(' ').filter((w) => !['to', 'image', 'online'].includes(w));
    const hit = c.sections.some((s) => key.every((w) => s.heading.toLowerCase().includes(w)));
    expect(hit, `${slug} H2 with ${key.join(' + ')}`).toBe(true);
  });

  it.each(pages)('%s: 400–800 words below the tool', (_slug, c) => {
    const n = wordCount(c);
    expect(n).toBeGreaterThanOrEqual(400);
    expect(n).toBeLessThanOrEqual(800);
  });

  it.each(pages)('%s: no unsupported claims or placeholders', (slug, c) => {
    const text = `${c.title} ${c.description} ${c.subtitle} ${belowToolText(c)}`;
    for (const re of BANNED) expect(re.test(text), `${slug} matches ${re}`).toBe(false);
    expect(text).not.toMatch(/PLACEHOLDER|TODO|lorem/i);
  });

  it.each(pages)('%s: updatedAt is an ISO date', (_slug, c) => {
    expect(c.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(c.updatedAt))).toBe(false);
  });

  it('titles, descriptions and H1s are unique across the site', () => {
    const all = [...pages.map(([, c]) => c), homeContent, ...Object.values(legalContent)];
    const titles = all.map((c) => c.title);
    const descriptions = all.map((c) => c.description);
    const h1s = all.map((c) => c.h1);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(h1s).size).toBe(h1s.length);
  });

  it('FAQ questions are not repeated across pages', () => {
    const qs = pages.flatMap(([, c]) => c.faqs.map((f) => f.q.toLowerCase()));
    expect(new Set(qs).size).toBe(qs.length);
  });

  it('sibling pages share less than 30% of their text (5-word shingles)', () => {
    const byCategory = new Map<string, [string, Set<string>][]>();
    for (const [slug, c] of pages) {
      const cat = getTool(slug)!.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push([slug, shingles(belowToolText(c))]);
    }
    const tooSimilar: string[] = [];
    for (const group of byCategory.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const o = overlap(group[i][1], group[j][1]);
          if (o >= 0.3)
            tooSimilar.push(`${group[i][0]} ~ ${group[j][0]}: ${(o * 100).toFixed(0)}%`);
        }
      }
    }
    expect(tooSimilar).toEqual([]);
  });
});

describe('home and legal content', () => {
  it('home fits its limits and has 4 FAQs', () => {
    expect(homeContent.title.length).toBeLessThanOrEqual(60);
    expect(homeContent.description.length).toBeGreaterThanOrEqual(120);
    expect(homeContent.description.length).toBeLessThanOrEqual(155);
    expect(homeContent.subtitle.length).toBeLessThanOrEqual(100);
    expect(homeContent.faqs).toHaveLength(4);
    expect(homeContent.trustItems.length).toBeGreaterThan(0);
  });

  it.each(Object.values(legalContent).map((c) => [c.slug, c] as const))(
    '%s: title, description, sections and date',
    (slug, c) => {
      expect(c.slug).toBe(slug);
      expect(c.title.length).toBeLessThanOrEqual(60);
      expect(c.title.endsWith(' | Img Master')).toBe(true);
      expect(c.description.length).toBeGreaterThanOrEqual(120);
      expect(c.description.length).toBeLessThanOrEqual(155);
      expect(c.sections.length).toBeGreaterThan(0);
      expect(c.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const text = JSON.stringify(c);
      expect(text).not.toMatch(/PLACEHOLDER|lorem/i);
    },
  );

  it('contact and about pages link to the configured email', async () => {
    const { siteConfig } = await import('@/lib/site-config');
    const mailto = `mailto:${siteConfig.contactEmail}`;
    expect(JSON.stringify(legalContent.contact)).toContain(mailto);
    expect(JSON.stringify(legalContent.about)).toContain(mailto);
    expect(JSON.stringify(legalContent.about)).toContain(siteConfig.owner.name);
  });
});
