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

  it('has the 14 Phase 1 live pages and favicon tools as drafts', () => {
    expect(getLiveTools()).toHaveLength(14);
    expect(getTool('favicon-generator')?.status).toBe('draft');
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
    expect(getToolsByCategory('favicon')).toHaveLength(0);
  });
});
