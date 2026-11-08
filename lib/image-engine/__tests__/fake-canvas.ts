// Test helpers: a fake canvas and job context so jobs run in Node without a
// real canvas. Used with vi.mock('../encode') and vi.mock('../decode').
import type { Decoded } from '../decode';
import type { JobContext } from '../run-job';

export interface Op {
  op: string;
  args: unknown[];
  fillStyle?: unknown;
}

export class FakeCanvas {
  ops: Op[] = [];
  constructor(
    public width: number,
    public height: number,
  ) {}
  getContext() {
    return fakeCtx(this);
  }
}

export function fakeCtx(canvas: FakeCanvas) {
  const ctx: Record<string, unknown> = {
    fillStyle: '#000000',
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
  };
  for (const name of ['fillRect', 'drawImage', 'clearRect', 'save', 'restore']) {
    ctx[name] = (...args: unknown[]) =>
      canvas.ops.push({ op: name, args, fillStyle: ctx.fillStyle });
  }
  return ctx;
}

export const allCanvases: FakeCanvas[] = [];

export function makeCanvas(w: number, h: number): FakeCanvas {
  const c = new FakeCanvas(w, h);
  allCanvases.push(c);
  return c;
}

export interface EncodeCall {
  w: number;
  h: number;
  format: string;
  q?: number;
}

/** bytes ≈ pixels × f(quality) + header, like a JPEG encoder. */
export const bytesFor = (w: number, h: number, q = 1) =>
  Math.round(300 + w * h * (0.03 + 1.2 * q ** 3));

export function fakeBlob(size: number, type: string): Blob {
  return { size, type } as unknown as Blob;
}

export function fakeDecoded(width: number, height: number, over: Partial<Decoded> = {}): Decoded {
  return {
    source: makeCanvas(width, height) as unknown as HTMLCanvasElement,
    width,
    height,
    fullWidth: width,
    fullHeight: height,
    kind: 'jpeg',
    hasAlpha: false,
    animated: false,
    notes: [],
    release() {},
    ...over,
  };
}

export function fakeCtxJob(maxPixels = 16_777_216): JobContext {
  return {
    maxPixels,
    progress() {},
    check() {},
    isCancelled: () => false,
    yieldNow: async () => {},
    elapsed: () => 1,
  };
}

export const file = (name: string, size = 500_000, type = 'image/jpeg') =>
  new File([new Uint8Array(size)], name, { type });
