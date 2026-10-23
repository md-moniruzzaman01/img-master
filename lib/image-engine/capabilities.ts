// Main-thread feature detection (ENGINE.md §3). The worker-dependent parts
// (workerCanvas, encodeWebp) come from the worker probe in client.ts.
// Kept tiny: this file is part of the main-thread bundle.

export const MAX_PIXELS = 16_777_216; // 4096 × 4096, Safari's canvas area limit
export const LOW_MEMORY_MAX_PIXELS = 8_000_000;

type NavigatorExtras = Navigator & { deviceMemory?: number };

function nav(): NavigatorExtras | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as NavigatorExtras);
}

export function deviceMemory(): number | undefined {
  const m = nav()?.deviceMemory;
  return typeof m === 'number' ? m : undefined;
}

export function maxPixels(): number {
  const m = deviceMemory();
  return m !== undefined && m <= 2 ? LOW_MEMORY_MAX_PIXELS : MAX_PIXELS;
}

/** 1 worker on small devices, otherwise 2 (ENGINE.md §10). */
export function poolSize(): number {
  const cores = nav()?.hardwareConcurrency ?? 2;
  const m = deviceMemory();
  return cores <= 4 || (m !== undefined && m <= 2) ? 1 : 2;
}

export function hasOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

export function canShareFiles(): boolean {
  try {
    const n = nav();
    return (
      typeof n?.canShare === 'function' &&
      n.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })
    );
  } catch {
    return false;
  }
}
