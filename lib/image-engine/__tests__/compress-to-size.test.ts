import { describe, expect, it } from 'vitest';
import {
  MAX_ENCODES,
  MIN_SIDE,
  PROBE_PIXELS,
  Q_FLOOR,
  Q_MAX,
  searchToSize,
  targetBytesFor,
  type Encoder,
} from '../compress-to-size';
import { EngineError } from '../errors';
import { isEngineError } from '../../types';

/** bytes ≈ pixels × f(quality) + header, like a JPEG encoder. */
const f = (q: number) => 0.03 + 1.2 * q ** 3;

interface Call {
  w: number;
  h: number;
  q: number;
  bytes: number;
}

function fakeEncoder(
  model: (w: number, h: number, q: number) => number = (w, h, q) => Math.round(300 + w * h * f(q)),
) {
  const calls: Call[] = [];
  const encode: Encoder = async (w, h, q) => {
    const bytes = Math.max(1, Math.round(model(w, h, q)));
    calls.push({ w, h, q, bytes });
    return { bytes, blob: new Blob([new Uint8Array(0)]) };
  };
  return { encode, calls };
}

describe('target math', () => {
  it('50KB → ≤ 49,500 bytes', () => {
    expect(targetBytesFor(50)).toBe(49_500);
  });
  it('1MB page (1000KB) → ≤ 990,000 bytes', () => {
    expect(targetBytesFor(1000)).toBe(990_000);
  });
  it('uses a 200 byte minimum margin for small targets', () => {
    expect(targetBytesFor(10)).toBe(9_800);
    expect(targetBytesFor(20)).toBe(19_800);
  });
  it('is under both decimal and binary KB', () => {
    for (const kb of [5, 20, 50, 100, 200, 500, 1000, 2000]) {
      expect(targetBytesFor(kb)).toBeLessThan(kb * 1000);
      expect(targetBytesFor(kb)).toBeLessThan(kb * 1024);
    }
  });
});

describe('searchToSize', () => {
  it('returns at Q_MAX in one encode when already small enough', async () => {
    const { encode, calls } = fakeEncoder();
    const r = await searchToSize({
      width: 200,
      height: 200,
      targetBytes: 49_500,
      keepDimensions: false,
      encode,
    });
    expect(calls).toHaveLength(1);
    expect(r.quality).toBe(Q_MAX);
    expect(r.width).toBe(200);
    expect(r.scale).toBe(1);
  });

  it('always returns a result ≤ target or throws TARGET_UNREACHABLE', async () => {
    const sizes = [
      [4000, 3000],
      [3000, 4000],
      [1920, 1080],
      [800, 600],
      [300, 200],
      [100, 80],
      [12000, 400],
    ];
    const targets = [5, 10, 20, 30, 50, 100, 200, 500, 1000, 2000];
    for (const keepDimensions of [false, true]) {
      for (const [w, h] of sizes) {
        for (const kb of targets) {
          const targetBytes = targetBytesFor(kb);
          const { encode, calls } = fakeEncoder();
          try {
            const r = await searchToSize({
              width: w,
              height: h,
              targetBytes,
              keepDimensions,
              encode,
            });
            expect(r.bytes).toBeLessThanOrEqual(targetBytes);
            expect(r.width).toBeLessThanOrEqual(w);
            expect(r.height).toBeLessThanOrEqual(h);
          } catch (e) {
            expect(isEngineError(e)).toBe(true);
            expect((e as EngineError).code).toBe('TARGET_UNREACHABLE');
          }
          expect(calls.length).toBeLessThanOrEqual(MAX_ENCODES);
        }
      }
    }
  });

  it('chooses the highest passing quality (within search precision)', async () => {
    const { encode } = fakeEncoder();
    const W = 1000;
    const H = 800;
    // Pick a target that is feasible at full size at quality ~0.7.
    const targetBytes = Math.round(300 + W * H * f(0.7));
    const r = await searchToSize({
      width: W,
      height: H,
      targetBytes,
      keepDimensions: true,
      encode,
    });
    expect(r.bytes).toBeLessThanOrEqual(targetBytes);
    expect(r.quality).toBeLessThanOrEqual(0.7);
    expect(r.quality).toBeGreaterThanOrEqual(0.68);
  });

  it('does not scale when the full size fits at good quality', async () => {
    const { encode, calls } = fakeEncoder();
    const W = 1600;
    const H = 1200;
    // Fits at full size around quality 0.8 (step 2 only shrinks when the target
    // is below ~45% of the Q_MAX size).
    const targetBytes = Math.round(300 + W * H * f(0.8));
    const r = await searchToSize({
      width: W,
      height: H,
      targetBytes,
      keepDimensions: false,
      encode,
    });
    expect(r.width).toBe(W);
    expect(r.height).toBe(H);
    expect(r.scale).toBe(1);
    expect(calls.every((c) => c.w === W && c.h === H)).toBe(true);
  });

  it('scales down when quality alone cannot reach the target', async () => {
    const { encode } = fakeEncoder();
    const r = await searchToSize({
      width: 4000,
      height: 3000,
      targetBytes: targetBytesFor(50),
      keepDimensions: false,
      encode,
    });
    expect(r.bytes).toBeLessThanOrEqual(49_500);
    expect(r.scale).toBeLessThan(1);
    expect(r.width).toBeLessThan(4000);
    expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(MIN_SIDE);
    // keeps the aspect ratio
    expect(Math.abs(r.width / r.height - 4 / 3)).toBeLessThan(0.01);
    // prefers usable quality over a tiny image
    expect(r.quality).toBeGreaterThanOrEqual(Q_FLOOR);
  });

  it('never scales with keepDimensions', async () => {
    const { encode, calls } = fakeEncoder();
    const targetBytes = Math.round(300 + 2000 * 1500 * f(0.3)); // needs hard-floor quality
    const r = await searchToSize({
      width: 2000,
      height: 1500,
      targetBytes,
      keepDimensions: true,
      encode,
    });
    // Only the first call may be the small probe; every candidate is full size.
    expect(calls.slice(1).every((c) => c.w === 2000 && c.h === 1500)).toBe(true);
    expect(r.width).toBe(2000);
    expect(r.quality).toBeLessThan(Q_FLOOR);
    expect(r.bytes).toBeLessThanOrEqual(targetBytes);
  });

  it('skips the full-size quick check when the probe shows it cannot pass', async () => {
    const { encode, calls } = fakeEncoder();
    const r = await searchToSize({
      width: 4000,
      height: 3000,
      targetBytes: 49_500,
      keepDimensions: false,
      encode,
    });
    expect(r.bytes).toBeLessThanOrEqual(49_500);
    expect(calls[0].w * calls[0].h).toBeLessThanOrEqual(PROBE_PIXELS * 1.01);
    expect(calls.some((c) => c.w === 4000)).toBe(false);
  });

  it('still finds a full-size Q_MAX result when the probe is inconclusive', async () => {
    const { encode, calls } = fakeEncoder();
    const targetBytes = Math.round(300 + 4000 * 3000 * f(Q_MAX)) + 10;
    const r = await searchToSize({
      width: 4000,
      height: 3000,
      targetBytes,
      keepDimensions: false,
      encode,
    });
    expect(r.width).toBe(4000);
    expect(r.quality).toBe(Q_MAX);
    expect(calls).toHaveLength(2);
  });

  it('throws TARGET_UNREACHABLE with the smallest size achieved', async () => {
    const { encode, calls } = fakeEncoder();
    const err = await searchToSize({
      width: 4000,
      height: 3000,
      targetBytes: 500,
      keepDimensions: false,
      encode,
    }).then(
      () => null,
      (e: unknown) => e,
    );
    expect(isEngineError(err)).toBe(true);
    const e = err as EngineError;
    expect(e.code).toBe('TARGET_UNREACHABLE');
    const min = Math.min(...calls.map((c) => c.bytes));
    expect(e.detail?.smallestBytes).toBe(min);
    expect(e.detail?.width).toBeGreaterThan(0);
    expect(Math.min(e.detail!.width!, e.detail!.height!)).toBeGreaterThanOrEqual(MIN_SIDE - 1);
    expect(calls.length).toBeLessThanOrEqual(MAX_ENCODES);
  });

  it('throws TARGET_UNREACHABLE with keepDimensions when even the hard floor is too big', async () => {
    const { encode, calls } = fakeEncoder();
    await expect(
      searchToSize({
        width: 4000,
        height: 3000,
        targetBytes: targetBytesFor(50),
        keepDimensions: true,
        encode,
      }),
    ).rejects.toMatchObject({
      name: 'EngineError',
      code: 'TARGET_UNREACHABLE',
      detail: { width: 4000, height: 3000 },
    });
    expect(calls.slice(1).every((c) => c.w === 4000)).toBe(true);
  });

  it('never upscales a source smaller than MIN_SIDE', async () => {
    const { encode, calls } = fakeEncoder();
    await searchToSize({
      width: 120,
      height: 90,
      targetBytes: 2_000,
      keepDimensions: false,
      encode,
    }).catch(() => null);
    expect(calls.every((c) => c.w <= 120 && c.h <= 90)).toBe(true);
  });

  it('respects MAX_ENCODES with a misbehaving (non-monotonic) encoder', async () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    for (let i = 0; i < 50; i++) {
      const { encode, calls } = fakeEncoder((w, h, q) => 300 + w * h * f(q) * (0.5 + rand() * 1.5));
      const targetBytes = targetBytesFor([10, 20, 50, 100][i % 4]);
      try {
        const r = await searchToSize({
          width: 3000,
          height: 2000,
          targetBytes,
          keepDimensions: i % 5 === 0,
          encode,
        });
        expect(r.bytes).toBeLessThanOrEqual(targetBytes);
      } catch (e) {
        expect((e as EngineError).code).toBe('TARGET_UNREACHABLE');
      }
      expect(calls.length).toBeLessThanOrEqual(MAX_ENCODES);
    }
  });

  it('stops at MAX_ENCODES with an encoder that never fits', async () => {
    const { encode, calls } = fakeEncoder(() => 1e9);
    await expect(
      searchToSize({
        width: 4000,
        height: 3000,
        targetBytes: 49_500,
        keepDimensions: false,
        encode,
      }),
    ).rejects.toMatchObject({ code: 'TARGET_UNREACHABLE', detail: { smallestBytes: 1e9 } });
    expect(calls.length).toBeLessThanOrEqual(MAX_ENCODES);
  });

  it('reports progress after every encode', async () => {
    const { encode, calls } = fakeEncoder();
    const seen: number[] = [];
    await searchToSize({
      width: 4000,
      height: 3000,
      targetBytes: 49_500,
      keepDimensions: false,
      encode,
      onEncode: (n) => seen.push(n),
    });
    expect(seen).toEqual(calls.map((_, i) => i + 1));
  });

  it('stops with CANCELLED when the cancel flag is set', async () => {
    const { encode, calls } = fakeEncoder();
    let n = 0;
    await expect(
      searchToSize({
        width: 4000,
        height: 3000,
        targetBytes: 49_500,
        keepDimensions: false,
        encode,
        isCancelled: () => n >= 2,
        onEncode: (c) => (n = c),
      }),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(calls).toHaveLength(2);
  });
});
