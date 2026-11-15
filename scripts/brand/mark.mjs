// Img Samurai mark: a crimson hanko seal carrying 侍 ("samurai"), drawn as
// stroked paths on a 64×64 grid. This file is the master geometry. The React
// component (components/layout/brand-seal.tsx) copies the same path data, so
// the header, the favicon and the brand PNGs match. Change both together.

export const SHU = '#c3301c';
export const PAPER = '#f2ece1';
export const WHITE = '#ffffff';

/** Seal body: a square with slightly uneven, softened edges (stamped ink). */
export const SEAL =
  'M5.2 3.4 L58.9 2.9 Q61.2 2.9 61.2 5.2 L61.5 58.6 Q61.5 61.2 58.9 61.2 L5.4 61.5 Q2.8 61.5 2.8 58.9 L2.6 5.9 Q2.6 3.4 5.2 3.4 Z';

/**
 * Seal body with the blade cut: the bottom-right corner is sliced off along
 * x + y = 108.5 and the shard sits past a 2-unit gap (x + y = 110.5).
 */
export const SEAL_CUT =
  'M5.2 3.4 L58.9 2.9 Q61.2 2.9 61.2 5.2 L61.35 47.15 L47.15 61.35 L5.4 61.5 Q2.8 61.5 2.8 58.9 L2.6 5.9 Q2.6 3.4 5.2 3.4 Z' +
  'M61.36 49.14 L61.5 58.6 Q61.5 61.2 58.9 61.2 L49.14 61.36 Z';

/** Thin inner border, broken at the bottom-right corner where the blade cut. */
export const BORDER = 'M49.5 57 H9 Q7 57 7 55 V9 Q7 7 9 7 H55 Q57 7 57 9 V49.5';

/** 侍, one path per brush stroke (round caps and joins). */
export const GLYPH = [
  // 亻: falling stroke, then the upright
  'M24.5 11.5 Q21.5 20.5 13.5 28.5',
  'M19.5 21.5 V52.5',
  // 土
  'M39.5 10.5 V25.5',
  'M31 17.5 H48',
  'M27.5 25.5 H51.5',
  // 寸
  'M27 34 H52',
  'M45.5 29 V49.5 Q45.5 53 42 52.5 L39 51',
  'M32 39.5 L35.5 45',
];

export const GLYPH_STROKE = 5;
export const BORDER_STROKE = 2;

/**
 * Seal SVG markup.
 * - `detail: 'full'` adds the inner border and slash (32px and up).
 * - `detail: 'small'` drops them and scales the glyph up with a heavier stroke
 *   so it stays legible at 16–48px.
 */
export function sealSvg({ size = 64, detail = 'full', background = null, pad = 0 } = {}) {
  const inner = sealGroup(detail);
  const scale = (64 - pad * 2) / 64;
  const bg = background ? `<rect width="64" height="64" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${bg}<g transform="translate(${pad} ${pad}) scale(${scale})">${inner}</g></svg>`;
}

export function sealGroup(detail = 'full') {
  const small = detail === 'small';
  const glyph = GLYPH.map((d) => `<path d="${d}"/>`).join('');
  const glyphGroup = small
    ? `<g transform="translate(32 32) scale(1.2) translate(-32.5 -31.5)" fill="none" stroke="${WHITE}" stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`
    : `<g fill="none" stroke="${WHITE}" stroke-width="${GLYPH_STROKE}" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`;
  const extras = small
    ? ''
    : `<path d="${BORDER}" fill="none" stroke="${WHITE}" stroke-width="${BORDER_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<path d="${small ? SEAL : SEAL_CUT}" fill="${SHU}"/>${extras}${glyphGroup}`;
}

/**
 * Hand-hinted 16×16 version for the 16px favicon: the same strokes snapped to
 * whole pixels so nothing blurs. One string per row: '#' white ink, 'o' seal,
 * '.' transparent.
 */
export const PIXELS_16 = [
  '.oooooooooooooo.',
  'oooooooooooooooo',
  'ooooo#oooooooooo',
  'oooo#oooo#oooooo',
  'oooo#oo#####oooo',
  'ooo##oooo#oooooo',
  'oo###o########oo',
  'ooo#ooooooo#oooo',
  'ooo#oo########oo',
  'ooo#ooooooo#oooo',
  'ooo#ooo#ooo#oooo',
  'ooo#oooo#oo#oooo',
  'ooo#ooooooo#oooo',
  'ooo#ooooo###oooo',
  'oooooooooooooooo',
  '.oooooooooooooo.',
];

export function pixelSvg16() {
  let rects = '';
  PIXELS_16.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '.') return;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === '#' ? WHITE : SHU}"/>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">${rects}</svg>`;
}
