// High-quality downscale (ENGINE.md §5). Never upscales; keeps aspect ratio.
import { context2d, createCanvas, releaseCanvas, type AnyCanvas } from './encode';

export type DrawSource = ImageBitmap | AnyCanvas;

/** Largest size with the same aspect ratio and at most `maxPixels` pixels. */
export function fitPixels(
  width: number,
  height: number,
  maxPixels: number,
): { width: number; height: number } {
  if (width * height <= maxPixels) return { width, height };
  const s = Math.sqrt(maxPixels / (width * height));
  let w = Math.max(1, Math.floor(width * s));
  let h = Math.max(1, Math.floor(height * s));
  while (w * h > maxPixels) {
    if (w >= h) w--;
    else h--;
  }
  return { width: w, height: h };
}

/** Size for a max width, never upscaling. */
export function fitWidth(
  width: number,
  height: number,
  maxWidth: number,
): { width: number; height: number } {
  if (!(maxWidth > 0) || width <= maxWidth) return { width, height };
  const w = Math.max(1, Math.round(maxWidth));
  return { width: w, height: Math.max(1, Math.round((height * w) / width)) };
}

/**
 * Draws `src` into a new w×h canvas. Reductions bigger than 2× step down by
 * halves first. When `background` is set, it is filled first (alpha flattening).
 */
export function renderScaled(
  src: DrawSource,
  width: number,
  height: number,
  background?: string,
): AnyCanvas {
  const w = Math.max(1, Math.min(Math.round(width), src.width));
  const h = Math.max(1, Math.min(Math.round(height), src.height));

  let current: DrawSource = src;
  let temp: AnyCanvas | null = null;
  let cw = src.width;
  let ch = src.height;

  while (cw > w * 2 && ch > h * 2) {
    const nw = Math.ceil(cw / 2);
    const nh = Math.ceil(ch / 2);
    const next = createCanvas(nw, nh);
    const ctx = context2d(next);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, cw, ch, 0, 0, nw, nh);
    releaseCanvas(temp);
    temp = next;
    current = next;
    cw = nw;
    ch = nh;
  }

  const out = createCanvas(w, h);
  const ctx = context2d(out);
  if (background !== undefined) {
    ctx.fillStyle = '#ffffff'; // used if `background` is not a valid color
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, cw, ch, 0, 0, w, h);
  releaseCanvas(temp);
  return out;
}

/**
 * Caches the halving steps of `renderScaled` so repeated renders of one source
 * at different sizes (compress-to-size) don't redo the expensive big steps.
 * Output is identical to `renderScaled`. Call `release()` when done (the
 * original source is not released).
 */
export class Pyramid {
  private levels: DrawSource[];

  constructor(source: DrawSource) {
    this.levels = [source];
  }

  render(width: number, height: number, background?: string): AnyCanvas {
    const src = this.levels[0];
    const w = Math.max(1, Math.min(Math.round(width), src.width));
    const h = Math.max(1, Math.min(Math.round(height), src.height));
    let i = 0;
    for (;;) {
      const cur = this.levels[i];
      if (!(cur.width > w * 2 && cur.height > h * 2)) break;
      if (!this.levels[i + 1]) {
        const nw = Math.ceil(cur.width / 2);
        const nh = Math.ceil(cur.height / 2);
        const next = createCanvas(nw, nh);
        const ctx = context2d(next);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(cur, 0, 0, cur.width, cur.height, 0, 0, nw, nh);
        this.levels.push(next);
      }
      i++;
    }
    return renderScaled(this.levels[i], w, h, background);
  }

  release(): void {
    for (const level of this.levels.slice(1)) releaseCanvas(level as AnyCanvas);
    this.levels.length = 1;
  }
}
