import { beforeEach, describe, expect, it, vi } from 'vitest';
import { targetBytesFor } from '../compress-to-size';
import { decodeImage } from '../decode';
import { compressToSizeJob } from '../run-job';
import { type EncodeCall, type FakeCanvas, fakeCtxJob, fakeDecoded, file } from './fake-canvas';

const enc = vi.hoisted(() => ({ calls: [] as EncodeCall[] }));

vi.mock('../decode', async (orig) => ({
  ...(await orig<typeof import('../decode')>()),
  decodeImage: vi.fn(),
}));

vi.mock('../encode', async (orig) => {
  const real = await orig<typeof import('../encode')>();
  const fc = await import('./fake-canvas');
  return {
    ...real,
    createCanvas: (w: number, h: number) => fc.makeCanvas(w, h),
    context2d: (c: FakeCanvas) => c.getContext(),
    assertFormatSupported: vi.fn(async () => {}),
    encodeCanvas: vi.fn(async (c: FakeCanvas, format: string, q?: number) => {
      enc.calls.push({ w: c.width, h: c.height, format, q });
      return fc.fakeBlob(fc.bytesFor(c.width, c.height, q), real.MIME[format as 'jpeg']);
    }),
  };
});

describe('compressToSizeJob maxWidth', () => {
  const decode = vi.mocked(decodeImage);
  beforeEach(() => {
    enc.calls.length = 0;
    decode.mockReset();
  });

  it('scales down to maxWidth before the search (ratio kept)', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    const r = await compressToSizeJob(
      file('photo.jpg', 3_000_000),
      { targetKB: 500, maxWidth: 1200 },
      fakeCtxJob(),
    );
    expect(r.width).toBeLessThanOrEqual(1200);
    expect(Math.abs(r.width / r.height - 4 / 3)).toBeLessThan(0.01);
    expect(r.outputBytes).toBeLessThanOrEqual(targetBytesFor(500));
    expect(r.notes).toContain('resized');
    // No encode is ever wider than maxWidth.
    for (const c of enc.calls) expect(c.w).toBeLessThanOrEqual(1200);
    // The quick check runs at exactly maxWidth.
    expect(enc.calls.some((c) => c.w === 1200 && c.h === 900)).toBe(true);
  });

  it('with a roomy target returns exactly maxWidth at the best quality', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    const r = await compressToSizeJob(
      file('photo.jpg', 3_000_000),
      { targetKB: 2000, maxWidth: 1200 },
      fakeCtxJob(),
    );
    expect([r.width, r.height, r.quality]).toEqual([1200, 900, 0.92]);
    expect(r.notes).toContain('resized');
  });

  it('keepDimensions with maxWidth stays at maxWidth (lowers quality only)', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    const r = await compressToSizeJob(
      file('photo.jpg', 3_000_000),
      { targetKB: 400, maxWidth: 1000, keepDimensions: true },
      fakeCtxJob(),
    );
    expect([r.width, r.height]).toEqual([1000, 750]);
    expect(r.outputBytes).toBeLessThanOrEqual(targetBytesFor(400));
    for (const c of enc.calls) expect(c.w).toBe(1000);
  });

  it('maxWidth larger than the image (or unset / invalid) keeps the original', async () => {
    for (const maxWidth of [5000, undefined, 0, NaN]) {
      decode.mockResolvedValue(fakeDecoded(800, 600));
      enc.calls.length = 0;
      const r = await compressToSizeJob(
        file('photo.jpg', 900_000),
        { targetKB: 2000, maxWidth },
        fakeCtxJob(),
      );
      expect([r.width, r.height]).toEqual([800, 600]);
      expect(r.notes).not.toContain('resized');
    }
  });

  it('still never returns over the target', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    for (const targetKB of [20, 50, 100]) {
      const r = await compressToSizeJob(
        file('photo.jpg', 3_000_000),
        { targetKB, maxWidth: 1600 },
        fakeCtxJob(),
      );
      expect(r.outputBytes).toBeLessThanOrEqual(targetBytesFor(targetKB));
      expect(r.width).toBeLessThanOrEqual(1600);
    }
  });

  it('rejects a bad target as INVALID_OPTIONS before decoding', async () => {
    for (const targetKB of [0, -5, NaN, Infinity]) {
      await expect(
        compressToSizeJob(file('photo.jpg'), { targetKB }, fakeCtxJob()),
      ).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    }
    expect(decode).not.toHaveBeenCalled();
  });
});
