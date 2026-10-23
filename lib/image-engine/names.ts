// Output file naming (ENGINE.md §11).
import type { ImageFormat } from '../types';

export const EXTENSIONS: Record<ImageFormat | 'ico', string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  ico: 'ico',
};

const MAX_BASE = 60;

/** Original name without extension; keeps letters, numbers, dashes and underscores. */
export function sanitizeBase(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^./\\]{1,10}$/, '');
  const clean = withoutExt
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
  const cut = Array.from(clean).slice(0, MAX_BASE).join('').replace(/[-_]+$/, '');
  return cut || 'image';
}

/** 50 → "50kb", 1000 → "1mb", 2000 → "2mb". */
export function sizeLabel(targetKB: number): string {
  if (targetKB >= 1000 && targetKB % 1000 === 0) return `${targetKB / 1000}mb`;
  return `${String(targetKB).replace('.', '_')}kb`;
}

export function compressToSizeName(
  original: string,
  targetKB: number,
  format: ImageFormat,
): string {
  return `${sanitizeBase(original)}-${sizeLabel(targetKB)}.${EXTENSIONS[format]}`;
}

export function convertName(original: string, format: ImageFormat | 'ico'): string {
  return `${sanitizeBase(original)}.${EXTENSIONS[format]}`;
}

export function compressName(original: string, format: ImageFormat): string {
  return `${sanitizeBase(original)}-compressed.${EXTENSIONS[format]}`;
}

/** Makes names unique within one batch: a.jpg, a-2.jpg, a-3.jpg (case-insensitive). */
export function dedupeNames(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let candidate = name;
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${base}-${n}${ext}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
