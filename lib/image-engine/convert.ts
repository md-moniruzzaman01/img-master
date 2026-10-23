// Convert (ENGINE.md §7): decode → flatten alpha for JPG → encode.
import type { ConvertOptions, EngineNote, EngineResult } from '../types';
import { decodeImage } from './decode';
import { assertFormatSupported, encodeCanvas, releaseCanvas } from './encode';
import { convertName } from './names';
import { renderScaled } from './resize';
import type { JobContext } from './run-job';

export async function convertJob(file: File, opts: ConvertOptions, ctx: JobContext): Promise<EngineResult> {
  const to = opts.to;
  await assertFormatSupported(to);
  ctx.progress('decode', 0);
  const decoded = await decodeImage(file, ctx.maxPixels);
  ctx.check();
  ctx.progress('decode', 1);
  const notes: EngineNote[] = [...decoded.notes];
  const flatten = to === 'jpeg';
  if (flatten && decoded.hasAlpha) notes.push('transparency-flattened');

  // Same format: still re-encode (drops metadata) but keep quality high.
  const sameFormat = decoded.kind === to;
  const quality = to === 'png' ? undefined : (opts.quality ?? (sameFormat ? 0.92 : 0.9));

  let canvas = null;
  try {
    canvas = renderScaled(
      decoded.source,
      decoded.width,
      decoded.height,
      flatten ? (opts.background ?? '#ffffff') : undefined,
    );
    decoded.release();
    ctx.progress('encode', 0.5);
    const blob = await encodeCanvas(canvas, to, quality);
    ctx.progress('encode', 1);
    return {
      blob,
      fileName: convertName(file.name, to),
      format: to,
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
