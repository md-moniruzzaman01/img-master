import { describe, expect, it } from 'vitest';
import { isAnimated, orientedSize, readHeader, sniffFormat } from '../decode';

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === 'string' ? Array.from(p, (c) => c.charCodeAt(0)) : p)),
  );
const be16 = (n: number) => [(n >> 8) & 255, n & 255];
const be32 = (n: number) => [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const le16 = (n: number) => [n & 255, (n >> 8) & 255];
const le24 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];

function png(w: number, h: number, extraChunks: number[] = []) {
  return bytes(
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    be32(13),
    'IHDR',
    be32(w),
    be32(h),
    [8, 6, 0, 0, 0],
    be32(0),
    extraChunks,
  );
}

function jpeg(w: number, h: number, orientation?: number) {
  const parts: number[][] = [[0xff, 0xd8]];
  if (orientation) {
    // APP1 Exif, big-endian TIFF with one IFD entry (0x0112).
    const tiff = [
      ...bytes('MM'),
      0,
      42,
      ...be32(8),
      ...be16(1),
      ...be16(0x0112),
      ...be16(3),
      ...be32(1),
      ...be16(orientation),
      0,
      0,
      ...be32(0),
    ];
    const payload = [...bytes('Exif'), 0, 0, ...tiff];
    parts.push([0xff, 0xe1, ...be16(payload.length + 2), ...payload]);
  }
  parts.push([0xff, 0xdb, ...be16(4), 0, 0]); // dummy DQT
  parts.push([
    0xff,
    0xc0,
    ...be16(17),
    8,
    ...be16(h),
    ...be16(w),
    3,
    1,
    0x22,
    0,
    2,
    0x11,
    1,
    3,
    0x11,
    1,
  ]);
  parts.push([0xff, 0xda]);
  return new Uint8Array(parts.flat());
}

describe('sniffFormat', () => {
  it('detects known signatures', () => {
    expect(sniffFormat(jpeg(10, 10))).toBe('jpeg');
    expect(sniffFormat(png(10, 10))).toBe('png');
    expect(sniffFormat(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))).toBe('webp');
    expect(sniffFormat(bytes('GIF89a'))).toBe('gif');
    expect(sniffFormat(bytes('BM', [0, 0, 0, 0]))).toBe('bmp');
    expect(sniffFormat(bytes([0, 0, 0, 24], 'ftypheic'))).toBe('heic');
    expect(sniffFormat(bytes([0, 0, 0, 24], 'ftypavif'))).toBe('avif');
    expect(sniffFormat(bytes('%PDF-1.7'))).toBe('unknown');
    expect(sniffFormat(new Uint8Array(0))).toBe('unknown');
  });
});

describe('readHeader', () => {
  it('reads PNG, GIF, BMP and WebP dimensions', () => {
    expect(readHeader(png(4000, 3000), 'png')).toMatchObject({ width: 4000, height: 3000 });
    expect(readHeader(bytes('GIF89a', le16(320), le16(200), [0, 0, 0]), 'gif')).toMatchObject({
      width: 320,
      height: 200,
    });
    const bmp = new Uint8Array(30);
    bmp.set(bytes('BM'));
    new DataView(bmp.buffer).setInt32(18, 640, true);
    new DataView(bmp.buffer).setInt32(22, -480, true); // top-down BMP
    expect(readHeader(bmp, 'bmp')).toMatchObject({ width: 640, height: 480 });
    const vp8x = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBPVP8X',
      [10, 0, 0, 0],
      [0x10, 0, 0, 0],
      le24(1919),
      le24(1079),
    );
    expect(readHeader(vp8x, 'webp')).toMatchObject({ width: 1920, height: 1080 });
  });

  it('reads JPEG dimensions and EXIF orientation', () => {
    expect(readHeader(jpeg(4032, 3024), 'jpeg')).toEqual({
      width: 4032,
      height: 3024,
      orientation: 1,
    });
    const rotated = readHeader(jpeg(4032, 3024, 6), 'jpeg');
    expect(rotated).toEqual({ width: 4032, height: 3024, orientation: 6 });
    expect(orientedSize(rotated!)).toEqual({ width: 3024, height: 4032 });
  });

  it('returns null for truncated data', () => {
    expect(readHeader(new Uint8Array([0xff, 0xd8, 0xff]), 'jpeg')).toBeNull();
    expect(readHeader(new Uint8Array(8), 'png')).toBeNull();
  });
});

describe('isAnimated', () => {
  it('detects animated WebP via the VP8X flag', () => {
    const anim = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBPVP8X',
      [10, 0, 0, 0],
      [0x02, 0, 0, 0],
      le24(9),
      le24(9),
    );
    const still = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBPVP8X',
      [10, 0, 0, 0],
      [0x10, 0, 0, 0],
      le24(9),
      le24(9),
    );
    expect(isAnimated(anim, 'webp')).toBe(true);
    expect(isAnimated(still, 'webp')).toBe(false);
  });

  it('detects APNG (acTL before IDAT)', () => {
    const actl = [...be32(8), ...bytes('acTL'), ...be32(2), ...be32(0), ...be32(0)];
    const idat = [...be32(0), ...bytes('IDAT'), ...be32(0)];
    expect(isAnimated(png(10, 10, [...actl, ...idat]), 'png')).toBe(true);
    expect(isAnimated(png(10, 10, idat), 'png')).toBe(false);
  });

  it('counts GIF frames', () => {
    const frame = [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0x44, 0];
    const gif1 = bytes('GIF89a', le16(1), le16(1), [0, 0, 0], frame, [0x3b]);
    const gif2 = bytes(
      'GIF89a',
      le16(1),
      le16(1),
      [0, 0, 0],
      [0x21, 0xf9, 4, 0, 0, 0, 0, 0],
      frame,
      [0x21, 0xf9, 4, 0, 0, 0, 0, 0],
      frame,
      [0x3b],
    );
    expect(isAnimated(gif1, 'gif')).toBe(false);
    expect(isAnimated(gif2, 'gif')).toBe(true);
  });
});
