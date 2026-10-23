import { describe, expect, it } from 'vitest';
import { isEngineError } from '../../types';
import {
  containRect,
  contentBox,
  fitText,
  imageCropRect,
  paddingFraction,
  shapeGeometry,
} from '../favicon/geometry';
import {
  buildManifest,
  buildReadme,
  buildSnippet,
  normalizeSpec,
  packageFileNames,
  themeHex,
  type WireFaviconSource,
} from '../favicon/package';
import { buildSvg, isSafeColor, xmlEscape } from '../favicon/svg';

const HOSTILE = '<script>"&';
const text = (over: Record<string, unknown> = {}): WireFaviconSource =>
  ({
    mode: 'text',
    text: 'AB',
    fontWeight: 600,
    color: '#ffffff',
    background: '#1a73e8',
    shape: 'rounded',
    padding: 10,
    ...over,
  }) as WireFaviconSource;
const layout = { fontSize: 200, x: 100, y: 300 };

describe('xmlEscape and colors', () => {
  it('escapes markup characters', () => {
    expect(xmlEscape(HOSTILE)).toBe('&lt;script&gt;&quot;&amp;');
    expect(xmlEscape("it's")).toBe('it&apos;s');
  });
  it('strips characters XML cannot contain', () => {
    expect(xmlEscape('a\u0000b\u0008c')).toBe('abc');
  });
  it('accepts only hex colors', () => {
    for (const c of ['#fff', '#FFFF', '#1a73e8', '#1a73e8ff']) expect(isSafeColor(c)).toBe(true);
    for (const c of [
      'red',
      '#12',
      '#12345',
      '#ggg',
      'url(#x)',
      '#fff" onload="x',
      'transparent',
      1,
      null,
    ])
      expect(isSafeColor(c)).toBe(false);
  });
});

describe('buildSvg', () => {
  const base = {
    kind: 'text' as const,
    text: 'A',
    shape: 'square' as const,
    background: '#112233',
    color: '#ffffff',
    fontWeight: 800,
    layout,
  };
  it('never lets hostile text break out', () => {
    const svg = buildSvg({ ...base, text: HOSTILE });
    expect(svg).toContain('>&lt;script&gt;&quot;&amp;</text>');
    expect(svg).not.toContain('<script');
  });
  it('rejects unsafe colors', () => {
    expect(() => buildSvg({ ...base, background: '#fff" onload="x' })).toThrow();
    expect(() => buildSvg({ ...base, color: 'red' })).toThrow();
  });
  it('draws shapes', () => {
    expect(buildSvg({ ...base, shape: 'circle' })).toContain(
      '<circle cx="256" cy="256" r="256" fill="#112233"/>',
    );
    expect(buildSvg({ ...base, shape: 'rounded' })).toContain('rx="102.4"');
    expect(buildSvg({ ...base, shape: 'square' })).not.toContain('rx=');
    expect(buildSvg({ ...base, background: 'transparent' })).not.toMatch(/<rect|<circle/);
  });
  it('uses single quotes in the font family and weight only for text', () => {
    const svg = buildSvg(base);
    expect(svg).toContain("font-family=\"ui-sans-serif, system-ui, -apple-system, 'Segoe UI'");
    expect(svg).toContain('font-weight="800"');
    const emoji = buildSvg({ ...base, kind: 'emoji', text: '\u{1F600}' });
    expect(emoji).not.toContain('font-weight');
    expect(emoji).toContain('Emoji');
  });
});

describe('normalizeSpec', () => {
  it('keeps at most 3 characters and trims', () => {
    expect(normalizeSpec(text({ text: '  ABCDE ' })).text).toBe('ABC');
  });
  it('rejects empty text and emoji with a helpful message', () => {
    const empties = [
      text({ text: '   ' }),
      {
        mode: 'emoji',
        emoji: '',
        background: '#fff',
        shape: 'square',
        padding: 10,
      } as WireFaviconSource,
    ];
    for (const src of empties) {
      let err: unknown;
      try {
        normalizeSpec(src);
      } catch (e) {
        err = e;
      }
      expect(isEngineError(err)).toBe(true);
      expect((err as Error).message.length).toBeGreaterThan(10);
    }
  });
  it('rejects bad colors', () => {
    expect(() => normalizeSpec(text({ color: 'red' }))).toThrow();
    expect(() => normalizeSpec(text({ background: 'transparent' }))).toThrow();
    expect(() =>
      normalizeSpec({
        mode: 'emoji',
        emoji: '\u{1F600}',
        background: '"><x',
        shape: 'square',
        padding: 5,
      }),
    ).toThrow();
  });
  it('allows transparent for emoji and image, and clamps numbers', () => {
    const e = normalizeSpec({
      mode: 'emoji',
      emoji: '\u{1F600}\u{1F600}',
      background: 'transparent',
      shape: 'circle',
      padding: 99,
    });
    expect(e.text).toBe('\u{1F600}');
    expect(e.background).toBe('transparent');
    expect(e.padding).toBe(40);
    const i = normalizeSpec({
      mode: 'image',
      zoom: 9,
      padding: -4,
      background: 'transparent',
      shape: 'x' as never,
    });
    expect(i.zoom).toBe(4);
    expect(i.padding).toBe(0);
    expect(i.shape).toBe('square');
    expect(
      normalizeSpec({ mode: 'image', zoom: NaN, padding: 5, background: '#fff', shape: 'square' })
        .zoom,
    ).toBe(1);
  });
});

describe('package files, snippet, manifest, README', () => {
  it('lists svg only for text and emoji', () => {
    expect(packageFileNames('image')).not.toContain('favicon.svg');
    expect(packageFileNames('text')).toContain('favicon.svg');
    expect(packageFileNames('emoji')).toContain('favicon.svg');
    expect(packageFileNames('image')).toEqual([
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'android-chrome-192x192.png',
      'android-chrome-512x512.png',
      'site.webmanifest',
      'README.txt',
    ]);
  });
  it('builds the snippet per mode', () => {
    expect(buildSnippet('image')).not.toContain('svg');
    expect(buildSnippet('text')).toContain(
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    );
    expect(buildSnippet('text')).not.toContain('<!--');
    for (const m of ['image', 'text', 'emoji'] as const) {
      expect(buildSnippet(m)).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48">');
      expect(buildSnippet(m)).toContain('<link rel="manifest" href="/site.webmanifest">');
    }
  });
  it('builds a valid manifest even with hostile names', () => {
    const spec = normalizeSpec(text({ text: '"}<' }));
    const m = JSON.parse(buildManifest(spec));
    expect(m.name).toBe('"}<');
    expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
    expect(m.theme_color).toBe('#1a73e8');
    expect(m.background_color).toBe('#1a73e8');
  });
  it('uses white for transparent backgrounds and a neutral name for images', () => {
    const spec = normalizeSpec({
      mode: 'image',
      zoom: 1,
      padding: 0,
      background: 'transparent',
      shape: 'square',
    });
    const m = JSON.parse(buildManifest(spec));
    expect(m.theme_color).toBe('#ffffff');
    expect(m.name).toBe('Favicon');
  });
  it('normalizes theme colors', () => {
    expect(themeHex('#abc')).toBe('#aabbcc');
    expect(themeHex('#AABBCCDD')).toBe('#aabbcc');
    expect(themeHex('#abcd')).toBe('#aabbcc');
    expect(themeHex('transparent')).toBe('#ffffff');
  });
  it('puts the snippet in the README', () => {
    for (const m of ['image', 'text'] as const) {
      const r = buildReadme(m, buildSnippet(m));
      expect(r).toContain(buildSnippet(m));
      expect(r.includes('favicon.svg  ')).toBe(m === 'text');
    }
  });
});

describe('geometry', () => {
  it('padding and content box', () => {
    expect(paddingFraction(100)).toBe(0.4);
    expect(paddingFraction(-5)).toBe(0);
    expect(contentBox(512, 10).side).toBeCloseTo(409.6);
    expect(contentBox(512, 10).x).toBeCloseTo(51.2);
  });
  it('shapes', () => {
    expect(shapeGeometry('rounded', 100)).toEqual({ kind: 'rect', radius: 20 });
    expect(shapeGeometry('circle', 100)).toEqual({ kind: 'circle' });
    expect(shapeGeometry('square', 100)).toEqual({ kind: 'rect', radius: 0 });
  });
  it('center square crop with zoom', () => {
    expect(imageCropRect(400, 200, 1)).toEqual({ sx: 100, sy: 0, side: 200 });
    expect(imageCropRect(400, 200, 2)).toEqual({ sx: 150, sy: 50, side: 100 });
    expect(imageCropRect(400, 200, 0.2).side).toBe(200);
  });
  it('contain rect', () => {
    expect(containRect(300, 150, 48)).toEqual({ x: 0, y: 12, width: 48, height: 24 });
    expect(containRect(10, 10, 48)).toEqual({ x: 0, y: 0, width: 48, height: 48 });
  });
  it('fits text and centers the ink box', () => {
    const l = fitText({ left: 0, right: 100, ascent: 80, descent: 0, fontSize: 100 }, 512, 400);
    expect(l.fontSize).toBeCloseTo(400);
    expect(l.x).toBeCloseTo(56);
    expect(l.y).toBeCloseTo(256 + 40 * 4);
    const tall = fitText({ left: 0, right: 10, ascent: 90, descent: 10, fontSize: 100 }, 512, 400);
    expect(tall.fontSize).toBeCloseTo(400);
  });
});
