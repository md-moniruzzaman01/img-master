// Canvas helpers and canvas → Blob encoding (ENGINE.md §3, §7).
// Works in the worker (OffscreenCanvas) and on the main thread (HTMLCanvasElement).
import type { ImageFormat } from '../types';
import { EngineError, MemoryError } from './errors';

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
export type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export const MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const hasDom = () =>
  typeof document !== 'undefined' && typeof document.createElement === 'function';

/** OffscreenCanvas in workers, a DOM canvas on the main thread. */
export function createCanvas(width: number, height: number): AnyCanvas {
  if (hasDom()) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  if (typeof OffscreenCanvas === 'undefined') throw new MemoryError('No canvas available');
  return new OffscreenCanvas(width, height);
}

export function context2d(canvas: AnyCanvas, settings?: CanvasRenderingContext2DSettings): Ctx2D {
  const ctx = canvas.getContext('2d', settings) as Ctx2D | null;
  // A null context almost always means the canvas was too large to allocate.
  if (!ctx) throw new MemoryError(`Could not allocate a ${canvas.width}×${canvas.height} canvas`);
  return ctx;
}

/** Frees canvas memory right away (Safari keeps it until GC otherwise). */
export function releaseCanvas(canvas: AnyCanvas | null | undefined): void {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

async function toBlob(canvas: AnyCanvas, type: string, quality?: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    try {
      return await canvas.convertToBlob({ type, quality });
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, type, quality));
}

/**
 * Encodes a canvas. Throws ENCODE_UNSUPPORTED when the browser silently
 * returns another format (Safari returns PNG for WebP) and MemoryError when
 * encoding fails outright.
 */
export async function encodeCanvas(
  canvas: AnyCanvas,
  format: ImageFormat,
  quality?: number,
): Promise<Blob> {
  const type = MIME[format];
  const q = format === 'png' ? undefined : clampQuality(quality ?? 0.9);
  const blob = await toBlob(canvas, type, q);
  if (!blob || blob.size === 0) throw new MemoryError('Encoding failed');
  if (blob.type !== type) {
    throw new EngineError(
      'ENCODE_UNSUPPORTED',
      `This browser cannot save ${format.toUpperCase()} files`,
    );
  }
  return blob;
}

export function clampQuality(q: number): number {
  if (!Number.isFinite(q)) return 0.9;
  return Math.min(1, Math.max(0.01, q));
}

let webpCheck: Promise<boolean> | null = null;

/** Encodes a 1×1 canvas as WebP and checks the result really is WebP (cached). */
export function canEncodeWebp(): Promise<boolean> {
  webpCheck ??= (async () => {
    try {
      const c = createCanvas(1, 1);
      const ctx = context2d(c);
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 1, 1);
      const blob = await toBlob(c, 'image/webp', 0.8);
      return !!blob && blob.type === 'image/webp';
    } catch {
      return false;
    }
  })();
  return webpCheck;
}

export async function assertFormatSupported(format: ImageFormat): Promise<void> {
  if (format === 'webp' && !(await canEncodeWebp())) {
    throw new EngineError('ENCODE_UNSUPPORTED', 'This browser cannot save WebP files');
  }
}

/** Worker self-test: can this context create a 2d OffscreenCanvas and encode it? */
export async function probeOffscreen(): Promise<boolean> {
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined')
      return false;
    const c = new OffscreenCanvas(1, 1);
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1, 1);
    const blob = await c.convertToBlob({ type: 'image/png' });
    return blob.size > 0 && blob.type === 'image/png';
  } catch {
    return false;
  }
}
