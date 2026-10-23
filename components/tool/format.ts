// Number formatting for results. Decimal units (1 KB = 1000 bytes), always
// rounded DOWN so a 49,800-byte file never shows as "50 KB" next to a 50KB target.
import type { ImageFormat } from '@/lib/types';

function floorTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.floor(n * f) / f;
}

/** 48213 → "48 KB", 2412345 → "2.4 MB", 9876 → "9.8 KB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  if (bytes < 1_000_000) {
    const kb = bytes / 1000;
    return `${kb < 10 ? floorTo(kb, 1) : Math.floor(kb)} KB`;
  }
  const mb = bytes / 1_000_000;
  return `${mb < 10 ? floorTo(mb, 1) : Math.floor(mb)} MB`;
}

/** Target for sentences: 50 → "50 KB", 1000 → "1 MB". */
export function targetText(kb: number): string {
  return kb >= 1000 && kb % 100 === 0 ? `${kb / 1000} MB` : `${kb} KB`;
}

/** Target for chips: 50 → "50KB", 1000 → "1MB". */
export function targetChip(kb: number): string {
  return kb >= 1000 && kb % 100 === 0 ? `${kb / 1000}MB` : `${kb}KB`;
}

/** Percent change from input to output; positive means smaller. */
export function percentSmaller(inputBytes: number, outputBytes: number): number {
  if (inputBytes <= 0) return 0;
  const p = Math.round((1 - outputBytes / inputBytes) * 100);
  // Never claim 100% smaller, and don't show 0% when something did change.
  if (p >= 100) return 99;
  return p;
}

export const FORMAT_LABEL: Record<ImageFormat | 'ico', string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  ico: 'ICO',
};

export const FORMAT_MIME: Record<ImageFormat | 'ico', string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  ico: 'image/x-icon',
};

/**
 * Makes names unique within one batch, case-insensitive, suffix before the
 * extension: photo.jpg, Photo.jpg, photo.jpg → photo.jpg, Photo-2.jpg, photo-3.jpg.
 * Downloads, Share and the ZIP all use these names.
 */
export function uniqueNames(names: readonly string[]): string[] {
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
