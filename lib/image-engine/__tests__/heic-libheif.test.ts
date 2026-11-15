// Real libheif (wasm) decode in Node. Fixtures: see fixtures/README.md.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { boxDownscale, decodeHeicRgba, loadLibheif } from '../heic';

const fx = (n: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`./fixtures/${n}`, import.meta.url))));

describe('libheif real decode', () => {
  it('decodes a HEIC to RGBA with the right size and real pixels', async () => {
    const t0 = performance.now();
    const r = await decodeHeicRgba(fx('colors-no-alpha.heic'), 16_777_216);
    console.log(`libheif load+decode 64x64: ${Math.round(performance.now() - t0)} ms`);
    expect([r.width, r.height]).toEqual([64, 64]);
    expect(r.data.length).toBe(64 * 64 * 4);
    expect(r.hasAlpha).toBe(false);
    expect(r.data.some((v) => v !== 0)).toBe(true);
    for (let i = 3; i < r.data.length; i += 4) expect(r.data[i]).toBe(255);
  });

  it('reports alpha and keeps it', async () => {
    const r = await decodeHeicRgba(fx('colors-with-alpha.heic'), 16_777_216);
    expect(r.hasAlpha).toBe(true);
    expect(r.data.some((v, i) => i % 4 === 3 && v < 255)).toBe(true);
  });

  it('downscales above maxPixels and keeps the full size', async () => {
    const r = await decodeHeicRgba(fx('colors-no-alpha.heic'), 1024);
    expect(r.width * r.height).toBeLessThanOrEqual(1024);
    expect([r.fullWidth, r.fullHeight]).toEqual([64, 64]);
    expect(r.data.length).toBe(r.width * r.height * 4);
    expect(r.data.some((v) => v !== 0)).toBe(true);
  });

  it('refuses images above the hard cap before decoding pixels', async () => {
    await expect(decodeHeicRgba(fx('colors-no-alpha.heic'), 1e7, 1000)).rejects.toMatchObject({
      name: 'MemoryError',
    });
  });

  it('corrupt data is DECODE_FAILED', async () => {
    await expect(decodeHeicRgba(new Uint8Array(64), 1e7)).rejects.toMatchObject({
      code: 'DECODE_FAILED',
    });
  });

  it('reuses the loaded decoder', async () => {
    expect(await loadLibheif()).toBe(await loadLibheif());
  });
});

describe('boxDownscale', () => {
  it('averages 2x2 blocks', () => {
    const px = [0, 100, 200, 100].flatMap((v) => [v, v, v, 255]);
    const out = boxDownscale(new Uint8Array(px), 8, 2, 2, 1, 1);
    expect(Array.from(out)).toEqual([100, 100, 100, 255]);
  });
});
