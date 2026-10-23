// Favicon options: defaults, validation, "remember per tool" (PRODUCT.md §4.5)
// and the mapping to the engine's FaviconSource. Every storage call is in try/catch.
import type { FaviconShape, FaviconSource, ToolDefinition } from '@/lib/types';

export type FaviconMode = 'image' | 'text' | 'emoji';
export type Weight = 400 | 600 | 800;

/** Default icon color (the brand primary). A data value for the engine, not styling. */
export const BRAND_COLOR = '#4338ca';

export interface ImageOpts {
  zoom: number; // 1–4
  padding: number; // 0–40 (%)
  transparent: boolean;
  background: string;
  shape: FaviconShape;
}
export interface TextOpts {
  text: string;
  weight: Weight;
  color: string;
  background: string;
  shape: FaviconShape;
  padding: number;
}
export interface EmojiOpts {
  emoji: string;
  transparent: boolean;
  background: string;
  shape: FaviconShape;
  padding: number;
}
export interface FaviconOptions {
  image: ImageOpts;
  text: TextOpts;
  emoji: EmojiOpts;
}

export const ZOOM = { min: 1, max: 4, step: 0.05 } as const;
export const PADDING = { min: 0, max: 40, step: 1 } as const;
export const MAX_TEXT = 3;
export const QUICK_EMOJI = [
  { value: '🙂', name: 'Smile' },
  { value: '🚀', name: 'Rocket' },
  { value: '⭐', name: 'Star' },
  { value: '❤️', name: 'Heart' },
  { value: '🔥', name: 'Fire' },
  { value: '🌿', name: 'Leaf' },
  { value: '☕', name: 'Coffee' },
  { value: '🎵', name: 'Music' },
] as const;

export function defaultFaviconOptions(): FaviconOptions {
  return {
    image: { zoom: 1, padding: 0, transparent: true, background: '#ffffff', shape: 'rounded' },
    text: {
      text: 'A',
      weight: 800,
      color: '#ffffff',
      background: BRAND_COLOR,
      shape: 'rounded',
      padding: 10,
    },
    emoji: { emoji: '🙂', transparent: true, background: '#ffffff', shape: 'rounded', padding: 8 },
  };
}

export function modeForTool(tool: ToolDefinition): FaviconMode {
  if (tool.kind === 'favicon-text') return 'text';
  if (tool.kind === 'favicon-emoji') return 'emoji';
  return 'image';
}

/* ── Graphemes (one emoji, 1–3 characters) ───────────────────────── */

let segmenter: Intl.Segmenter | null | undefined;

/** Split into user-perceived characters; falls back to code points. */
export function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    try {
      segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    } catch {
      segmenter = null;
    }
  }
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

/** Keep at most `max` graphemes, from the start (text) or the end (emoji: newest wins). */
export function limitGraphemes(text: string, max: number, keep: 'first' | 'last'): string {
  const list = graphemes(text.replace(/\s+/g, ' ').trimStart());
  return (keep === 'first' ? list.slice(0, max) : list.slice(-max)).join('');
}

/* ── Remembered options ──────────────────────────────────────────── */

export function storageKey(tool: ToolDefinition): string {
  return `img-master:options:${tool.slug}`;
}

export function readStoredRaw(tool: ToolDefinition): string | null {
  try {
    return window.localStorage.getItem(storageKey(tool));
  } catch {
    return null;
  }
}

const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isShape = (v: unknown): v is FaviconShape =>
  v === 'square' || v === 'rounded' || v === 'circle';
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Merge stored JSON over the defaults, keeping only valid values. */
export function mergeStored(base: FaviconOptions, raw: string | null): FaviconOptions {
  if (!raw) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!isRecord(data)) return base;
  const out: FaviconOptions = {
    image: { ...base.image },
    text: { ...base.text },
    emoji: { ...base.emoji },
  };

  const i = data.image;
  if (isRecord(i)) {
    if (inRange(i.zoom, ZOOM.min, ZOOM.max)) out.image.zoom = i.zoom;
    if (inRange(i.padding, PADDING.min, PADDING.max)) out.image.padding = i.padding;
    if (typeof i.transparent === 'boolean') out.image.transparent = i.transparent;
    if (isColor(i.background)) out.image.background = i.background;
    if (isShape(i.shape)) out.image.shape = i.shape;
  }
  const t = data.text;
  if (isRecord(t)) {
    if (typeof t.text === 'string') {
      const v = limitGraphemes(t.text, MAX_TEXT, 'first');
      if (v) out.text.text = v;
    }
    if (t.weight === 400 || t.weight === 600 || t.weight === 800) out.text.weight = t.weight;
    if (isColor(t.color)) out.text.color = t.color;
    if (isColor(t.background)) out.text.background = t.background;
    if (isShape(t.shape)) out.text.shape = t.shape;
    if (inRange(t.padding, PADDING.min, PADDING.max)) out.text.padding = t.padding;
  }
  const e = data.emoji;
  if (isRecord(e)) {
    if (typeof e.emoji === 'string') {
      const v = limitGraphemes(e.emoji, 1, 'last');
      if (v) out.emoji.emoji = v;
    }
    if (typeof e.transparent === 'boolean') out.emoji.transparent = e.transparent;
    if (isColor(e.background)) out.emoji.background = e.background;
    if (isShape(e.shape)) out.emoji.shape = e.shape;
    if (inRange(e.padding, PADDING.min, PADDING.max)) out.emoji.padding = e.padding;
  }
  return out;
}

export function saveOptions(tool: ToolDefinition, o: FaviconOptions): void {
  try {
    window.localStorage.setItem(storageKey(tool), JSON.stringify(o));
  } catch {
    // Private mode or storage full: the tool still works, it just won't remember.
  }
}

/* ── Engine input ────────────────────────────────────────────────── */

/** The engine source for the current mode, or null when there is nothing valid to draw. */
export function buildSource(
  mode: FaviconMode,
  o: FaviconOptions,
  file: File | null,
): FaviconSource | null {
  if (mode === 'image') {
    if (!file) return null;
    const v = o.image;
    return {
      mode: 'image',
      file,
      zoom: v.zoom,
      padding: v.padding,
      background: v.transparent ? 'transparent' : v.background,
      shape: v.shape,
    };
  }
  if (mode === 'text') {
    const v = o.text;
    if (v.text.trim() === '') return null;
    return {
      mode: 'text',
      text: v.text,
      fontWeight: v.weight,
      color: v.color,
      background: v.background,
      shape: v.shape,
      padding: v.padding,
    };
  }
  const v = o.emoji;
  if (v.emoji === '') return null;
  return {
    mode: 'emoji',
    emoji: v.emoji,
    background: v.transparent ? 'transparent' : v.background,
    shape: v.shape,
    padding: v.padding,
  };
}
