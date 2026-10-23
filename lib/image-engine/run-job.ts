// Job runner shared by the worker and the main-thread fallback (ENGINE.md §10).
import type {
  CompressOptions,
  CompressToSizeOptions,
  ConvertOptions,
  EngineNote,
  EngineResult,
} from '../types';
import { compressJob } from './compress';
import { MAX_ENCODES, searchToSize, targetBytesFor, type Encoder } from './compress-to-size';
import { convertJob } from './convert';
import { decodeImage } from './decode';
import { EngineError, cancelled, isOutOfMemory } from './errors';
import { assertFormatSupported, encodeCanvas, releaseCanvas, type AnyCanvas } from './encode';
import { compressToSizeName } from './names';
import { Pyramid } from './resize';

export type JobType = 'compressToSize' | 'convert' | 'compress' | 'pngToIco' | 'favicons';
export type Stage = 'decode' | 'search' | 'encode';

export interface RunOptions {
  maxPixels: number;
  onProgress?: (stage: Stage, ratio: number) => void;
  isCancelled?: () => boolean;
  /** Main-thread fallback: yield to the UI between encodes. */
  yieldBetween?: boolean;
}

export interface JobContext {
  maxPixels: number;
  progress(stage: Stage, ratio: number): void;
  /** Throws CANCELLED when the job was cancelled. */
  check(): void;
  isCancelled(): boolean;
  /** Yields to the event loop on the main thread; no-op in the worker. */
  yieldNow(): Promise<void>;
  elapsed(): number;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export async function compressToSizeJob(
  file: File,
  opts: CompressToSizeOptions,
  ctx: JobContext,
): Promise<EngineResult> {
  const format = opts.format ?? 'jpeg';
  if (format !== 'jpeg' && format !== 'webp') {
    throw new EngineError('ENCODE_UNSUPPORTED', 'Compress to size supports JPG and WebP only');
  }
  if (!(opts.targetKB > 0) || !Number.isFinite(opts.targetKB)) {
    throw new EngineError('TARGET_UNREACHABLE', 'Invalid target size');
  }
  await assertFormatSupported(format);
  const targetBytes = targetBytesFor(opts.targetKB);

  ctx.progress('decode', 0);
  const decoded = await decodeImage(file, ctx.maxPixels);
  ctx.check();
  ctx.progress('decode', 1);
  const notes: EngineNote[] = [...decoded.notes];
  const flatten = format === 'jpeg';
  const background = flatten ? (opts.background ?? '#ffffff') : undefined;

  const pyramid = new Pyramid(decoded.source);
  let cached: { w: number; h: number; canvas: AnyCanvas } | null = null;
  const encoder: Encoder = async (w, h, q) => {
    if (!cached || cached.w !== w || cached.h !== h) {
      releaseCanvas(cached?.canvas);
      cached = null;
      cached = { w, h, canvas: pyramid.render(w, h, background) };
    }
    const blob = await encodeCanvas(cached.canvas, format, q);
    return { bytes: blob.size, blob };
  };

  try {
    const r = await searchToSize({
      width: decoded.width,
      height: decoded.height,
      targetBytes,
      keepDimensions: opts.keepDimensions ?? false,
      encode: encoder,
      onEncode: (n) => ctx.progress('search', Math.min(1, n / MAX_ENCODES)),
      isCancelled: () => ctx.isCancelled(),
      yieldFn: () => ctx.yieldNow(),
    });
    // Hard rule: never return a file over the target.
    if (r.blob.size > targetBytes) {
      throw new EngineError('TARGET_UNREACHABLE', 'This image cannot get under the target size', {
        smallestBytes: r.blob.size,
        width: r.width,
        height: r.height,
      });
    }
    if (flatten && decoded.hasAlpha) notes.push('transparency-flattened');
    if (r.width < decoded.width || r.height < decoded.height) notes.push('resized');
    if (r.encodes === 1 && file.size <= targetBytes) notes.push('already-small');
    ctx.progress('encode', 1);
    return {
      blob: r.blob,
      fileName: compressToSizeName(file.name, opts.targetKB, format),
      format,
      width: r.width,
      height: r.height,
      inputBytes: file.size,
      outputBytes: r.blob.size,
      quality: r.quality,
      notes,
      ms: ctx.elapsed(),
    };
  } finally {
    releaseCanvas((cached as { canvas: AnyCanvas } | null)?.canvas);
    cached = null;
    pyramid.release();
    decoded.release();
  }
}

async function runOnce(
  type: JobType,
  file: File,
  options: unknown,
  ctx: JobContext,
): Promise<EngineResult> {
  switch (type) {
    case 'compressToSize':
      return compressToSizeJob(file, options as CompressToSizeOptions, ctx);
    case 'convert':
      return convertJob(file, options as ConvertOptions, ctx);
    case 'compress':
      return compressJob(file, options as CompressOptions, ctx);
    default:
      // pngToIco and favicons arrive in Phase 4.
      throw new EngineError('ENCODE_UNSUPPORTED', 'Not built yet');
  }
}

/**
 * Runs one job. On an allocation failure it retries once at half the pixel
 * cap, then fails with OUT_OF_MEMORY.
 */
export async function runJob(
  type: JobType,
  file: File,
  options: unknown,
  run: RunOptions,
): Promise<EngineResult> {
  const started = now();
  const isCancelled = () => run.isCancelled?.() ?? false;
  const makeCtx = (maxPixels: number): JobContext => ({
    maxPixels,
    progress: (stage, ratio) => run.onProgress?.(stage, ratio),
    check: () => {
      if (isCancelled()) throw cancelled();
    },
    isCancelled,
    yieldNow: () => (run.yieldBetween ? new Promise((r) => setTimeout(r)) : Promise.resolve()),
    elapsed: () => Math.round(now() - started),
  });

  try {
    return await runOnce(type, file, options, makeCtx(run.maxPixels));
  } catch (e) {
    if (!isOutOfMemory(e) || isCancelled()) throw e;
  }
  try {
    // decodeImage adds 'downscaled-for-memory' if the lower cap shrinks the image.
    return await runOnce(type, file, options, makeCtx(Math.floor(run.maxPixels / 2)));
  } catch (e) {
    if (isOutOfMemory(e)) {
      throw new EngineError('OUT_OF_MEMORY', 'Not enough memory to process this image');
    }
    throw e;
  }
}
