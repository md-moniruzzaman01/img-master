import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SAMPLE_HEIGHT,
  SAMPLE_NAME,
  SAMPLE_QUALITY,
  SAMPLE_WIDTH,
  buildSamplePlan,
  makeSampleImage,
  prng,
} from '../sample';

describe('buildSamplePlan', () => {
  const plan = buildSamplePlan();

  it('is about 1600 × 1067 (3:2)', () => {
    expect([plan.width, plan.height]).toEqual([1600, 1067]);
    expect([SAMPLE_WIDTH, SAMPLE_HEIGHT]).toEqual([1600, 1067]);
  });
  it('is deterministic', () => {
    expect(buildSamplePlan()).toEqual(plan);
    expect(buildSamplePlan(1600, 1067, 1)).not.toEqual(plan);
  });
  it('has a sky gradient, a sun above the hills and three hill layers', () => {
    expect(plan.sky.length).toBeGreaterThanOrEqual(2);
    expect(plan.sky[0][0]).toBe(0);
    expect(plan.sky[plan.sky.length - 1][0]).toBe(1);
    expect(plan.hills).toHaveLength(3);
    const topOf = (i: number) => Math.min(...plan.hills[i].ridge.map((p) => p[1]));
    expect(plan.sun.y + plan.sun.r).toBeLessThan(topOf(0));
    expect(plan.sun.y - plan.sun.r).toBeGreaterThan(0);
  });
  it('hill ridges span the width, stay in bounds and get nearer (lower) front to back', () => {
    const avg = (i: number) =>
      plan.hills[i].ridge.reduce((s, p) => s + p[1], 0) / plan.hills[i].ridge.length;
    for (const h of plan.hills) {
      expect(h.ridge[0][0]).toBe(0);
      expect(h.ridge[h.ridge.length - 1][0]).toBe(plan.width);
      for (const [x, y] of h.ridge) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(plan.height);
      }
    }
    expect(avg(0)).toBeLessThan(avg(1));
    expect(avg(1)).toBeLessThan(avg(2));
    // Nearer hills get more grain (texture), the sky the least.
    expect(plan.skyGrain).toBeLessThan(plan.hills[0].grain);
    expect(plan.hills[0].grain).toBeLessThan(plan.hills[2].grain);
  });
  it('prng gives values in [0, 1)', () => {
    const r = prng(5);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('makeSampleImage (stubbed OffscreenCanvas)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('draws at 1600 × 1067 and returns sample-photo.jpg as image/jpeg', async () => {
    const seen: { w: number; h: number; type?: string; quality?: number; puts: number } = {
      w: 0,
      h: 0,
      puts: 0,
    };
    const gradient = { addColorStop() {} };
    class FakeOffscreen {
      constructor(
        public width: number,
        public height: number,
      ) {
        seen.w = width;
        seen.h = height;
      }
      getContext() {
        const noop = () => {};
        return {
          fillStyle: '',
          globalAlpha: 1,
          fillRect: noop,
          beginPath: noop,
          moveTo: noop,
          lineTo: noop,
          closePath: noop,
          arc: noop,
          ellipse: noop,
          fill: noop,
          createLinearGradient: () => gradient,
          createRadialGradient: () => gradient,
          getImageData: (_x: number, _y: number, w: number, h: number) => ({
            data: new Uint8ClampedArray(w * h * 4).fill(128),
            width: w,
            height: h,
          }),
          putImageData: () => {
            seen.puts++;
          },
        };
      }
      async convertToBlob(o: { type: string; quality: number }) {
        seen.type = o.type;
        seen.quality = o.quality;
        return new Blob([new Uint8Array(400_000)], { type: o.type });
      }
    }
    vi.stubGlobal('OffscreenCanvas', FakeOffscreen);
    const f = await makeSampleImage();
    expect(f).toBeInstanceOf(File);
    expect(f.name).toBe(SAMPLE_NAME);
    expect(f.name).toBe('sample-photo.jpg');
    expect(f.type).toBe('image/jpeg');
    expect(f.size).toBe(400_000);
    expect([seen.w, seen.h]).toEqual([1600, 1067]);
    expect(seen.type).toBe('image/jpeg');
    expect(seen.quality).toBe(SAMPLE_QUALITY);
    expect(seen.puts).toBe(1); // grain applied once
  });
});
