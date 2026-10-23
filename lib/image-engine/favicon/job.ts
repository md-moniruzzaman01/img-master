// Favicon package and PNG → ICO jobs (ENGINE.md §9). Run in the worker or the main-thread fallback.
import type { EngineResult } from '../../types';
import { decodeImage } from '../decode';
import { EngineError } from '../errors';
import { encodeCanvas, releaseCanvas, type AnyCanvas } from '../encode';
import { convertName } from '../names';
import type { FaviconWire } from '../protocol';
import { renderScaled } from '../resize';
import type { JobContext } from '../run-job';
import { BASE_SIZE, ICO_SIZES, PNG_SIZES } from './geometry';
import { writeIco } from './ico';
import {
  buildManifest,
  buildReadme,
  buildSnippet,
  normalizeSpec,
  type WireFaviconSource,
} from './package';
import { drawContained, drawGlyphIcon, drawImageIcon, glyphLayout } from './render';
import { buildSvg } from './svg';

type Size = (typeof PNG_SIZES)[number];

const bytesOf = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

/** Sizes drawn straight at their own size for text and emoji (crisper than downscaling). */
const DIRECT = new Set<number>([16, 32]);

export async function faviconsJob(
  file: File | null,
  src: WireFaviconSource,
  ctx: JobContext,
): Promise<FaviconWire> {
  const spec = normalizeSpec(src);
  ctx.progress('decode', 0);

  let decoded: Awaited<ReturnType<typeof decodeImage>> | null = null;
  let base: AnyCanvas | null = null;
  try {
    let layout = null as ReturnType<typeof glyphLayout> | null;
    if (spec.mode === 'image') {
      if (!file) throw new EngineError('DECODE_FAILED', 'Choose an image first.');
      decoded = await decodeImage(file, ctx.maxPixels);
      ctx.check();
      base = drawImageIcon(decoded.source, spec, BASE_SIZE);
      decoded.release();
      decoded = null;
    } else {
      layout = glyphLayout(spec);
      base = drawGlyphIcon(spec, layout, BASE_SIZE);
    }
    ctx.check();
    ctx.progress('decode', 1);

    const png = new Map<Size, Blob>();
    for (const [i, size] of PNG_SIZES.entries()) {
      ctx.check();
      let c: AnyCanvas;
      if (size === BASE_SIZE) c = base;
      else if (layout && DIRECT.has(size)) c = drawGlyphIcon(spec, layout, size);
      else c = renderScaled(base, size, size);
      try {
        png.set(size, await encodeCanvas(c, 'png'));
      } finally {
        if (c !== base) releaseCanvas(c);
      }
      ctx.progress('encode', (i + 1) / PNG_SIZES.length);
      await ctx.yieldNow();
    }
    ctx.check();

    const ico = writeIco(
      await Promise.all(ICO_SIZES.map(async (size) => ({ size, png: await bytesOf(png.get(size) as Blob) }))),
    );
    const snippet = buildSnippet(spec.mode);
    const get = (s: Size) => png.get(s) as Blob;
    const files: { name: string; blob: Blob }[] = [
      { name: 'favicon.ico', blob: new Blob([ico as BlobPart], { type: 'image/x-icon' }) },
      { name: 'favicon-16x16.png', blob: get(16) },
      { name: 'favicon-32x32.png', blob: get(32) },
      { name: 'apple-touch-icon.png', blob: get(180) },
      { name: 'android-chrome-192x192.png', blob: get(192) },
      { name: 'android-chrome-512x512.png', blob: get(512) },
    ];
    if (spec.mode !== 'image' && layout) {
      const svg = buildSvg({
        kind: spec.mode,
        text: spec.text,
        shape: spec.shape,
        background: spec.background,
        color: spec.color,
        fontWeight: spec.fontWeight,
        layout,
      });
      files.push({ name: 'favicon.svg', blob: new Blob([svg], { type: 'image/svg+xml' }) });
    }
    files.push(
      {
        name: 'site.webmanifest',
        blob: new Blob([buildManifest(spec)], { type: 'application/manifest+json' }),
      },
      { name: 'README.txt', blob: new Blob([buildReadme(spec.mode, snippet)], { type: 'text/plain' }) },
    );
    return {
      files,
      snippet,
      previews: { 16: get(16), 32: get(32), 48: get(48), 180: get(180), 512: get(512) },
    };
  } finally {
    decoded?.release();
    releaseCanvas(base);
  }
}

export async function pngToIcoJob(file: File, ctx: JobContext): Promise<EngineResult> {
  ctx.progress('decode', 0);
  const decoded = await decodeImage(file, ctx.maxPixels);
  try {
    ctx.check();
    ctx.progress('decode', 1);
    const sizes: number[] = [...ICO_SIZES];
    if (Math.min(decoded.width, decoded.height) >= 256) sizes.push(256);
    const images: { size: number; png: Uint8Array }[] = [];
    for (const [i, size] of sizes.entries()) {
      ctx.check();
      const c = drawContained(decoded.source, size);
      try {
        images.push({ size, png: await bytesOf(await encodeCanvas(c, 'png')) });
      } finally {
        releaseCanvas(c);
      }
      ctx.progress('encode', (i + 1) / sizes.length);
      await ctx.yieldNow();
    }
    ctx.check();
    const blob = new Blob([writeIco(images) as BlobPart], { type: 'image/x-icon' });
    const largest = sizes[sizes.length - 1];
    return {
      blob,
      fileName: convertName(file.name, 'ico'),
      format: 'ico',
      width: largest,
      height: largest,
      inputBytes: file.size,
      outputBytes: blob.size,
      notes: [...decoded.notes],
      ms: ctx.elapsed(),
    };
  } finally {
    decoded.release();
  }
}
