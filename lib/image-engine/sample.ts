// "Try a sample": draws a photo-like landscape on the device (no network) and
// returns it as a JPG File. Standalone on purpose (no other engine imports) so
// the UI can `import()` it on click as a tiny chunk.

export const SAMPLE_WIDTH = 1600;
export const SAMPLE_HEIGHT = 1067;
export const SAMPLE_QUALITY = 0.92;
export const SAMPLE_NAME = 'sample-photo.jpg';

type Point = [number, number];

export interface HillLayer {
  /** Ridge line from x = 0 to x = width (left to right). */
  ridge: Point[];
  top: string;
  bottom: string;
  /** Per-pixel noise amplitude (0–255 scale) for this layer. */
  grain: number;
}

export interface SamplePlan {
  width: number;
  height: number;
  sky: [number, string][];
  sun: { x: number; y: number; r: number };
  clouds: { x: number; y: number; rx: number; ry: number; alpha: number }[];
  /** Back to front. */
  hills: HillLayer[];
  /** Noise amplitude in the sky. */
  skyGrain: number;
  seed: number;
}

/** Small seeded PRNG (mulberry32) so the sample is the same every time. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pure: everything that will be drawn, in canvas pixels. */
export function buildSamplePlan(
  width = SAMPLE_WIDTH,
  height = SAMPLE_HEIGHT,
  seed = 20261025,
): SamplePlan {
  const rand = prng(seed);
  const layers: { base: number; amp: number; top: string; bottom: string; grain: number }[] = [
    { base: 0.58, amp: 0.1, top: '#7d8fb3', bottom: '#5f7398', grain: 14 },
    { base: 0.7, amp: 0.08, top: '#4f7a5a', bottom: '#33573d', grain: 22 },
    { base: 0.83, amp: 0.06, top: '#3b5f2c', bottom: '#1f3517', grain: 30 },
  ];
  const step = Math.max(4, Math.round(width / 200));
  const hills: HillLayer[] = layers.map((l) => {
    const waves = [0, 1, 2].map((i) => ({
      f: (1.2 + rand() * 1.5) * (i + 1),
      p: rand() * Math.PI * 2,
      a: 1 / (i + 1.4),
    }));
    const ridge: Point[] = [];
    for (let x = 0; x <= width; x += step) {
      const t = x / width;
      let v = 0;
      for (const w of waves) v += w.a * Math.sin(t * Math.PI * w.f + w.p);
      const jitter = (rand() - 0.5) * 0.006;
      const y = (l.base - l.amp * v * 0.5 + jitter) * height;
      ridge.push([x, Math.min(height, Math.max(0, y))]);
    }
    if (ridge[ridge.length - 1][0] !== width) ridge.push([width, ridge[ridge.length - 1][1]]);
    return { ridge, top: l.top, bottom: l.bottom, grain: l.grain };
  });
  const minRidge = Math.min(...hills[0].ridge.map((p) => p[1]));
  const sunR = Math.round(height * 0.06);
  const clouds = Array.from({ length: 5 }, () => ({
    x: rand() * width,
    y: (0.08 + rand() * 0.25) * height,
    rx: (0.08 + rand() * 0.1) * width,
    ry: (0.02 + rand() * 0.025) * height,
    alpha: 0.25 + rand() * 0.3,
  }));
  return {
    width,
    height,
    sky: [
      [0, '#2f6fb3'],
      [0.45, '#79aee0'],
      [0.75, '#f3c99a'],
      [1, '#f7dfc0'],
    ],
    sun: {
      x: Math.round(width * 0.7),
      y: Math.round(Math.min(minRidge - sunR * 1.5, height * 0.35)),
      r: sunR,
    },
    clouds,
    hills,
    skyGrain: 7,
    seed,
  };
}

/** The canvas calls the sample uses (a subset, so tests can stub it). */
export interface SampleCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number): void;
  fill(): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): CanvasGradient;
  getImageData(x: number, y: number, w: number, h: number): ImageData;
  putImageData(d: ImageData, x: number, y: number): void;
}

/** Paints the plan; adds film-like grain so it compresses like a real photo. */
export function paintSample(ctx: SampleCtx, plan: SamplePlan): void {
  const { width: W, height: H } = plan;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of plan.sky) sky.addColorStop(o, c);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const { x, y, r } = plan.sun;
  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 6);
  glow.addColorStop(0, 'rgba(255,240,200,0.75)');
  glow.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff6dc';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  for (const c of plan.clouds) {
    ctx.globalAlpha = c.alpha;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const hill of plan.hills) {
    const top = Math.min(...hill.ridge.map((p) => p[1]));
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, hill.top);
    g.addColorStop(1, hill.bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (const [px, py] of hill.ridge) ctx.lineTo(px, py);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  addGrain(ctx, plan);
}

/** Per-pixel grain: light in the sky, stronger on the nearer hills. */
function addGrain(ctx: SampleCtx, plan: SamplePlan): void {
  const { width: W, height: H } = plan;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const rand = prng(plan.seed ^ 0x9e3779b9);
  // For each column, the y where each hill layer starts.
  const step = plan.hills[0].ridge[1][0] - plan.hills[0].ridge[0][0] || 1;
  const ridgeY = (layer: HillLayer, px: number) => {
    const i = Math.min(layer.ridge.length - 1, Math.floor(px / step));
    return layer.ridge[i][1];
  };
  const starts = plan.hills.map((h) => Float32Array.from({ length: W }, (_, px) => ridgeY(h, px)));
  const layers = plan.hills.length;
  // A table of noise values is much faster than a PRNG call per pixel; a
  // different offset per row hides the repeat. Uint8ClampedArray clamps for us.
  const MASK = 0xffff;
  const table = Float32Array.from({ length: MASK + 1 }, () => rand() - 0.5);
  for (let py = 0; py < H; py++) {
    let j = (py * 7919) & MASK;
    for (let px = 0; px < W; px++, j++) {
      let amp = plan.skyGrain;
      for (let k = layers - 1; k >= 0; k--) {
        if (py >= starts[k][px]) {
          amp = plan.hills[k].grain;
          break;
        }
      }
      const i = (py * W + px) * 4;
      const n = table[j & MASK] * amp;
      const m = table[(j + 32771) & MASK] * amp * 0.4; // a little colour noise
      d[i] += n + m;
      d[i + 1] += n;
      d[i + 2] += n - m;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Draws the sample landscape on this device and returns it as a JPG File. */
export async function makeSampleImage(): Promise<File> {
  const plan = buildSamplePlan();
  let blob: Blob | null;
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(plan.width, plan.height);
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    paintSample(ctx as unknown as SampleCtx, plan);
    blob = await c.convertToBlob({ type: 'image/jpeg', quality: SAMPLE_QUALITY });
    c.width = 0;
    c.height = 0;
  } else {
    const c = document.createElement('canvas');
    c.width = plan.width;
    c.height = plan.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    paintSample(ctx as unknown as SampleCtx, plan);
    blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', SAMPLE_QUALITY));
    c.width = 0;
    c.height = 0;
  }
  if (!blob) throw new Error('Could not make the sample image');
  return new File([blob], SAMPLE_NAME, { type: 'image/jpeg', lastModified: Date.now() });
}
