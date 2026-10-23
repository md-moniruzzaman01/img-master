// File/Blob → drawable source (ENGINE.md §4): magic-byte sniffing, EXIF
// orientation, memory guard, cheap alpha and animation detection.
import type { EngineNote } from '../types';
import { EngineError, isOutOfMemory } from './errors';
import { context2d, createCanvas, releaseCanvas } from './encode';
import { fitPixels, renderScaled, type DrawSource } from './resize';

export type SniffedKind = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'heic' | 'avif' | 'unknown';

/** Bytes read from the start of the file for sniffing (covers big EXIF blocks). */
const HEAD_BYTES = 512 * 1024;

const ascii = (b: Uint8Array, at: number, len: number) =>
  at + len <= b.length ? String.fromCharCode(...b.subarray(at, at + len)) : '';

export function sniffFormat(b: Uint8Array): SniffedKind {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return 'png';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (ascii(b, 0, 4) === 'GIF8') return 'gif';
  if (ascii(b, 0, 2) === 'BM') return 'bmp';
  if (ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand))
      return 'heic';
  }
  return 'unknown';
}

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32be = (b: Uint8Array, i: number) =>
  ((b[i] << 24) >>> 0) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);

export interface HeaderInfo {
  width: number;
  height: number;
  /** EXIF orientation 1–8 (JPEG only; 1 when absent). */
  orientation: number;
}

/** Stored (unrotated) dimensions from the header, or null when unknown. */
export function readHeader(b: Uint8Array, kind: SniffedKind): HeaderInfo | null {
  try {
    switch (kind) {
      case 'png':
        if (b.length < 24 || ascii(b, 12, 4) !== 'IHDR') return null;
        return { width: u32be(b, 16), height: u32be(b, 20), orientation: 1 };
      case 'gif':
        if (b.length < 10) return null;
        return { width: u16le(b, 6), height: u16le(b, 8), orientation: 1 };
      case 'bmp': {
        if (b.length < 26) return null;
        const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
        return {
          width: Math.abs(dv.getInt32(18, true)),
          height: Math.abs(dv.getInt32(22, true)),
          orientation: 1,
        };
      }
      case 'webp': {
        const chunk = ascii(b, 12, 4);
        if (chunk === 'VP8X' && b.length >= 30)
          return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1, orientation: 1 };
        if (chunk === 'VP8 ' && b.length >= 30)
          return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff, orientation: 1 };
        if (chunk === 'VP8L' && b.length >= 25) {
          const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
          return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >>> 14) & 0x3fff) + 1,
            orientation: 1,
          };
        }
        return null;
      }
      case 'jpeg':
        return readJpeg(b);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function readJpeg(b: Uint8Array): HeaderInfo | null {
  let orientation = 1;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = u16be(b, i + 2);
    if (marker === 0xe1 && ascii(b, i + 4, 6) === 'Exif\0\0') {
      orientation = readExifOrientation(b, i + 10, i + 2 + len) ?? orientation;
    }
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (i + 9 > b.length) return null;
      return { height: u16be(b, i + 5), width: u16be(b, i + 7), orientation };
    }
    if (marker === 0xda || marker === 0xd9) return null;
    i += 2 + len;
  }
  return null;
}

function readExifOrientation(b: Uint8Array, tiff: number, end: number): number | null {
  if (end > b.length) return null;
  const le = ascii(b, tiff, 2) === 'II';
  if (!le && ascii(b, tiff, 2) !== 'MM') return null;
  const r16 = (i: number) => (le ? u16le(b, i) : u16be(b, i));
  const r32 = (i: number) =>
    le ? (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0 : u32be(b, i);
  const ifd = tiff + r32(tiff + 4);
  if (ifd + 2 > end) return null;
  const count = r16(ifd);
  for (let n = 0; n < count; n++) {
    const e = ifd + 2 + n * 12;
    if (e + 12 > end) return null;
    if (r16(e) === 0x0112) {
      const v = r16(e + 8);
      return v >= 1 && v <= 8 ? v : null;
    }
  }
  return null;
}

/** True for animated GIF (2+ frames), animated WebP and APNG. */
export function isAnimated(b: Uint8Array, kind: SniffedKind): boolean {
  if (kind === 'webp') return ascii(b, 12, 4) === 'VP8X' && (b[20] & 0x02) !== 0;
  if (kind === 'png') {
    // acTL must appear before the first IDAT.
    let i = 8;
    while (i + 8 <= b.length) {
      const len = u32be(b, i);
      const type = ascii(b, i + 4, 4);
      if (type === 'acTL') return true;
      if (type === 'IDAT') return false;
      i += 12 + len;
    }
    return false;
  }
  if (kind === 'gif') return countGifFrames(b, 2) >= 2;
  return false;
}

function countGifFrames(b: Uint8Array, stopAt: number): number {
  if (b.length < 13) return 0;
  let i = 13;
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 0x07) + 1)); // global color table
  let frames = 0;
  const skipBlocks = () => {
    while (i < b.length && b[i] !== 0) i += b[i] + 1;
    i++;
  };
  while (i < b.length) {
    const t = b[i];
    if (t === 0x3b) break; // trailer
    if (t === 0x21) {
      i += 2;
      skipBlocks();
    } else if (t === 0x2c) {
      frames++;
      if (frames >= stopAt) return frames;
      const packed = b[i + 9];
      i += 10;
      if (packed & 0x80) i += 3 * (1 << ((packed & 0x07) + 1)); // local color table
      i++; // LZW min code size
      skipBlocks();
    } else break;
  }
  return frames;
}

/** EXIF orientations 5–8 swap width and height. */
export function orientedSize(h: HeaderInfo): { width: number; height: number } {
  return h.orientation >= 5
    ? { width: h.height, height: h.width }
    : { width: h.width, height: h.height };
}

export interface Decoded {
  source: DrawSource;
  width: number;
  height: number;
  kind: SniffedKind;
  hasAlpha: boolean;
  animated: boolean;
  notes: EngineNote[];
  /** Frees the decoded pixels. Always call when done. */
  release(): void;
}

function closeSource(s: DrawSource): void {
  if ('close' in s && typeof s.close === 'function') s.close();
  else releaseCanvas(s as Exclude<DrawSource, ImageBitmap>);
}

async function bitmapFrom(file: Blob, resizeWidth?: number): Promise<ImageBitmap> {
  const opts: ImageBitmapOptions = { imageOrientation: 'from-image' };
  if (resizeWidth) {
    opts.resizeWidth = resizeWidth;
    opts.resizeQuality = 'high';
  }
  try {
    return await createImageBitmap(file, opts);
  } catch (e) {
    if (isOutOfMemory(e)) throw e;
    // Older engines reject unknown option values; try once with defaults.
    return await createImageBitmap(file);
  }
}

/** Cheap alpha check on a 64×64 sample. */
function detectAlpha(src: DrawSource): boolean {
  const c = createCanvas(64, 64);
  try {
    const ctx = context2d(c, { willReadFrequently: true });
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(src, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } finally {
    releaseCanvas(c);
  }
}

export async function decodeImage(file: Blob, maxPixels: number): Promise<Decoded> {
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  const kind = sniffFormat(head);
  const header = readHeader(head, kind);
  const notes: EngineNote[] = [];

  // Ask the decoder for a smaller bitmap when the header says it's too big.
  let resizeWidth: number | undefined;
  if (header && header.width * header.height > maxPixels) {
    resizeWidth = fitPixels(
      orientedSize(header).width,
      orientedSize(header).height,
      maxPixels,
    ).width;
  }

  let source: DrawSource;
  try {
    source = await bitmapFrom(file, resizeWidth);
  } catch (e) {
    if (isOutOfMemory(e)) throw e;
    const known = kind !== 'unknown';
    const looksLikeImage = known || file.type.startsWith('image/');
    if (kind === 'heic' || kind === 'avif' || !looksLikeImage) {
      throw new EngineError('UNSUPPORTED_FORMAT', 'This browser cannot open this file type');
    }
    throw new EngineError('DECODE_FAILED', 'The image could not be opened. It may be damaged.');
  }

  if (resizeWidth !== undefined) notes.push('downscaled-for-memory');

  // Some browsers ignore resize options: downscale with canvas steps instead.
  if (source.width * source.height > maxPixels) {
    const fit = fitPixels(source.width, source.height, maxPixels);
    let scaled: DrawSource;
    try {
      scaled = renderScaled(source, fit.width, fit.height);
    } finally {
      closeSource(source);
    }
    source = scaled;
    if (!notes.includes('downscaled-for-memory')) notes.push('downscaled-for-memory');
  }

  let hasAlpha = false;
  try {
    hasAlpha = kind !== 'jpeg' && detectAlpha(source);
  } catch (e) {
    closeSource(source);
    throw e;
  }
  const animated = isAnimated(head, kind);
  if (animated) notes.push('animation-dropped');

  const s = source;
  return {
    source: s,
    width: s.width,
    height: s.height,
    kind,
    hasAlpha,
    animated,
    notes,
    release: () => closeSource(s),
  };
}
