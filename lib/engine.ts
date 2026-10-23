// The one place the UI gets the image engine from. Owned by the lead.
// The engine is loaded lazily on first use so it stays out of first-load JS.
//
// Phase 2+: the real engine. To build UI without it, point this at
// `./image-engine/mock` (`m.mockEngine`); nothing else changes.
import type { ImageEngine } from './types';

let enginePromise: Promise<ImageEngine> | null = null;

export function loadEngine(): Promise<ImageEngine> {
  enginePromise ??= import('./image-engine').then((m) => m.imageEngine);
  return enginePromise;
}
