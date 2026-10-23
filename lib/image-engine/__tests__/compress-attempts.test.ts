import { describe, expect, it } from 'vitest';
import { RETRY_MIN_QUALITY, runCompressAttempts } from '../compress-attempts';

function fake(sizeFor: (q: number | undefined) => number) {
  const calls: (number | undefined)[] = [];
  const encode = async (q: number | undefined) => {
    calls.push(q);
    return { size: sizeFor(q), q };
  };
  return { encode, calls };
}

describe('runCompressAttempts', () => {
  it('returns the first encode when it is already smaller', async () => {
    const { encode, calls } = fake(() => 500);
    const r = await runCompressAttempts(encode, 0.8, 1000);
    expect(r.notSmaller).toBe(false);
    expect(r.out.size).toBe(500);
    expect(r.quality).toBe(0.8);
    expect(calls).toEqual([0.8]);
  });

  it('retries lower qualities and stops at the first smaller result', async () => {
    const { encode, calls } = fake((q) => Math.round((q ?? 1) * 1500));
    const r = await runCompressAttempts(encode, 0.8, 1000);
    // 0.8→1200, 0.7→1050, 0.6→900 (smaller, stop)
    expect(calls).toEqual([0.8, 0.7, 0.6]);
    expect(r.quality).toBe(0.6);
    expect(r.out.size).toBe(900);
    expect(r.notSmaller).toBe(false);
  });

  it('flags not-smaller and returns the smallest attempt when nothing beats the input', async () => {
    const sizes: Record<string, number> = { '0.8': 1300, '0.7': 1100, '0.6': 1150, '0.5': 1200 };
    const { encode, calls } = fake((q) => sizes[String(q)]);
    const r = await runCompressAttempts(encode, 0.8, 1000);
    expect(calls).toEqual([0.8, 0.7, 0.6, 0.5]);
    expect(r.notSmaller).toBe(true);
    expect(r.out.size).toBe(1100);
    expect(r.quality).toBe(0.7);
  });

  it('treats an equal size as not smaller', async () => {
    const { encode } = fake(() => 1000);
    const r = await runCompressAttempts(encode, 0.5, 1000);
    expect(r.notSmaller).toBe(true);
    expect(r.quality).toBe(0.5); // ties keep the earlier, higher quality
  });

  it('never retries below the minimum quality', async () => {
    const { encode, calls } = fake(() => 2000);
    await runCompressAttempts(encode, 0.45, 1000);
    expect(calls).toEqual([0.45, 0.35]);
    expect(calls.every((q) => q === undefined || q >= RETRY_MIN_QUALITY)).toBe(true);
  });

  it('lossless (PNG) does a single encode and flags not-smaller when bigger', async () => {
    const { encode, calls } = fake(() => 5000);
    const r = await runCompressAttempts(encode, undefined, 1000);
    expect(calls).toEqual([undefined]);
    expect(r.notSmaller).toBe(true);
    expect(r.quality).toBeUndefined();
  });

  it('calls beforeRetry before each retry only', async () => {
    let n = 0;
    const { encode } = fake(() => 2000);
    await runCompressAttempts(encode, 0.9, 1000, () => {
      n++;
    });
    expect(n).toBe(3);
  });
});
