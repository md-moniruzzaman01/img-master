// WCAG AA contrast for every text/background pair the components use, in both
// themes, computed from the token values in app/globals.css.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../../../app/globals.css', import.meta.url)), 'utf8');

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`No ${selector} block in globals.css`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

function vars(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const light = vars(block(':root {'));
const darkOwn = vars(block("[data-theme='dark'] {"));
const dark = { ...light, ...darkOwn };
const fallbackOwn = vars(block('html:not([data-theme]) {'));

function resolve(theme: Record<string, string>, name: string, depth = 0): string {
  const v = theme[name];
  if (!v) throw new Error(`Token --${name} is missing`);
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(v);
  if (ref && depth < 5) return resolve(theme, ref[1], depth + 1);
  return v;
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Not a 6-digit hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255]
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

function ratio(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** [text token, background token, minimum ratio]. 4.5 = body text, 3 = large text or UI parts. */
const PAIRS: [string, string, number][] = [
  // Body text on every surface.
  ...(['paper', 'paper-2', 'card', 'shu-soft', 'matcha-soft'] as const).flatMap(
    (bg): [string, string, number][] => [
      ['ink', bg, 4.5],
      ['ink-2', bg, 4.5],
      ['muted', bg, 4.5],
    ],
  ),
  // Crimson text: links and accents on paper and card; strong variant on tinted bands.
  ['accent-text', 'paper', 4.5],
  ['accent-text', 'card', 4.5],
  ['accent-strong', 'paper-2', 4.5],
  ['accent-strong', 'shu-soft', 4.5],
  ['accent-strong', 'card', 4.5],
  // Gold labels (tip card, menus, footer).
  ['kin-text', 'paper', 4.5],
  ['kin-text', 'card', 4.5],
  ['kin', 'band', 4.5],
  // Success text (privacy line, badges, banner).
  ['matcha', 'paper', 4.5],
  ['matcha', 'card', 4.5],
  ['matcha', 'matcha-soft', 4.5],
  // Buttons and solid chips.
  ['white', 'shu', 4.5],
  ['on-solid', 'solid', 4.5],
  // Dark bands, footer and the desktop drop zone.
  ['on-band', 'band', 4.5],
  ['on-band-muted', 'band', 4.5],
  ['on-zone', 'zone', 4.5],
  ['on-zone-muted', 'zone', 4.5],
  // Large crimson H1 accent and glyphs (≥ 24px): 3:1.
  ['accent-text', 'paper-2', 3],
  ['shu', 'band', 3],
  // Control outlines (WCAG 1.4.11).
  ['line-strong', 'paper', 3],
  ['line-strong', 'card', 3],
];

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s theme', (_name, theme) => {
  it.each(PAIRS)('%s on %s ≥ %s:1', (fg, bg, min) => {
    const r = ratio(resolve(theme, fg), resolve(theme, bg));
    expect(r, `--${fg} on --${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
  });
});

describe('no-JS dark fallback', () => {
  it('matches the [data-theme=dark] values', () => {
    for (const [k, v] of Object.entries(fallbackOwn)) {
      if (k === 'color-scheme') continue;
      expect(darkOwn[k], `--${k}`).toBe(v);
    }
    for (const k of Object.keys(darkOwn)) expect(fallbackOwn[k], `--${k} missing`).toBeDefined();
  });
});
