// Target-size search (ENGINE.md §6). Pure logic: the encoder is injected so
// the search is unit-tested without a canvas.
import { EngineError, cancelled } from './errors';

export type Encoder = (
  width: number,
  height: number,
  quality: number,
) => Promise<{ bytes: number; blob: Blob }>;

export const Q_MAX = 0.92;
export const Q_FLOOR = 0.45;
export const Q_HARD_FLOOR = 0.15;
export const SCALE_STEP = 0.85;
export const MIN_SIDE = 160;
export const MAX_ENCODES = 24;
/** Encodes per quality binary search (ENGINE.md §6 step 3). */
export const SEARCH_ENCODES = 7;
/**
 * Engine addition to step 1 (speed): for images over 2× this many pixels, a
 * ~1 MP probe is encoded at Q_MAX first. If even a conservative extrapolation
 * of it to full size is over the target, the full-size quick check cannot pass
 * and is skipped (it costs ~1 s for JPEG and ~5 s for WebP at 12 MP).
 */
export const PROBE_PIXELS = 1_000_000;
/** Full-size bytes are assumed to be at least this share of probe bytes × pixel ratio. */
export const PROBE_LOWER_BOUND = 0.3;

/**
 * Bytes the output must not exceed: targetKB × 1000 minus a 1% safety margin
 * (at least 200 bytes). Under targetKB × 1000 also means under targetKB × 1024.
 */
export function targetBytesFor(targetKB: number): number {
  const decimal = targetKB * 1000;
  return Math.floor(decimal - Math.max(decimal * 0.01, 200));
}

export interface SearchInput {
  width: number;
  height: number;
  targetBytes: number;
  keepDimensions: boolean;
  encode: Encoder;
  /** Called after every encode with the number of encodes so far. */
  onEncode?: (encodes: number) => void;
  isCancelled?: () => boolean;
  /** Awaited between encodes (main-thread fallback yields to the UI here). */
  yieldFn?: () => Promise<void>;
}

export interface SearchResult {
  blob: Blob;
  bytes: number;
  width: number;
  height: number;
  quality: number;
  scale: number;
  encodes: number;
}

interface Attempt {
  blob: Blob;
  bytes: number;
  width: number;
  height: number;
  quality: number;
  scale: number;
}

const round2 = (q: number) => Math.round(q * 100) / 100;

export async function searchToSize(input: SearchInput): Promise<SearchResult> {
  const { width: W, height: H, targetBytes, keepDimensions, encode } = input;
  if (!(W >= 1 && H >= 1)) throw new EngineError('DECODE_FAILED', 'Image has no pixels');

  const shortSide = Math.min(W, H);
  // Never upscale; never go below MIN_SIDE on the short side (unless the source is smaller).
  const minScale = Math.min(1, MIN_SIDE / shortSide);

  let encodes = 0;
  let smallest: Attempt | null = null;
  // Best passing attempt at the current scale.
  let best: Attempt | null = null;

  const dims = (scale: number) =>
    scale >= 1
      ? { w: W, h: H }
      : { w: Math.max(1, Math.round(W * scale)), h: Math.max(1, Math.round(H * scale)) };

  const budgetLeft = () => MAX_ENCODES - encodes;

  /** Encodes once; returns the attempt or null when the budget is spent. */
  const tryEncode = async (
    scale: number,
    quality: number,
    candidate = true,
  ): Promise<Attempt | null> => {
    if (budgetLeft() <= 0) return null;
    if (input.isCancelled?.()) throw cancelled();
    if (encodes > 0 && input.yieldFn) await input.yieldFn();
    if (input.isCancelled?.()) throw cancelled();
    const { w, h } = dims(scale);
    const out = await encode(w, h, quality);
    encodes++;
    input.onEncode?.(encodes);
    const attempt: Attempt = {
      blob: out.blob,
      bytes: out.bytes,
      width: w,
      height: h,
      quality,
      scale: Math.min(1, scale),
    };
    if (!candidate) return attempt;
    if (!smallest || attempt.bytes < smallest.bytes) smallest = attempt;
    if (attempt.bytes <= targetBytes && (!best || attempt.quality > best.quality)) best = attempt;
    return attempt;
  };

  const done = (a: Attempt): SearchResult => ({
    blob: a.blob,
    bytes: a.bytes,
    width: a.width,
    height: a.height,
    quality: round2(a.quality),
    scale: a.scale,
    encodes,
  });

  const unreachable = (): never => {
    const s = smallest as Attempt | null;
    throw new EngineError(
      'TARGET_UNREACHABLE',
      'This image cannot get under the target size',
      s ? { smallestBytes: s.bytes, width: s.width, height: s.height } : undefined,
    );
  };

  /**
   * Binary search for the highest quality in [lo, hi] that fits at `scale`.
   * `hiKnownFail` skips re-testing `hi`. Returns the bytes of the `lo` attempt
   * when nothing fits (used to estimate the next scale), or null when out of budget.
   */
  const searchQuality = async (
    scale: number,
    lo: number,
    hi: number,
    hiKnownFail: boolean,
  ): Promise<{ found: boolean; loBytes: number | null }> => {
    let calls = 0;
    const step = async (q: number) => {
      if (calls >= SEARCH_ENCODES) return null;
      calls++;
      return tryEncode(scale, q);
    };
    // 1) Is anything in range feasible? Test the low end first.
    const low = await step(lo);
    if (!low) return { found: false, loBytes: null };
    if (low.bytes > targetBytes) return { found: false, loBytes: low.bytes };
    let passQ = lo;
    let failQ = hi;
    // 2) Highest quality first: if it fits, we're done.
    if (!hiKnownFail) {
      const top = await step(hi);
      if (!top) return { found: true, loBytes: low.bytes };
      if (top.bytes <= targetBytes) return { found: true, loBytes: low.bytes };
    }
    // 3) Bisect between a passing and a failing quality.
    while (failQ - passQ > 0.011) {
      const mid = round2((passQ + failQ) / 2);
      if (mid <= passQ || mid >= failQ) break;
      const a = await step(mid);
      if (!a) break;
      if (a.bytes <= targetBytes) passQ = mid;
      else failQ = mid;
    }
    return { found: true, loBytes: low.bytes };
  };

  // Step 1: quick check at full size, best quality (skipped when a probe shows it can't pass).
  let bpp: number | null = null;
  let fullTested = false;
  if (W * H > 2 * PROBE_PIXELS) {
    const probeScale = Math.sqrt(PROBE_PIXELS / (W * H));
    // With keepDimensions a scaled probe is never a valid output or "smallest" size.
    const probe = await tryEncode(probeScale, Q_MAX, !keepDimensions);
    if (!probe) return unreachable();
    const probePixels = probe.width * probe.height;
    if (probe.bytes * ((W * H) / probePixels) * PROBE_LOWER_BOUND > targetBytes) {
      bpp = probe.bytes / probePixels;
    }
  }
  if (bpp === null) {
    const first = await tryEncode(1, Q_MAX);
    if (!first) return unreachable();
    if (first.bytes <= targetBytes) return done(first);
    bpp = first.bytes / (W * H);
    fullTested = true;
  }

  // Step 2: starting scale from bytes-per-pixel at Q_MAX.
  let scale = 1;
  if (!keepDimensions) {
    const allowed = targetBytes / (bpp * 0.45);
    if (allowed < W * H) scale = Math.max(Math.sqrt(allowed / (W * H)), minScale);
  }

  // Steps 3–5: quality search in [Q_FLOOR, Q_MAX], shrinking when nothing fits.
  for (;;) {
    best = null;
    const r = await searchQuality(scale, Q_FLOOR, Q_MAX, scale === 1 && fullTested);
    if (best) return done(best);
    if (r.loBytes === null) break; // budget spent
    if (keepDimensions || scale <= minScale) break;
    // Shrink by at least SCALE_STEP; jump further when the floor attempt says we need to.
    const needed = Math.sqrt(targetBytes / r.loBytes);
    const next = Math.max(scale * Math.min(SCALE_STEP, needed), minScale);
    if (next >= scale) break;
    scale = next;
  }

  // Step 6: last resort, lower quality at the current (smallest) size.
  if (budgetLeft() > 0) {
    best = null;
    await searchQuality(scale, Q_HARD_FLOOR, Q_FLOOR, true);
    if (best) return done(best);
  }

  // Steps 7–8: nothing fits.
  return unreachable();
}
