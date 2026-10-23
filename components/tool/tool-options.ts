// Tool options: defaults from the registry preset, plus "remember last options
// per tool" in localStorage (PRODUCT.md §4.5). Every storage call is in try/catch.
import type { ImageFormat, ToolDefinition } from '@/lib/types';

export const SIZE_PRESETS = [20, 50, 100, 200, 500, 1000] as const;
export const MAX_WIDTHS = [0, 1920, 1280, 800] as const; // 0 = original

export interface ToolOptions {
  /** compress hub only. */
  mode: 'size' | 'quality';
  /** Target in decimal KB (compress-to-size and size mode). */
  targetKB: number;
  /** True when the target came from the Custom field. */
  custom: boolean;
  /** Output for size targets. */
  sizeFormat: 'jpeg' | 'webp';
  keepDimensions: boolean;
  /** 10–100, compress quality mode. */
  quality: number;
  /** 0 = keep original width. */
  maxWidth: number;
  /** Converter output. */
  convertTo: ImageFormat;
  /** 10–100, converter quality for JPG/WebP. */
  convertQuality: number;
  /** Fill for transparent areas going to JPG. */
  background: string;
}

export function defaultOptions(tool: ToolDefinition): ToolOptions {
  const p = tool.preset;
  const pct = (q: number | undefined, fallback: number) =>
    q === undefined ? fallback : Math.round(q * 100);
  return {
    mode: tool.kind === 'compress' ? 'quality' : 'size',
    targetKB: p.targetKB ?? 100,
    custom: false,
    sizeFormat: p.to === 'webp' ? 'webp' : 'jpeg',
    keepDimensions: false,
    quality: tool.kind === 'compress' ? pct(p.quality, 75) : 75,
    maxWidth: 0,
    convertTo: p.to ?? 'jpeg',
    convertQuality: tool.kind === 'convert' ? pct(p.quality, 90) : 90,
    background: '#ffffff',
  };
}

/** Which options are remembered for each kind of tool. */
function rememberedKeys(tool: ToolDefinition): (keyof ToolOptions)[] {
  switch (tool.kind) {
    case 'compress-to-size':
      // The page's own size always wins on a size page (PRODUCT.md §5.1).
      return ['sizeFormat', 'keepDimensions', 'background'];
    case 'compress':
      return ['mode', 'targetKB', 'custom', 'sizeFormat', 'keepDimensions', 'quality', 'maxWidth'];
    case 'convert':
      return tool.preset.from === 'any'
        ? ['convertTo', 'convertQuality', 'background']
        : ['convertQuality', 'background'];
    default:
      return [];
  }
}

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

const FORMATS: readonly string[] = ['jpeg', 'png', 'webp'];
const isColor = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const inRange = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Merge stored JSON over the defaults, keeping only valid, remembered values. */
export function mergeStored(
  tool: ToolDefinition,
  base: ToolOptions,
  raw: string | null,
): ToolOptions {
  if (!raw) return base;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return base;
  }
  if (!data || typeof data !== 'object') return base;
  const out: ToolOptions = { ...base };
  for (const key of rememberedKeys(tool)) {
    const v = data[key];
    switch (key) {
      case 'mode':
        if (v === 'size' || v === 'quality') out.mode = v;
        break;
      case 'targetKB':
        if (inRange(v, 1, 50_000)) out.targetKB = v as number;
        break;
      case 'custom':
      case 'keepDimensions':
        if (typeof v === 'boolean') out[key] = v;
        break;
      case 'sizeFormat':
        if (v === 'jpeg' || v === 'webp') out.sizeFormat = v;
        break;
      case 'quality':
      case 'convertQuality':
        if (inRange(v, 10, 100)) out[key] = v as number;
        break;
      case 'maxWidth':
        if ((MAX_WIDTHS as readonly number[]).includes(v as number)) out.maxWidth = v as number;
        break;
      case 'convertTo':
        if (typeof v === 'string' && FORMATS.includes(v)) out.convertTo = v as ImageFormat;
        break;
      case 'background':
        if (isColor(v)) out.background = v as string;
        break;
    }
  }
  return out;
}

export function saveOptions(tool: ToolDefinition, o: ToolOptions): void {
  const data: Partial<Record<keyof ToolOptions, unknown>> = {};
  for (const key of rememberedKeys(tool)) data[key] = o[key];
  try {
    window.localStorage.setItem(storageKey(tool), JSON.stringify(data));
  } catch {
    // Private mode or storage full: the tool still works, it just won't remember.
  }
}

/** Is the current output lossy (so a quality slider makes sense)? */
export function isLossy(format: ImageFormat): boolean {
  return format === 'jpeg' || format === 'webp';
}

/** Next size to suggest after TARGET_UNREACHABLE. */
export function nextTarget(currentKB: number, smallestBytes?: number): number {
  const needKB = smallestBytes ? smallestBytes / 1000 : currentKB;
  const preset = SIZE_PRESETS.find((p) => p > currentKB && p >= needKB);
  if (preset) return preset;
  const step = needKB >= 1000 ? 500 : 50;
  return Math.max(currentKB * 2, Math.ceil(needKB / step) * step);
}
