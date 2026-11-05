import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEngineError } from '../../types';
import type { ResizeOptions } from '../../types';
import { decodeImage } from '../decode';
import { canEncodeWebp, assertFormatSupported } from '../encode';
import { resizeName } from '../names';
import { MAX_SIDE, largestAllowed, resizeJob, resizeSameFormat, resizeTarget } from '../resize-job';
import {
  type EncodeCall,
  type FakeCanvas,
  allCanvases,
  fakeCtxJob,
  fakeDecoded,
  file,
} from './fake-canvas';

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
    canEncodeWebp: vi.fn(async () => true),
    assertFormatSupported: vi.fn(async () => {}),
    encodeCanvas: vi.fn(async (c: FakeCanvas, format: string, q?: number) => {
      const quality = format === 'png' ? undefined : q;
      enc.calls.push({ w: c.width, h: c.height, format, q: quality });
      return fc.fakeBlob(fc.bytesFor(c.width, c.height, quality), real.MIME[format as 'jpeg']);
    }),
  };
});

const MAXP = 16_777_216;

function expectInvalid(fn: () => unknown, pattern?: RegExp) {
  try {
    fn();
  } catch (e) {
    expect(isEngineError(e)).toBe(true);
    expect((e as { code: string }).code).toBe('INVALID_OPTIONS');
    if (pattern) expect((e as Error).message).toMatch(pattern);
    return e as { code: string; detail?: { width?: number; height?: number } };
  }
  throw new Error('expected an EngineError');
}

describe('resizeTarget: ratio math', () => {
  it('width only keeps the ratio', () => {
    expect(resizeTarget(4000, 3000, { width: 800 }, MAXP)).toEqual({ width: 800, height: 600 });
  });
  it('height only keeps the ratio', () => {
    expect(resizeTarget(4000, 3000, { height: 300 }, MAXP)).toEqual({ width: 400, height: 300 });
  });
  it('one side given ignores keepRatio: false (the other side follows the ratio)', () => {
    expect(resizeTarget(4000, 3000, { width: 800, keepRatio: false }, MAXP)).toEqual({
      width: 800,
      height: 600,
    });
  });
  it('both + keepRatio fits inside the box', () => {
    // 4:3 into a 1000×500 box: height limits.
    expect(resizeTarget(4000, 3000, { width: 1000, height: 500 }, MAXP)).toEqual({
      width: 667,
      height: 500,
    });
    // 4:3 into a 600×1000 box: width limits.
    expect(resizeTarget(4000, 3000, { width: 600, height: 1000 }, MAXP)).toEqual({
      width: 600,
      height: 450,
    });
  });
  it('fit-inside never exceeds the box after rounding', () => {
    for (const [W, H, bw, bh] of [
      [1001, 999, 333, 333],
      [7, 3, 5, 5],
      [3000, 4000, 1080, 1080],
      [1920, 1080, 1, 1],
    ]) {
      const r = resizeTarget(W, H, { width: bw, height: bh }, MAXP);
      expect(r.width).toBeLessThanOrEqual(bw);
      expect(r.height).toBeLessThanOrEqual(bh);
      expect(r.width === bw || r.height === bh).toBe(true);
      expect(r.width).toBeGreaterThanOrEqual(1);
      expect(r.height).toBeGreaterThanOrEqual(1);
    }
  });
  it('keepRatio: false with both gives exactly that size', () => {
    expect(resizeTarget(4000, 3000, { width: 1080, height: 1080, keepRatio: false }, MAXP)).toEqual(
      { width: 1080, height: 1080 },
    );
    // one axis up, one down
    expect(resizeTarget(400, 300, { width: 200, height: 900, keepRatio: false }, MAXP)).toEqual({
      width: 200,
      height: 900,
    });
  });
  it('rounds fractional pixels', () => {
    expect(resizeTarget(1000, 1000, { width: 499.6 }, MAXP)).toEqual({ width: 500, height: 500 });
  });
  it('allows upscaling', () => {
    expect(resizeTarget(400, 300, { width: 1600 }, MAXP)).toEqual({ width: 1600, height: 1200 });
  });
});

describe('resizeTarget: percent', () => {
  it('scales both sides', () => {
    expect(resizeTarget(4000, 3000, { percent: 50 }, MAXP)).toEqual({ width: 2000, height: 1500 });
    expect(resizeTarget(400, 300, { percent: 250 }, MAXP)).toEqual({ width: 1000, height: 750 });
    expect(resizeTarget(4000, 3000, { percent: 100 }, MAXP)).toEqual({ width: 4000, height: 3000 });
  });
  it('wins over width/height when set', () => {
    expect(resizeTarget(4000, 3000, { percent: 10, width: 999 }, MAXP)).toEqual({
      width: 400,
      height: 300,
    });
  });
  it('accepts 1 and 400, never returns a 0 side', () => {
    expect(resizeTarget(50, 20, { percent: 1 }, MAXP)).toEqual({ width: 1, height: 1 });
    expect(resizeTarget(100, 50, { percent: 400 }, MAXP)).toEqual({ width: 400, height: 200 });
  });
  it('rejects out-of-range and non-numbers', () => {
    for (const percent of [0, 0.5, 401, -10, NaN, Infinity]) {
      expectInvalid(() => resizeTarget(100, 100, { percent }, MAXP), /percentage from 1 to 400/);
    }
  });
});

describe('resizeTarget: validation', () => {
  it('needs a size', () => {
    expectInvalid(() => resizeTarget(100, 100, {}, MAXP), /width, a height or a percentage/);
  });
  it('rejects non-positive and NaN sides', () => {
    for (const width of [0, -5, NaN, Infinity, 0.2]) {
      const e = expectInvalid(() => resizeTarget(100, 100, { width }, MAXP));
      expect(e.code).toBe('INVALID_OPTIONS');
    }
    expectInvalid(() => resizeTarget(100, 100, { width: 50, height: -1 }, MAXP), /height/);
  });
  it('rejects sizes over the pixel cap and suggests the largest allowed', () => {
    const e = expectInvalid(
      () => resizeTarget(4000, 3000, { width: 8000 }, MAXP),
      /too big for this device/,
    );
    expect(e.code).toBe('INVALID_OPTIONS');
    const d = e.detail as { width: number; height: number };
    expect(d.width * d.height).toBeLessThanOrEqual(MAXP);
    expect(Math.abs(d.width / d.height - 8000 / 6000)).toBeLessThan(0.01);
    // A lower cap (low-memory devices) is respected too.
    expectInvalid(() => resizeTarget(4000, 3000, { percent: 100 }, 8_000_000), /too big/);
  });
  it('rejects sides over MAX_SIDE even when the area is small', () => {
    const e = expectInvalid(
      () => resizeTarget(100, 10, { width: 20_000, height: 10, keepRatio: false }, MAXP),
      /too big/,
    );
    expect((e.detail as { width: number }).width).toBeLessThanOrEqual(MAX_SIDE);
  });
  it('largestAllowed keeps the shape', () => {
    const r = largestAllowed(10_000, 10_000, MAXP);
    expect(r).toEqual({ width: 4096, height: 4096 });
  });
});

describe('resize names and same format', () => {
  it('names the file with the new size', () => {
    expect(resizeName('My Photo.JPG', 800, 600, 'jpeg')).toBe('My-Photo-800x600.jpg');
    expect(resizeName('', 10, 10, 'png')).toBe('image-10x10.png');
  });
  it('same format keeps JPG/PNG/WebP and uses PNG for the rest', () => {
    expect(resizeSameFormat('jpeg')).toBe('jpeg');
    expect(resizeSameFormat('png')).toBe('png');
    expect(resizeSameFormat('webp')).toBe('webp');
    expect(resizeSameFormat('gif')).toBe('png');
    expect(resizeSameFormat('bmp')).toBe('png');
    expect(resizeSameFormat('heic')).toBe('png');
  });
});

describe('resizeJob (fake canvas)', () => {
  const decode = vi.mocked(decodeImage);
  beforeEach(() => {
    enc.calls.length = 0;
    allCanvases.length = 0;
    decode.mockReset();
    vi.mocked(canEncodeWebp).mockResolvedValue(true);
    vi.mocked(assertFormatSupported).mockResolvedValue(undefined);
  });

  const run = (opts: ResizeOptions, name = 'photo.jpg') =>
    resizeJob(file(name), opts, fakeCtxJob());

  it('resizes a JPG, keeps the format and uses quality 0.9', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    const r = await run({ width: 800 });
    expect(r).toMatchObject({
      format: 'jpeg',
      width: 800,
      height: 600,
      quality: 0.9,
      fileName: 'photo-800x600.jpg',
      notes: [],
    });
    expect(enc.calls).toEqual([{ w: 800, h: 600, format: 'jpeg', q: 0.9 }]);
    expect(r.outputBytes).toBe(r.blob.size);
  });

  it('upscales', async () => {
    decode.mockResolvedValue(fakeDecoded(400, 300));
    const r = await run({ percent: 200 });
    expect([r.width, r.height]).toEqual([800, 600]);
  });

  it('exact size with keepRatio false', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    const r = await run({ width: 1080, height: 1080, keepRatio: false, quality: 0.7 });
    expect([r.width, r.height, r.quality]).toEqual([1080, 1080, 0.7]);
  });

  it('percent is relative to the real size when the input was reduced for memory', async () => {
    decode.mockResolvedValue(
      fakeDecoded(4000, 3000, {
        fullWidth: 8000,
        fullHeight: 6000,
        notes: ['downscaled-for-memory'],
      }),
    );
    const r = await run({ percent: 25 });
    expect([r.width, r.height]).toEqual([2000, 1500]);
    expect(r.notes).toContain('downscaled-for-memory');
  });

  it('flattens alpha for JPG with the background and adds the note', async () => {
    decode.mockResolvedValue(fakeDecoded(1000, 1000, { kind: 'png', hasAlpha: true }));
    const r = await run({ width: 500, format: 'jpeg', background: '#112233' }, 'logo.png');
    expect(r.format).toBe('jpeg');
    expect(r.fileName).toBe('logo-500x500.jpg');
    expect(r.notes).toContain('transparency-flattened');
    const out = allCanvases.at(-1) as FakeCanvas;
    const fill = out.ops.find((o) => o.op === 'fillRect');
    expect(fill?.fillStyle).toBe('#112233');
  });

  it('defaults the flatten background to white', async () => {
    decode.mockResolvedValue(fakeDecoded(1000, 1000, { kind: 'png', hasAlpha: true }));
    await run({ width: 500, format: 'jpeg' }, 'logo.png');
    const out = allCanvases.at(-1) as FakeCanvas;
    expect(out.ops.find((o) => o.op === 'fillRect')?.fillStyle).toBe('#ffffff');
  });

  it('keeps alpha for PNG ("same") with no quality and no note', async () => {
    decode.mockResolvedValue(fakeDecoded(1000, 1000, { kind: 'png', hasAlpha: true }));
    const r = await run({ width: 500 }, 'logo.png');
    expect(r.format).toBe('png');
    expect(r.quality).toBeUndefined();
    expect(r.notes).not.toContain('transparency-flattened');
    const out = allCanvases.at(-1) as FakeCanvas;
    expect(out.ops.some((o) => o.op === 'fillRect')).toBe(false);
  });

  it('"same" WebP falls back to PNG when WebP cannot be written', async () => {
    vi.mocked(canEncodeWebp).mockResolvedValue(false);
    decode.mockResolvedValue(fakeDecoded(1000, 800, { kind: 'webp' }));
    const r = await run({ width: 500 }, 'pic.webp');
    expect(r.format).toBe('png');
    expect(r.fileName).toBe('pic-500x400.png');
  });

  it('explicit WebP on a browser without WebP fails with ENCODE_UNSUPPORTED', async () => {
    const { EngineError } = await import('../errors');
    vi.mocked(assertFormatSupported).mockRejectedValue(
      new EngineError('ENCODE_UNSUPPORTED', 'no webp'),
    );
    decode.mockResolvedValue(fakeDecoded(1000, 800));
    await expect(run({ width: 500, format: 'webp' })).rejects.toMatchObject({
      code: 'ENCODE_UNSUPPORTED',
    });
    expect(decode).not.toHaveBeenCalled();
  });

  it('GIF "same" becomes PNG and keeps the animation note', async () => {
    decode.mockResolvedValue(
      fakeDecoded(300, 300, { kind: 'gif', animated: true, notes: ['animation-dropped'] }),
    );
    const r = await run({ percent: 50 }, 'anim.gif');
    expect(r.format).toBe('png');
    expect(r.notes).toEqual(['animation-dropped']);
  });

  it('rejects invalid input after decoding, without encoding', async () => {
    decode.mockResolvedValue(fakeDecoded(400, 300));
    await expect(run({ width: -1 })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    await expect(run({ percent: 1000 })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(enc.calls).toHaveLength(0);
  });

  it('steps big reductions down by halves', async () => {
    decode.mockResolvedValue(fakeDecoded(4000, 3000));
    await run({ width: 400 });
    // Source, then halving steps 2000, 1000, 500, then the 400 px output.
    expect(allCanvases).toHaveLength(5);
  });
});
