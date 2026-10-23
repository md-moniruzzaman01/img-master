// Canvas drawing for favicons (ENGINE.md §9). Geometry lives in geometry.ts.
import type { FaviconShape } from '../../types';
import { context2d, createCanvas, releaseCanvas, type AnyCanvas, type Ctx2D } from '../encode';
import { renderScaled, type DrawSource } from '../resize';
import {
  BASE_SIZE,
  EMOJI_STACK,
  FONT_STACK,
  containRect,
  contentBox,
  fitText,
  imageCropRect,
  scaleLayout,
  shapeGeometry,
  shapeInset,
  type GlyphBounds,
  type TextLayout,
} from './geometry';
import type { FaviconSpec } from './package';

const REF_FONT_SIZE = 200;

type PathCtx = Pick<Ctx2D, 'beginPath' | 'moveTo' | 'arcTo' | 'arc' | 'closePath'>;

/** Traces the shape path (no roundRect: older Safari lacks it). */
export function traceShape(ctx: PathCtx, shape: FaviconShape, size: number): void {
  const g = shapeGeometry(shape, size);
  ctx.beginPath();
  if (g.kind === 'circle') {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (g.radius <= 0) {
    ctx.moveTo(0, 0);
    ctx.arcTo(size, 0, size, size, 0);
    ctx.arcTo(size, size, 0, size, 0);
    ctx.arcTo(0, size, 0, 0, 0);
    ctx.arcTo(0, 0, size, 0, 0);
  } else {
    const r = g.radius;
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
  }
  ctx.closePath();
}

/** Clips to the shape and fills the background. The caller must `ctx.restore()`. */
function beginIcon(ctx: Ctx2D, spec: FaviconSpec, size: number): void {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  traceShape(ctx, spec.shape, size);
  ctx.clip();
  if (spec.background !== 'transparent') {
    ctx.fillStyle = spec.background;
    ctx.fillRect(0, 0, size, size);
  }
}

const stackFor = (spec: FaviconSpec) => (spec.mode === 'emoji' ? EMOJI_STACK : FONT_STACK);
const fontFor = (spec: FaviconSpec, px: number) =>
  `${spec.mode === 'emoji' ? 400 : spec.fontWeight} ${px}px ${stackFor(spec)}`;

/** Measures the ink bounds of the text at a reference size. */
export function measureGlyphs(spec: FaviconSpec): GlyphBounds {
  const c = createCanvas(8, 8);
  try {
    const ctx = context2d(c);
    ctx.font = fontFor(spec, REF_FONT_SIZE);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(spec.text);
    let { actualBoundingBoxLeft: left, actualBoundingBoxRight: right } = m;
    let { actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent } = m;
    if (!(right + left > 0) || !(ascent + descent > 0)) {
      // Engines without ink bounds: approximate from the advance width.
      left = 0;
      right = m.width || REF_FONT_SIZE * 0.6;
      ascent = REF_FONT_SIZE * 0.75;
      descent = 0;
    }
    return { left, right, ascent, descent, fontSize: REF_FONT_SIZE };
  } finally {
    releaseCanvas(c);
  }
}

/** Text layout in the 512 × 512 space (also used for the SVG). */
export function glyphLayout(spec: FaviconSpec): TextLayout {
  const box = contentBox(BASE_SIZE, spec.padding).side * shapeInset(spec.shape);
  return fitText(measureGlyphs(spec), BASE_SIZE, box);
}

/** Draws a text or emoji icon straight at `size` px (crisp at 16 and 32). */
export function drawGlyphIcon(spec: FaviconSpec, layout512: TextLayout, size: number): AnyCanvas {
  const canvas = createCanvas(size, size);
  try {
    const ctx = context2d(canvas);
    beginIcon(ctx, spec, size);
    const l = scaleLayout(layout512, size / BASE_SIZE);
    ctx.font = fontFor(spec, l.fontSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = spec.mode === 'text' ? spec.color : '#000000';
    ctx.fillText(spec.text, l.x, l.y);
    ctx.restore();
    return canvas;
  } catch (e) {
    releaseCanvas(canvas);
    throw e;
  }
}

/** Draws the center square crop of an image into a `size` px icon. */
export function drawImageIcon(source: DrawSource, spec: FaviconSpec, size: number): AnyCanvas {
  const box = contentBox(size, spec.padding);
  const crop = imageCropRect(source.width, source.height, spec.zoom);
  let from: DrawSource = source;
  let sx = crop.sx;
  let sy = crop.sy;
  let side = crop.side;
  let temp: AnyCanvas | null = null;
  let stepped: AnyCanvas | null = null;
  const canvas = createCanvas(size, size);
  try {
    if (side > box.side * 2) {
      // Big photo: copy the crop 1:1, then step it down for quality.
      const w = Math.max(1, Math.round(side));
      temp = createCanvas(w, w);
      const tctx = context2d(temp);
      tctx.drawImage(source, sx, sy, side, side, 0, 0, w, w);
      stepped = renderScaled(temp, Math.ceil(box.side), Math.ceil(box.side));
      releaseCanvas(temp);
      temp = null;
      from = stepped;
      sx = 0;
      sy = 0;
      side = stepped.width;
    }
    const ctx = context2d(canvas);
    beginIcon(ctx, spec, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(from, sx, sy, side, side, box.x, box.y, box.side, box.side);
    ctx.restore();
    return canvas;
  } catch (e) {
    releaseCanvas(canvas);
    throw e;
  } finally {
    releaseCanvas(temp);
    releaseCanvas(stepped);
  }
}

/** Draws the whole source, centered, inside a transparent size × size square (PNG → ICO). */
export function drawContained(source: DrawSource, size: number): AnyCanvas {
  const r = containRect(source.width, source.height, size);
  let pre: DrawSource = source;
  let scaled: AnyCanvas | null = null;
  const canvas = createCanvas(size, size);
  try {
    if (source.width > r.width && source.height > r.height) {
      scaled = renderScaled(source, r.width, r.height);
      pre = scaled;
    }
    const ctx = context2d(canvas);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pre, 0, 0, pre.width, pre.height, r.x, r.y, r.width, r.height);
    return canvas;
  } catch (e) {
    releaseCanvas(canvas);
    throw e;
  } finally {
    releaseCanvas(scaled);
  }
}
