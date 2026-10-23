// The one place the UI gets the image engine from. Owned by the lead.
// The engine is loaded lazily on first use so it stays out of first-load JS.
//
// Phase 0–1: mock engine. Phase 2: the lead swaps the import below for the
// real engine (`./image-engine`), and nothing else changes.
import type { ImageEngine } from './types';

let enginePromise: Promise<ImageEngine> | null = null;

export function loadEngine(): Promise<ImageEngine> {
  enginePromise ??= import('./image-engine/mock').then((m) => m.mockEngine);
  return enginePromise;
}
