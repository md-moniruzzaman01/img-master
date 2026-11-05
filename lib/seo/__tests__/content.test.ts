// Content validation (docs/SEO.md §2–4). Owned by seo-content.
import { describe, expect, it } from 'vitest';
import { toolContent } from '@/content/pages';
import { homeContent } from '@/content/home';
import { legalContent } from '@/content/legal';
import { howItWorksContent } from '@/content/pages/how-it-works';
import { fillCount, toolsIndexContent } from '@/content/pages/tools-index';
import { siteConfig } from '@/lib/site-config';
import { getLiveTools, getTool, tools } from '@/lib/tools';
import type { InfoPageContent, ToolContent } from '@/lib/types';
import {
  allLinks,
  belowToolText,
  containsKeyword,
  inlineLinks,
  isOneSentence,
  normalizeForKeyword,
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
const infoPages: [string, InfoPageContent][] = [
  ['/how-it-works', howItWorksContent],
  ['/tools', toolsIndexContent],
];
/** Site pages that are not tools; content may link to them. */
const SITE_PATHS = ['/', '/about', '/privacy', '/terms', '/contact', '/how-it-works', '/tools'];
/**
 * Draft tools that live pages may already link to, because the lead flips them
 * to live in the same change. Remove a slug once it is live in the registry.
 */
const LAUNCHING = new Set(['resize-image']);

/** Batch copy must use siteConfig.maxFiles; old designs said "up to 20". */
const WRONG_BATCH = new RegExp(
  `\\b(up to|max(imum)?( of)?)\\s+(?!${siteConfig.maxFiles}\\b)\\d+\\s+(files|images|photos)\\b|\\b20 (files|images|photos)\\b`,
  'i',
);

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
    const ok = (s: string) => liveSlugs.has(s) || LAUNCHING.has(s);
    for (const r of c.related) expect(ok(r), `${slug} related ${r} is draft`).toBe(true);
    for (const href of allLinks(c)) {
      if (href.startsWith('/') && !SITE_PATHS.includes(href))
        expect(ok(href.slice(1)), `${slug} links to draft ${href}`).toBe(true);
    }
  });

  it.each(pages)('%s: every internal link points to a live page', (slug, c) => {
    const known = new Set(SITE_PATHS);
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
    // The how-to and use-case headings count as H2s too. "50 KB" matches "50kb".
    const h2s = [
      c.howToHeading ?? '',
      c.useCases?.heading ?? '',
      ...c.sections.map((s) => s.heading),
    ];
    const hit = h2s.some((h) => key.every((w) => normalizeForKeyword(h).includes(w)));
    expect(hit, `${slug} H2 with ${key.join(' + ')}`).toBe(true);
  });

  it.each(pages)('%s: h1Accent is a non-empty part of the H1', (slug, c) => {
    expect(c.h1Accent, `${slug} h1Accent`).toBeTruthy();
    expect(c.h1.includes(c.h1Accent!), `${slug}: "${c.h1Accent}" not in "${c.h1}"`).toBe(true);
    expect(c.h1Accent!.length).toBeLessThan(c.h1.length);
  });

  it.each(pages)('%s: side tip is one short line', (slug, c) => {
    expect(c.sideTip, `${slug} sideTip`).toBeTruthy();
    expect(c.sideTip!.length, `${slug} sideTip`).toBeLessThanOrEqual(120);
    expect(c.sideTip).not.toMatch(/\[|\*\*/);
  });

  it.each(pages)('%s: use cases have 2–4 short cards', (slug, c) => {
    if (!c.useCases) return;
    const u = c.useCases;
    expect(u.heading.length, `${slug} use-case heading`).toBeLessThanOrEqual(60);
    if (u.intro) expect(u.intro.length, `${slug} use-case intro`).toBeLessThanOrEqual(120);
    expect(u.items.length).toBeGreaterThanOrEqual(2);
    expect(u.items.length).toBeLessThanOrEqual(4);
    for (const it of u.items) {
      expect(it.title.length, `${slug} "${it.title}"`).toBeLessThanOrEqual(28);
      expect(it.text.length, `${slug} "${it.text}"`).toBeLessThanOrEqual(70);
    }
    expect(new Set(u.items.map((i) => i.title)).size).toBe(u.items.length);
  });

  it.each(pages)('%s: compress-to-size pages have use cases', (slug, c) => {
    if (getTool(slug)!.kind === 'compress-to-size') expect(c.useCases, slug).toBeDefined();
  });

  it.each(pages)('%s: batch size is never hard-coded', (slug, c) => {
    expect(JSON.stringify(c), slug).not.toMatch(WRONG_BATCH);
  });

  it.each(pages)('%s: subtitle is one sentence', (slug, c) => {
    expect(isOneSentence(c.subtitle), `${slug} subtitle: ${c.subtitle}`).toBe(true);
  });

  it.each(pages)('%s: has a page-specific how-to heading (≤ 70 chars)', (slug, c) => {
    expect(c.howToHeading, `${slug} howToHeading`).toBeTruthy();
    expect(c.howToHeading!.length).toBeLessThanOrEqual(70);
    expect(c.howToHeading).not.toBe('How it works');
    const others = c.sections.map((s) => s.heading.toLowerCase());
    expect(others, `${slug} how-to heading repeats a section heading`).not.toContain(
      c.howToHeading!.toLowerCase(),
    );
  });

  it('how-to headings are unique across pages', () => {
    const hs = pages.map(([, c]) => (c.howToHeading ?? '').toLowerCase());
    expect(new Set(hs).size).toBe(hs.length);
  });

  it.each(pages)('%s: 400–800 words below the tool', (_slug, c) => {
    const n = wordCount(c);
    expect(n).toBeGreaterThanOrEqual(400);
    expect(n).toBeLessThanOrEqual(800);
  });

  it.each(pages)('%s: no unsupported claims or placeholders', (slug, c) => {
    const text = `${c.title} ${c.description} ${c.subtitle} ${c.sideTip ?? ''} ${belowToolText(c)}`;
    for (const re of BANNED) expect(re.test(text), `${slug} matches ${re}`).toBe(false);
    expect(text).not.toMatch(/PLACEHOLDER|TODO|lorem/i);
  });

  it.each(pages)('%s: updatedAt is an ISO date', (_slug, c) => {
    expect(c.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(c.updatedAt))).toBe(false);
  });

  it('titles, descriptions and H1s are unique across the site', () => {
    const all = [
      ...pages.map(([, c]) => c),
      ...infoPages.map(([, c]) => c),
      homeContent,
      ...Object.values(legalContent),
    ];
    const titles = all.map((c) => c.title);
    const descriptions = all.map((c) => c.description);
    const h1s = all.map((c) => c.h1);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(h1s).size).toBe(h1s.length);
  });

  it('FAQ questions are not repeated across pages', () => {
    const qs = [
      ...pages.flatMap(([, c]) => c.faqs),
      ...infoPages.flatMap(([, c]) => c.faqs ?? []),
      ...homeContent.faqs,
    ].map((f) => f.q.toLowerCase());
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

/** Claims the Figma drafts made that we cannot back up (CLAUDE.md rule 8). */
const UNPROVEN = [
  /most forms/i,
  /about a second/i,
  /\d+\s*% (lighter|smaller)/i,
  /before you.ve looked away/i,
  /\bbest\b/i,
  /#1\b/,
  /\bmillions?\b/i,
  /\breviews?\b/i,
];

describe('home and legal content', () => {
  it('home fits its limits', () => {
    expect(homeContent.title.length).toBeLessThanOrEqual(60);
    expect(homeContent.description.length).toBeGreaterThanOrEqual(120);
    expect(homeContent.description.length).toBeLessThanOrEqual(155);
    expect(homeContent.subtitle.length).toBeLessThanOrEqual(140);
    expect(homeContent.eyebrow.length).toBeLessThanOrEqual(30);
    expect(homeContent.faqs).toHaveLength(4);
    expect(homeContent.trustItems).toHaveLength(3);
    for (const t of homeContent.trustItems) expect(t.length).toBeLessThanOrEqual(28);
    expect(homeContent.values).toHaveLength(3);
    for (const v of homeContent.values) expect([...v.glyph]).toHaveLength(1);
  });

  it('home H1 is the owner-approved line with its accent', () => {
    expect(homeContent.h1).toBe('Cut any image down to size.');
    expect(homeContent.h1Accent).toBe('size.');
    expect(homeContent.h1.endsWith(homeContent.h1Accent!)).toBe(true);
  });

  it('home makes no unproven claims and the compare labels have no numbers', () => {
    const text = JSON.stringify(homeContent);
    for (const re of UNPROVEN) expect(re.test(text), `home matches ${re}`).toBe(false);
    expect(homeContent.compare.originalLabel).not.toMatch(/\d/);
    expect(homeContent.compare.resultLabel).not.toMatch(/\d/);
    expect(text).not.toMatch(WRONG_BATCH);
  });

  it('about has its eyebrow, intro and three values', () => {
    const a = legalContent.about;
    expect(a.eyebrow).toBe('About');
    expect(a.h1).toBe('One clean cut.');
    expect(a.intro?.length).toBeGreaterThan(0);
    expect(a.values).toHaveLength(3);
    for (const re of UNPROVEN)
      expect(re.test(JSON.stringify(a)), `about matches ${re}`).toBe(false);
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

describe('info pages (how it works, every tool)', () => {
  it.each(infoPages)('%s: title, description, subtitle and date', (path, c) => {
    expect(c.title.length, `${path} title`).toBeLessThanOrEqual(60);
    expect(c.title.endsWith(' | Img Master'), `${path} title brand`).toBe(true);
    expect(c.description.length, `${path} description`).toBeGreaterThanOrEqual(120);
    expect(c.description.length, `${path} description`).toBeLessThanOrEqual(155);
    expect(c.subtitle.length, `${path} subtitle`).toBeLessThanOrEqual(140);
    expect(c.sections.length).toBeGreaterThan(0);
    expect(c.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (c.faqs) {
      expect(c.faqs.length).toBeGreaterThanOrEqual(3);
      expect(c.faqs.length).toBeLessThanOrEqual(6);
    }
  });

  it.each(infoPages)('%s: no unproven claims, placeholders or hard-coded batch size', (path, c) => {
    const text = JSON.stringify(c);
    for (const re of UNPROVEN) expect(re.test(text), `${path} matches ${re}`).toBe(false);
    expect(text).not.toMatch(/PLACEHOLDER|TODO|lorem/i);
    expect(text).not.toMatch(WRONG_BATCH);
  });

  it.each(infoPages)('%s: internal links point to live pages', (path, c) => {
    const texts = [
      ...c.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])]),
      ...(c.faqs ?? []).map((f) => f.a),
    ];
    const hrefs = texts.flatMap((t) => [...t.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]));
    for (const href of hrefs) {
      if (!href.startsWith('/')) continue;
      const slug = href.slice(1);
      const ok = SITE_PATHS.includes(href) || liveSlugs.has(slug) || LAUNCHING.has(slug);
      expect(ok, `${path} links to ${href}`).toBe(true);
      expect(href).not.toBe(path);
    }
  });

  it('every-tool subtitle uses the {count} placeholder and no typed number', () => {
    const s = toolsIndexContent.subtitle;
    expect(s).toContain('{count}');
    expect(s.replace('{count}', '')).not.toMatch(/\d/);
    expect(fillCount(s, 17)).toBe(s.replace('{count}', '17'));
    for (const t of [toolsIndexContent.title, toolsIndexContent.description, toolsIndexContent.h1])
      expect(t).not.toMatch(/\{count\}|\b\d+ tools\b/);
  });

  it('every-tool H1 is "Every tool"', () => {
    expect(toolsIndexContent.h1).toBe('Every tool');
  });
});
