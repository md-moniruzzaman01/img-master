// Resize tool: decode → scale to the asked size (may upscale, up to the pixel
// cap) → flatten alpha for JPG → encode. Runs in the worker or the fallback.
import type { EngineNote, EngineResult, ImageFormat, ResizeOptions } from '../types';
import { decodeImage, type SniffedKind } from './decode';
import { EngineError } from './errors';
import {
  assertFormatSupported,
  canEncodeWebp,
  clampQuality,
  encodeCanvas,
  releaseCanvas,
} from './encode';
import { resizeName } from './names';
import { fitPixels, renderAnySize } from './resize';
import type { JobContext } from './run-job';

export const MIN_PERCENT = 1;
export const MAX_PERCENT = 400;
/** Longest side we ask a canvas for (browsers fail somewhere above this). */
export const MAX_SIDE = 16_384;
export const DEFAULT_RESIZE_QUALITY = 0.9;

export interface Size {
  width: number;
  height: number;
}

/**
 * Bad input → INVALID_OPTIONS with a message the UI can show. For "too big",
 * `detail` carries the largest allowed size with the same shape.
 */
function invalid(message: string, detail?: Size): EngineError {
  return new EngineError('INVALID_OPTIONS', message, detail);
}

const isSet = (n: unknown): boolean => n !== undefined && n !== null;

function positive(n: unknown, what: string): number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
    throw invalid(`Enter a ${what} above 0.`);
  }
  const r = Math.round(n);
  if (r < 1) throw invalid(`Enter a ${what} of at least 1 pixel.`);
  return r;
}

/** Largest size with the same aspect ratio within the pixel cap and MAX_SIDE. */
export function largestAllowed(width: number, height: number, maxPixels: number): Size {
  let { width: w, height: h } = fitPixels(width, height, maxPixels);
  const long = Math.max(w, h);
  if (long > MAX_SIDE) {
    const s = MAX_SIDE / long;
    w = Math.max(1, Math.floor(w * s));
    h = Math.max(1, Math.floor(h * s));
  }
  return { width: w, height: h };
}

/**
 * Output size for a W×H source (pure). `percent` wins when it is set;
 * otherwise width and/or height. keepRatio (default true): one side given →
 * the other follows the ratio; both given → fit inside the box. keepRatio
 * false with both → exactly that size. Throws a clear EngineError for bad input
 * or a size over the pixel cap.
 */
export function resizeTarget(
  srcWidth: number,
  srcHeight: number,
  opts: Pick<ResizeOptions, 'width' | 'height' | 'percent' | 'keepRatio'>,
  maxPixels: number,
): Size {
  if (!(srcWidth >= 1 && srcHeight >= 1))
    throw new EngineError('DECODE_FAILED', 'Image has no pixels');
  const keepRatio = opts.keepRatio ?? true;
  let w: number;
  let h: number;

  if (isSet(opts.percent)) {
    const p = opts.percent as number;
    if (typeof p !== 'number' || !Number.isFinite(p) || p < MIN_PERCENT || p > MAX_PERCENT) {
      throw invalid(`Enter a percentage from ${MIN_PERCENT} to ${MAX_PERCENT}.`);
    }
    w = Math.max(1, Math.round((srcWidth * p) / 100));
    h = Math.max(1, Math.round((srcHeight * p) / 100));
  } else {
    const hasW = isSet(opts.width);
    const hasH = isSet(opts.height);
    if (!hasW && !hasH) throw invalid('Enter a width, a height or a percentage.');
    const tw = hasW ? positive(opts.width, 'width') : 0;
    const th = hasH ? positive(opts.height, 'height') : 0;
    if (hasW && hasH && !keepRatio) {
      w = tw;
      h = th;
    } else if (hasW && hasH) {
      // Fit inside the box, keeping the ratio.
      const s = Math.min(tw / srcWidth, th / srcHeight);
      w = Math.min(tw, Math.max(1, Math.round(srcWidth * s)));
      h = Math.min(th, Math.max(1, Math.round(srcHeight * s)));
    } else if (hasW) {
      w = tw;
      h = Math.max(1, Math.round((srcHeight * tw) / srcWidth));
    } else {
      h = th;
      w = Math.max(1, Math.round((srcWidth * th) / srcHeight));
    }
  }

  if (w * h > maxPixels || Math.max(w, h) > MAX_SIDE) {
    const max = largestAllowed(w, h, maxPixels);
    throw invalid(
      `That size is too big for this device. The largest is ${max.width} × ${max.height} px.`,
      max,
    );
  }
  return { width: w, height: h };
}

/** "same": keep JPG/PNG/WebP; anything else (GIF, BMP, HEIC…) becomes PNG. */
export function resizeSameFormat(kind: SniffedKind): ImageFormat {
  return kind === 'jpeg' || kind === 'png' || kind === 'webp' ? kind : 'png';
}

export async function resizeJob(
  file: File,
  opts: ResizeOptions,
  ctx: JobContext,
): Promise<EngineResult> {
  const explicit = opts.format && opts.format !== 'same' ? opts.format : null;
  if (explicit) await assertFormatSupported(explicit);
  ctx.progress('decode', 0);
  const decoded = await decodeImage(file, ctx.maxPixels);
  let canvas = null;
  try {
    ctx.check();
    ctx.progress('decode', 1);
    // Sizes are relative to the real image, even when it was reduced for memory.
    const size = resizeTarget(decoded.fullWidth, decoded.fullHeight, opts, ctx.maxPixels);
    let format = explicit ?? resizeSameFormat(decoded.kind);
    // "same" WebP on a browser that can't write WebP: lossless PNG, never a silent JPG.
    if (!explicit && format === 'webp' && !(await canEncodeWebp())) format = 'png';

    const notes: EngineNote[] = [...decoded.notes];
    const flatten = format === 'jpeg';
    if (flatten && decoded.hasAlpha) notes.push('transparency-flattened');
    canvas = renderAnySize(
      decoded.source,
      size.width,
      size.height,
      flatten ? (opts.background ?? '#ffffff') : undefined,
    );
    decoded.release();
    ctx.check();
    const quality =
      format === 'png' ? undefined : clampQuality(opts.quality ?? DEFAULT_RESIZE_QUALITY);
    ctx.progress('encode', 0.5);
    const blob = await encodeCanvas(canvas, format, quality);
    ctx.progress('encode', 1);
    return {
      blob,
      fileName: resizeName(file.name, canvas.width, canvas.height, format),
      format,
      width: canvas.width,
      height: canvas.height,
      inputBytes: file.size,
      outputBytes: blob.size,
      quality: quality === undefined ? undefined : Math.round(quality * 100) / 100,
      notes,
      ms: ctx.elapsed(),
    };
  } finally {
    decoded.release();
    releaseCanvas(canvas);
  }
}
