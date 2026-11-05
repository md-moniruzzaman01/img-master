// Favicon package metadata: input checks, snippet, manifest, README (ENGINE.md §9). Pure.
import type { FaviconShape, FaviconSource } from '../../types';
import { EngineError } from '../errors';
import {
  EMOJI_STACK,
  FONT_STACK,
  clamp,
  clampZoom,
  cleanFontFamily,
  textFontStack,
} from './geometry';
import { isSafeColor } from './svg';

export type FaviconMode = 'image' | 'text' | 'emoji';

/** FaviconSource as sent to the worker: the File travels separately. */
export type WireFaviconSource =
  | Omit<Extract<FaviconSource, { mode: 'image' }>, 'file'>
  | Extract<FaviconSource, { mode: 'text' }>
  | Extract<FaviconSource, { mode: 'emoji' }>;

export interface FaviconSpec {
  mode: FaviconMode;
  /** Text (1–3 chars) or the single emoji. Empty for image mode. */
  text: string;
  fontWeight: 400 | 600 | 800;
  /** Safe hex text color. */
  color: string;
  /** Safe hex color or 'transparent'. */
  background: string;
  shape: FaviconShape;
  /** Percent per side, 0–40. */
  padding: number;
  zoom: number;
  /** CSS font stack used to draw text or emoji. */
  fontStack: string;
  /**
   * True when text uses a font the page loaded (FaviconSource.fontFamily).
   * That font won't exist on the visitor's own site, so no favicon.svg is made
   * (it would show a different font than the PNGs and the ICO).
   */
  customFont: boolean;
}

/** favicon.svg is made for text and emoji, but not for text in a page-loaded font. */
export const hasSvg = (spec: Pick<FaviconSpec, 'mode' | 'customFont'>): boolean =>
  spec.mode !== 'image' && !spec.customFont;

const SHAPES: readonly FaviconShape[] = ['square', 'rounded', 'circle'];

type Segmenter = new (
  l?: string,
  o?: object,
) => { segment(s: string): Iterable<{ segment: string }> };

function segments(s: string): string[] {
  const Seg = (Intl as { Segmenter?: Segmenter }).Segmenter;
  if (Seg)
    return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment);
  return Array.from(s);
}

const CONTROL = /[\u0000-\u001F\u007F￾￿]/g;

function cleanColor(c: unknown, what: string, allowTransparent: boolean): string {
  if (allowTransparent && c === 'transparent') return 'transparent';
  if (isSafeColor(c)) return c;
  throw new EngineError(
    'DECODE_FAILED',
    `The ${what} color is not valid. Use a hex color like #1a73e8.`,
  );
}

/** Validates and clamps user input. Throws EngineError(DECODE_FAILED) with a helpful message. */
export function normalizeSpec(src: WireFaviconSource): FaviconSpec {
  const shape = SHAPES.includes(src.shape) ? src.shape : 'square';
  const padding = clamp(src.padding, 0, 40, 10);
  if (src.mode === 'image') {
    return {
      mode: 'image',
      text: '',
      fontWeight: 600,
      color: '#000000',
      background: cleanColor(src.background, 'background', true),
      shape,
      padding,
      zoom: clampZoom(src.zoom),
      fontStack: FONT_STACK,
      customFont: false,
    };
  }
  if (src.mode === 'text') {
    const text = segments(
      String(src.text ?? '')
        .replace(CONTROL, '')
        .trim(),
    )
      .slice(0, 3)
      .join('');
    if (!text) throw new EngineError('DECODE_FAILED', 'Type 1 to 3 characters for the icon.');
    const w = src.fontWeight === 400 || src.fontWeight === 800 ? src.fontWeight : 600;
    const family = cleanFontFamily(src.fontFamily);
    return {
      mode: 'text',
      text,
      fontWeight: w,
      color: cleanColor(src.color, 'text', false),
      background: cleanColor(src.background, 'background', false),
      shape,
      padding,
      zoom: 1,
      fontStack: textFontStack(src.typeface, family),
      customFont: family !== null,
    };
  }
  if (src.mode === 'emoji') {
    const first = segments(
      String(src.emoji ?? '')
        .replace(CONTROL, '')
        .trim(),
    )[0];
    if (!first) throw new EngineError('DECODE_FAILED', 'Type or paste one emoji for the icon.');
    return {
      mode: 'emoji',
      text: first,
      fontWeight: 400,
      color: '#000000',
      background: cleanColor(src.background, 'background', true),
      shape,
      padding,
      zoom: 1,
      fontStack: EMOJI_STACK,
      customFont: false,
    };
  }
  throw new EngineError('DECODE_FAILED', 'Unknown favicon mode.');
}

/** File names in the ZIP, in order. favicon.svg only for text and emoji. */
export function packageFileNames(mode: FaviconMode, withSvg = mode !== 'image'): string[] {
  const names = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
  ];
  if (withSvg) names.push('favicon.svg');
  names.push('site.webmanifest', 'README.txt');
  return names;
}

export function buildSnippet(mode: FaviconMode, withSvg = mode !== 'image'): string {
  const lines = ['<link rel="icon" href="/favicon.ico" sizes="48x48">'];
  if (withSvg) lines.push('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  lines.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  lines.push('<link rel="manifest" href="/site.webmanifest">');
  return lines.join('\n');
}

/** '#rgb', '#rgba', '#rrggbb', '#rrggbbaa' become '#rrggbb' (alpha dropped); anything else becomes white. */
export function themeHex(color: string): string {
  if (!isSafeColor(color)) return '#ffffff';
  let h = color.slice(1);
  if (h.length <= 4) h = Array.from(h.slice(0, 3), (c) => c + c).join('');
  return '#' + h.slice(0, 6).toLowerCase();
}

export function buildManifest(spec: FaviconSpec): string {
  // JSON.stringify escapes anything the user typed.
  const name = spec.mode === 'image' ? 'Favicon' : spec.text || 'Favicon';
  const theme = themeHex(spec.background);
  return (
    JSON.stringify(
      {
        name,
        short_name: name,
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: theme,
        background_color: theme,
        display: 'standalone',
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildReadme(
  mode: FaviconMode,
  snippet: string,
  withSvg = mode !== 'image',
): string {
  const svgLine = !withSvg
    ? ''
    : 'favicon.svg                   Sharp icon at any size. Used by modern browsers.\n';
  return `Your favicon package
====================

Made with Img Master. Your image never left your device.

Files
-----
favicon.ico                   16, 32 and 48 px icons in one file. Works in every browser.
favicon-16x16.png             Small browser tab icon.
favicon-32x32.png             Browser tab icon on high-density screens.
apple-touch-icon.png          180 px icon for iPhone and iPad home screens.
android-chrome-192x192.png    Icon for Android and the web app manifest.
android-chrome-512x512.png    Large icon for Android and the web app manifest.
${svgLine}site.webmanifest              Web app manifest. Change "name" and "short_name" to your site name.
README.txt                    This file.

How to use
----------
1. Upload all files to the root folder of your website, so that /favicon.ico opens in the browser.
2. Paste these lines inside the <head> of every page:

${snippet}

3. Clear your browser cache or open the site in a private window. Browsers keep old icons for a long time.
`;
}
