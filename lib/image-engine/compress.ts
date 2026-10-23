// Quality-based compression (ENGINE.md §8).
import type { CompressOptions, EngineNote, EngineResult, ImageFormat } from '../types';
import { decodeImage, type SniffedKind } from './decode';
import { assertFormatSupported, clampQuality, encodeCanvas, releaseCanvas } from './encode';
import { compressName } from './names';
import { fitWidth, renderScaled } from './resize';
import type { JobContext } from './run-job';

/** Lower qualities tried when the first result is bigger than the input. */
const RETRY_STEPS = [0.1, 0.2, 0.3];
const RETRY_MIN_QUALITY = 0.3;

/** Output format for "same": formats the browser can't write go to PNG (lossless) or JPG. */
export function sameFormatFor(kind: SniffedKind, hasAlpha: boolean): ImageFormat {
  if (kind === 'jpeg' || kind === 'png' || kind === 'webp') return kind;
  if (kind === 'gif' || kind === 'bmp') return 'png';
  return hasAlpha ? 'png' : 'jpeg';
}

export async function compressJob(file: File, opts: CompressOptions, ctx: JobContext): Promise<EngineResult> {
  const explicit = opts.format && opts.format !== 'same' ? opts.format : null;
  if (explicit) await assertFormatSupported(explicit);
  ctx.progress('decode', 0);
  const decoded = await decodeImage(file, ctx.maxPixels);
  ctx.check();
  ctx.progress('decode', 1);
  const format = explicit ?? sameFormatFor(decoded.kind, decoded.hasAlpha);
  const notes: EngineNote[] = [...decoded.notes];
  let canvas = null;
  try {
    if (!explicit) await assertFormatSupported(format);
    const size = fitWidth(decoded.width, decoded.height, opts.maxWidth ?? 0);
    if (size.width < decoded.width) notes.push('resized');
    const flatten = format === 'jpeg';
    if (flatten && decoded.hasAlpha) notes.push('transparency-flattened');
    canvas = renderScaled(decoded.source, size.width, size.height, flatten ? '#ffffff' : undefined);
    decoded.release();

    const lossy = format !== 'png';
    let quality = lossy ? clampQuality(opts.quality) : undefined;
    ctx.progress('encode', 0.3);
    let blob = await encodeCanvas(canvas, format, quality);

    // Bigger than the input? Try a few lower qualities and keep the first smaller one.
    if (lossy && quality !== undefined && blob.size >= file.size) {
      const startQ: number = quality;
      for (const step of RETRY_STEPS) {
        const q = Math.round((startQ - step) * 100) / 100;
        if (q < RETRY_MIN_QUALITY) break;
        ctx.check();
        await ctx.yieldNow();
        const b = await encodeCanvas(canvas, format, q);
        if (b.size < blob.size) {
          blob = b;
          quality = q;
        }
        if (b.size < file.size) break;
      }
    }
    ctx.progress('encode', 1);
    return {
      blob,
      fileName: compressName(file.name, format),
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
