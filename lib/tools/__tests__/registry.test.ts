import { describe, expect, it } from 'vitest';
import {
  assertLiveToolsHaveContent,
  getCategoryHub,
  getLiveTools,
  getTool,
  getToolsByCategory,
  tools,
} from '@/lib/tools';

describe('tool registry', () => {
  it('has unique slugs in kebab-case', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every live tool has content and valid related links', () => {
    expect(() => assertLiveToolsHaveContent()).not.toThrow();
  });

  it('has the 18 live pages (Phase 1 plus favicon tools)', () => {
    expect(getLiveTools()).toHaveLength(18);
    expect(getTool('favicon-generator')?.status).toBe('live');
    expect(getTool('compress-image-to-1mb')?.preset.targetKB).toBe(1000);
  });

  it('compress-to-size tools have a target and JPG output', () => {
    for (const t of tools.filter((t) => t.kind === 'compress-to-size')) {
      expect(t.preset.targetKB).toBeGreaterThan(0);
      expect(t.preset.to).toBe('jpeg');
    }
  });

  it('live categories have a live hub', () => {
    expect(getCategoryHub('compress')?.slug).toBe('compress-image');
    expect(getCategoryHub('convert')?.slug).toBe('image-converter');
    expect(getCategoryHub('favicon')?.slug).toBe('favicon-generator');
    expect(getToolsByCategory('favicon')).toHaveLength(4);
  });
});

describe('navigation helpers', () => {
  it('builds breadcrumbs that end with the page short name', async () => {
    const { getBreadcrumbs, getToolContent } = await import('@/lib/tools');
    const crumbs = getBreadcrumbs('compress-image-to-50kb');
    expect(crumbs[0]).toEqual({ label: 'Home', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Compress', href: '/compress-image' });
    expect(crumbs.at(-1)).toEqual({ label: getToolContent('compress-image-to-50kb')!.shortName });
    expect(getBreadcrumbs('compress-image')).toHaveLength(2);
  });

  it('groups live tools and lists size links smallest first', async () => {
    const { getNavGroups, getSizeLinks } = await import('@/lib/tools');
    expect(getNavGroups().map((g) => g.category)).toEqual(['compress', 'convert', 'favicon']);
    expect(getSizeLinks().map((l) => l.label)).toEqual([
      '20KB',
      '50KB',
      '100KB',
      '200KB',
      '500KB',
      '1MB',
    ]);
  });
});
