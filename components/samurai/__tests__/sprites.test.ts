import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = join(process.cwd(), 'public', 'samurai');
const read = (f: string) => readFileSync(join(dir, f), 'utf8');

function symbols(svg: string, prefix: string): string[] {
  return [...svg.matchAll(new RegExp(`<symbol id="(${prefix}\\d+)" viewBox="([^"]+)"`, 'g'))].map(
    (m) => `${m[1]}|${m[2]}`,
  );
}

describe('samurai sprites', () => {
  it('kendo sprite has symbols k0..k18 with viewBox 0 0 271 200', () => {
    const s = symbols(read('kendo.svg'), 'k');
    expect(s).toEqual(Array.from({ length: 19 }, (_, i) => `k${i}|0 0 271 200`));
  });

  it('ronin sprite has symbols r0..r36 with viewBox 0 0 165 260', () => {
    const s = symbols(read('ronin.svg'), 'r');
    expect(s).toEqual(Array.from({ length: 37 }, (_, i) => `r${i}|0 0 165 260`));
  });

  it('sprites are small', () => {
    expect(statSync(join(dir, 'kendo.svg')).size).toBeLessThanOrEqual(40_000);
    expect(statSync(join(dir, 'ronin.svg')).size).toBeLessThanOrEqual(75_000);
  });

  it('sprites use currentColor and contain no filter, script or external href', () => {
    for (const f of ['kendo.svg', 'ronin.svg']) {
      const svg = read(f);
      const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(fills)).toEqual(new Set(['currentColor']));
      expect(svg).not.toMatch(/<filter|<script|href=|on\w+=/i);
    }
  });
});
