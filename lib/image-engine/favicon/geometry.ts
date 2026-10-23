// Pure layout math for favicons (ENGINE.md §9). No canvas here, so it is unit-tested in Node.
import type { FaviconShape } from '../../types';

export const BASE_SIZE = 512;
/** Sizes that are encoded once and reused for the ICO, the files and the previews. */
export const PNG_SIZES = [16, 32, 48, 180, 192, 512] as const;
export const ICO_SIZES = [16, 32, 48] as const;

export const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Bengali", Arial, sans-serif';
export const EMOJI_STACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

/** Same stack with single quotes so it is safe inside a double-quoted SVG attribute. */
export const svgFontFamily = (stack: string): string => stack.replace(/"/g, "'");

export const clamp = (n: number, min: number, max: number, fallback: number): number =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;

/** Padding as a percentage (0–40) → fraction of the icon size per side. */
export const paddingFraction = (percent: number): number => clamp(percent, 0, 40, 10) / 100;
export const clampZoom = (zoom: number): number => clamp(zoom, 1, 4, 1);

export type ShapeGeometry = { kind: 'rect'; radius: number } | { kind: 'circle' };

export function shapeGeometry(shape: FaviconShape, size: number): ShapeGeometry {
  if (shape === 'circle') return { kind: 'circle' };
  if (shape === 'rounded') return { kind: 'rect', radius: size * 0.2 };
  return { kind: 'rect', radius: 0 };
}

/** Text and emoji are shrunk a little inside round shapes so they do not touch the edge. */
export function shapeInset(shape: FaviconShape): number {
  if (shape === 'circle') return 0.78;
  if (shape === 'rounded') return 0.92;
  return 1;
}

/** Square content box (inside the padding) centered in the icon. */
export function contentBox(
  size: number,
  paddingPercent: number,
): { x: number; y: number; side: number } {
  const side = Math.max(1, size * (1 - 2 * paddingFraction(paddingPercent)));
  return { x: (size - side) / 2, y: (size - side) / 2, side };
}

/** Center square crop of a w×h source at the given zoom (>= 1). */
export function imageCropRect(
  w: number,
  h: number,
  zoom: number,
): { sx: number; sy: number; side: number } {
  const side = Math.max(1, Math.min(w, h) / clampZoom(zoom));
  return { sx: (w - side) / 2, sy: (h - side) / 2, side };
}

/** Largest w×h rectangle that fits the source inside a size×size square, centered. */
export function containRect(
  w: number,
  h: number,
  size: number,
): { x: number; y: number; width: number; height: number } {
  const s = size / Math.max(w, h);
  const width = Math.max(1, Math.round(w * s));
  const height = Math.max(1, Math.round(h * s));
  return { x: Math.round((size - width) / 2), y: Math.round((size - height) / 2), width, height };
}

/** Text bounds measured at a reference font size (canvas TextMetrics, left-aligned, alphabetic). */
export interface GlyphBounds {
  /** actualBoundingBoxLeft: how far the ink extends left of the origin (positive = left). */
  left: number;
  right: number;
  /** Ink above the baseline (positive = up). */
  ascent: number;
  /** Ink below the baseline (positive = down). */
  descent: number;
  /** The font size the bounds were measured at. */
  fontSize: number;
}

export interface TextLayout {
  fontSize: number;
  /** Left origin and baseline so the ink box is centered in the icon. */
  x: number;
  y: number;
}

/** Fits the ink box into the box × box square centered in a size × size icon. */
export function fitText(b: GlyphBounds, size: number, box: number): TextLayout {
  const w = Math.max(0.01, b.left + b.right);
  const h = Math.max(0.01, b.ascent + b.descent);
  const k = Math.min(box / w, box / h); // scale from reference size
  return {
    fontSize: b.fontSize * k,
    x: size / 2 - ((b.right - b.left) / 2) * k,
    y: size / 2 + ((b.ascent - b.descent) / 2) * k,
  };
}

/** Rescales a layout computed for one icon size to another. */
export function scaleLayout(l: TextLayout, factor: number): TextLayout {
  return { fontSize: l.fontSize * factor, x: l.x * factor, y: l.y * factor };
}
