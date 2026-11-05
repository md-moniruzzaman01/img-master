import { describe, expect, it } from 'vitest';
import {
  FONT_STACK,
  SANS_FALLBACK,
  SERIF_FALLBACK,
  cleanFontFamily,
  textFontStack,
} from '../favicon/geometry';
import {
  buildReadme,
  buildSnippet,
  hasSvg,
  normalizeSpec,
  packageFileNames,
  type WireFaviconSource,
} from '../favicon/package';
import { fontFor } from '../favicon/render';

const NEXT_FONT = "'__Yuji_Syuku_abc123', '__Yuji_Syuku_Fallback_abc123'";

const text = (over: Record<string, unknown> = {}): WireFaviconSource =>
  ({
    mode: 'text',
    text: 'IM',
    fontWeight: 600,
    color: '#ffffff',
    background: '#1a73e8',
    shape: 'rounded',
    padding: 10,
    ...over,
  }) as WireFaviconSource;

describe('cleanFontFamily', () => {
  it('accepts next/font family lists and system names', () => {
    expect(cleanFontFamily(NEXT_FONT)).toBe(NEXT_FONT);
    expect(cleanFontFamily('"Noto Serif JP", serif')).toBe('"Noto Serif JP", serif');
    expect(cleanFontFamily('  Georgia ,serif ')).toBe('Georgia, serif');
    expect(cleanFontFamily('-apple-system')).toBe('-apple-system');
  });
  it('rejects anything that is not a plain family list', () => {
    for (const bad of [
      '',
      '   ',
      undefined,
      null,
      42,
      'a; color: red',
      "'x'; } body {",
      'url(https://example.com/f.woff2)',
      "'unterminated",
      '"a\\"b"',
      'x'.repeat(500),
      'a, , b',
      'bold 20px serif / 2',
    ]) {
      expect(cleanFontFamily(bad)).toBeNull();
    }
  });
});

describe('textFontStack', () => {
  it('keeps today’s system stack without a custom family', () => {
    expect(textFontStack(undefined, null)).toBe(FONT_STACK);
    expect(textFontStack('brush', null)).toBe(FONT_STACK);
    expect(textFontStack('gothic', null)).toBe(FONT_STACK);
  });
  it('puts the custom family first, with a serif or sans fallback by typeface', () => {
    expect(textFontStack('mincho', NEXT_FONT)).toBe(`${NEXT_FONT}, ${SERIF_FALLBACK}`);
    expect(textFontStack('brush', NEXT_FONT)).toBe(`${NEXT_FONT}, ${SERIF_FALLBACK}`);
    expect(textFontStack(undefined, NEXT_FONT)).toBe(`${NEXT_FONT}, ${SERIF_FALLBACK}`);
    expect(textFontStack('gothic', NEXT_FONT)).toBe(`${NEXT_FONT}, ${SANS_FALLBACK}`);
  });
});

describe('normalizeSpec with fontFamily', () => {
  it('default (no fontFamily) renders as before and keeps favicon.svg', () => {
    const spec = normalizeSpec(text({ typeface: 'brush' }));
    expect(spec.fontStack).toBe(FONT_STACK);
    expect(spec.customFont).toBe(false);
    expect(hasSvg(spec)).toBe(true);
    expect(fontFor(spec, 100)).toBe(`600 100px ${FONT_STACK}`);
  });
  it('uses the page font and drops favicon.svg (the font is not on the visitor’s site)', () => {
    const spec = normalizeSpec(text({ typeface: 'brush', fontFamily: NEXT_FONT, fontWeight: 400 }));
    expect(spec.customFont).toBe(true);
    expect(spec.fontStack.startsWith(NEXT_FONT)).toBe(true);
    expect(fontFor(spec, 64)).toBe(`400 64px ${NEXT_FONT}, ${SERIF_FALLBACK}`);
    expect(hasSvg(spec)).toBe(false);
  });
  it('ignores an unsafe fontFamily and falls back to today’s rendering', () => {
    const spec = normalizeSpec(text({ fontFamily: 'x; } <script>' }));
    expect(spec.customFont).toBe(false);
    expect(spec.fontStack).toBe(FONT_STACK);
    expect(hasSvg(spec)).toBe(true);
  });
  it('emoji and image modes are unaffected', () => {
    const emoji = normalizeSpec({
      mode: 'emoji',
      emoji: '🍣',
      background: 'transparent',
      shape: 'square',
      padding: 0,
    });
    expect(hasSvg(emoji)).toBe(true);
    const image = normalizeSpec({
      mode: 'image',
      zoom: 1,
      padding: 0,
      background: 'transparent',
      shape: 'square',
    });
    expect(hasSvg(image)).toBe(false);
  });
});

describe('package without svg', () => {
  it('file list, snippet and README skip favicon.svg', () => {
    expect(packageFileNames('text', false)).not.toContain('favicon.svg');
    expect(packageFileNames('text')).toContain('favicon.svg');
    const snippet = buildSnippet('text', false);
    expect(snippet).not.toContain('svg');
    expect(snippet).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48">');
    expect(buildReadme('text', snippet, false)).not.toContain('favicon.svg');
    expect(buildReadme('text', buildSnippet('text'))).toContain('favicon.svg');
  });
});
