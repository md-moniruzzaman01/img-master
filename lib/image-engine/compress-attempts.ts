// Pure attempt logic for quality compression (ENGINE.md §8). No canvas here, so it is unit-tested
// with a fake encoder.

/** Lower qualities tried when the first result is not smaller than the input. */
export const RETRY_STEPS = [0.1, 0.2, 0.3];
export const RETRY_MIN_QUALITY = 0.3;

/** Encodes the (already rendered) image at a quality; `undefined` means lossless. */
export type AttemptEncoder<T extends { size: number }> = (quality: number | undefined) => Promise<T>;

export interface AttemptResult<T> {
  out: T;
  quality: number | undefined;
  /** True when no attempt was smaller than the input. `out` is then the smallest attempt. */
  notSmaller: boolean;
}

/**
 * Encode at the chosen quality. If that is not smaller than the input and the format is lossy,
 * retry at a few lower qualities (never below RETRY_MIN_QUALITY) and stop at the first smaller one.
 * Returns the smallest attempt (ties keep the earlier, higher-quality one).
 */
export async function runCompressAttempts<T extends { size: number }>(
  encode: AttemptEncoder<T>,
  startQuality: number | undefined,
  inputBytes: number,
  beforeRetry?: () => Promise<void> | void,
): Promise<AttemptResult<T>> {
  let out = await encode(startQuality);
  let quality = startQuality;
  if (startQuality !== undefined && out.size >= inputBytes) {
    for (const step of RETRY_STEPS) {
      const q = Math.round((startQuality - step) * 100) / 100;
      if (q < RETRY_MIN_QUALITY) break;
      if (beforeRetry) await beforeRetry();
      const b = await encode(q);
      if (b.size < out.size) {
        out = b;
        quality = q;
      }
      if (b.size < inputBytes) break;
    }
  }
  return { out, quality, notSmaller: out.size >= inputBytes };
}
