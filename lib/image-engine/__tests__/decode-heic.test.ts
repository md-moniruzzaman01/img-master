import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineError, MemoryError } from '../errors';
import { makeCanvas } from './fake-canvas';

// Decode branching: native first, libheif only when native fails.
const decodeHeicRgba = vi.fn();
vi.mock('../heic', () => ({
  decodeHeicRgba: (...a: unknown[]) => decodeHeicRgba(...a),
  HEIC_MAX_DECODE_PIXELS: 50_000_000,
  HEIC_MAX_DECODE_PIXELS_LOW_MEMORY: 25_000_000,
}));
vi.mock('../encode', () => ({
  createCanvas: (w: number, h: number) => {
    const c = makeCanvas(w, h) as unknown as Record<string, unknown>;
    c.getContext = () => ({
      putImageData: () => {},
      clearRect: () => {},
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4).fill(255) }),
    });
    return c;
  },
  context2d: (c: { getContext(): unknown }) => c.getContext(),
  releaseCanvas: () => {},
}));

import { decodeImage } from '../decode';

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const heicFile = () =>
  new File([new Uint8Array([0, 0, 0, 24, ...ascii('ftypheic'), 0, 0, 0, 0])], 'a.heic', {
    type: 'image/heic',
  });

const bitmap = { width: 10, height: 8, close() {} };
const px = (over = {}) => ({
  data: new Uint8ClampedArray(4 * 4 * 4),
  width: 4,
  height: 4,
  fullWidth: 4,
  fullHeight: 4,
  hasAlpha: false,
  ...over,
});

describe('HEIC decode branching', () => {
  beforeEach(() => {
    decodeHeicRgba.mockReset();
    vi.stubGlobal(
      'ImageData',
      class {
        constructor(
          public data: unknown,
          public width: number,
          public height: number,
        ) {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('native success: libheif is never used', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const d = await decodeImage(heicFile(), 16_777_216);
    expect(d.kind).toBe('heic');
    expect(d.width).toBe(10);
    expect(decodeHeicRgba).not.toHaveBeenCalled();
  });

  it('native failure: falls back to libheif', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
    decodeHeicRgba.mockResolvedValue(px({ hasAlpha: true }));
    const d = await decodeImage(heicFile(), 16_777_216);
    expect(decodeHeicRgba).toHaveBeenCalledOnce();
    expect(d).toMatchObject({ kind: 'heic', width: 4, height: 4, hasAlpha: true, animated: false });
    expect(d.notes).toEqual([]);
  });

  it('libheif downscale adds the memory note and keeps the full size', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
    decodeHeicRgba.mockResolvedValue(px({ fullWidth: 8000, fullHeight: 6000 }));
    const d = await decodeImage(heicFile(), 16_777_216);
    expect(d.notes).toContain('downscaled-for-memory');
    expect([d.fullWidth, d.fullHeight]).toEqual([8000, 6000]);
  });

  it('both fail: the libheif error code is reported', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
    decodeHeicRgba.mockRejectedValue(new EngineError('UNSUPPORTED_FORMAT', 'x'));
    await expect(decodeImage(heicFile(), 1e7)).rejects.toMatchObject({
      code: 'UNSUPPORTED_FORMAT',
    });
    decodeHeicRgba.mockRejectedValue(new EngineError('DECODE_FAILED', 'x'));
    await expect(decodeImage(heicFile(), 1e7)).rejects.toMatchObject({ code: 'DECODE_FAILED' });
  });

  it('native out-of-memory is rethrown without trying libheif', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new RangeError('big')));
    await expect(decodeImage(heicFile(), 1e7)).rejects.toBeInstanceOf(RangeError);
    expect(decodeHeicRgba).not.toHaveBeenCalled();
  });

  it('libheif memory error stays a MemoryError (OUT_OF_MEMORY on the wire)', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
    decodeHeicRgba.mockRejectedValue(new MemoryError('too big'));
    await expect(decodeImage(heicFile(), 1e7)).rejects.toBeInstanceOf(MemoryError);
  });

  it('non-HEIC failures never touch libheif', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad')));
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])], 'a.png', {
      type: 'image/png',
    });
    await expect(decodeImage(png, 1e7)).rejects.toMatchObject({ code: 'DECODE_FAILED' });
    expect(decodeHeicRgba).not.toHaveBeenCalled();
  });
});
