// favicon.svg for text and emoji modes (ENGINE.md §9). Pure string building.
// Everything user-typed goes through xmlEscape; colors must pass isSafeColor first.
import type { FaviconShape } from '../../types';
import { BASE_SIZE, EMOJI_STACK, FONT_STACK, svgFontFamily, type TextLayout } from './geometry';

/** Characters that are not allowed in XML 1.0 documents. */
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F￾￿]/g;

/** Escapes text for use in XML text nodes and attribute values. */
export function xmlEscape(s: string): string {
  return s
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 3, 4, 6 or 8 hex digits after '#'. Nothing else may reach an SVG or a manifest. */
const COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
export const isSafeColor = (c: unknown): c is string => typeof c === 'string' && COLOR_RE.test(c);

const num = (n: number): string => String(Math.round(n * 100) / 100);

export interface SvgSpec {
  kind: 'text' | 'emoji';
  text: string;
  shape: FaviconShape;
  /** A safe hex color or 'transparent'. */
  background: string;
  /** A safe hex color (text mode only). */
  color: string;
  fontWeight: number;
  /** Layout in the 512 × 512 viewBox. */
  layout: TextLayout;
}

export function buildSvg(spec: SvgSpec): string {
  if (spec.background !== 'transparent' && !isSafeColor(spec.background)) {
    throw new Error('Unsafe background color');
  }
  if (spec.kind === 'text' && !isSafeColor(spec.color)) throw new Error('Unsafe text color');
  const S = BASE_SIZE;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">`,
  ];
  if (spec.background !== 'transparent') {
    if (spec.shape === 'circle') {
      parts.push(`<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="${spec.background}"/>`);
    } else {
      const rx = spec.shape === 'rounded' ? ` rx="${num(S * 0.2)}"` : '';
      parts.push(`<rect width="${S}" height="${S}"${rx} fill="${spec.background}"/>`);
    }
  }
  const family = svgFontFamily(spec.kind === 'emoji' ? EMOJI_STACK : FONT_STACK);
  const weight = spec.kind === 'text' ? ` font-weight="${Math.round(spec.fontWeight) || 600}"` : '';
  const fill = spec.kind === 'text' ? ` fill="${spec.color}"` : '';
  const { fontSize, x, y } = spec.layout;
  parts.push(
    `<text x="${num(x)}" y="${num(y)}" font-family="${family}" font-size="${num(fontSize)}"${weight}${fill}>${xmlEscape(spec.text)}</text>`,
  );
  parts.push('</svg>');
  return parts.join('\n') + '\n';
}
