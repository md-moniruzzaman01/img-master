// Mock ImageEngine for building the UI before the real engine exists.
// Written by the lead in Phase 0. Fake delays, realistic fake sizes.
//
// Important for UI work:
// - `result.blob` is the ORIGINAL file (so thumbnails and downloads still open),
//   but `result.outputBytes` is the fake compressed size. Always display
//   `outputBytes`, never `blob.size`.
// - Trigger error states with the file name:
//     contains "fail"    -> DECODE_FAILED
//     contains "huge"    -> TARGET_UNREACHABLE (compressToSize)
//     contains "nowebp"  -> ENCODE_UNSUPPORTED (when the output is WebP)
//     contains "big"     -> adds the 'downscaled-for-memory' note
//     non-image type     -> UNSUPPORTED_FORMAT
import type {
  Capabilities,
  CompressOptions,
  CompressToSizeOptions,
  ConvertOptions,
  EngineErrorCode,
  EngineErrorDetail,
  EngineErrorShape,
  EngineNote,
  EngineResult,
  FaviconPackage,
  FaviconSource,
  ImageEngine,
  ImageFormat,
  JobHandle,
  ProgressFn,
} from '../types';

class MockEngineError extends Error implements EngineErrorShape {
  override name = 'EngineError' as const;
  constructor(
    public code: EngineErrorCode,
    message: string,
    public detail?: EngineErrorDetail,
  ) {
    super(message);
  }
}

const EXT: Record<ImageFormat | 'ico', string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  ico: 'ico',
};

function baseName(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'image';
}

function sizeLabel(targetKB: number): string {
  return targetKB >= 1000 && targetKB % 1000 === 0 ? `${targetKB / 1000}mb` : `${targetKB}kb`;
}

function formatOf(file: File): ImageFormat {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpeg';
}

/** Real dimensions when the browser can decode the file, otherwise a 12 MP guess. */
async function dimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file);
      const d = { width: bmp.width, height: bmp.height };
      bmp.close();
      return d;
    }
  } catch {
    // fall through
  }
  return { width: 4000, height: 3000 };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Runs `work` after a fake delay with progress ticks; supports cancel. */
function job<T>(
  durationMs: number,
  onProgress: ProgressFn | undefined,
  work: () => Promise<T>,
): JobHandle<T> {
  let cancelled = false;
  let rejectFn: (e: unknown) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    rejectFn = reject;
    const steps = 6;
    let i = 0;
    onProgress?.({ stage: 'decode', ratio: 0 });
    const tick = () => {
      if (cancelled) return;
      i += 1;
      onProgress?.({ stage: i < steps ? 'search' : 'encode', ratio: i / steps });
      if (i < steps) {
        setTimeout(tick, durationMs / steps);
      } else {
        work().then(resolve, reject);
      }
    };
    setTimeout(tick, durationMs / steps);
  });
  return {
    promise,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      rejectFn(new MockEngineError('CANCELLED', 'Cancelled'));
    },
  };
}

function checkInput(file: File): void {
  const n = file.name.toLowerCase();
  if (file.type && !file.type.startsWith('image/')) {
    throw new MockEngineError('UNSUPPORTED_FORMAT', 'Not an image');
  }
  if (n.includes('fail')) throw new MockEngineError('DECODE_FAILED', 'Could not decode');
}

function checkWebp(file: File, format: ImageFormat): void {
  if (format === 'webp' && file.name.toLowerCase().includes('nowebp')) {
    throw new MockEngineError('ENCODE_UNSUPPORTED', 'WebP encoding not supported');
  }
}

export const mockEngine: ImageEngine = {
  compressToSize(file: File, opts: CompressToSizeOptions, onProgress?: ProgressFn) {
    const started = performance.now();
    return job(rand(600, 1400), onProgress, async () => {
      checkInput(file);
      const format = opts.format ?? 'jpeg';
      checkWebp(file, format);
      const target = opts.targetKB * 1000 * 0.99;
      const { width, height } = await dimensions(file);
      const notes: EngineNote[] = [];
      if (file.name.toLowerCase().includes('big')) notes.push('downscaled-for-memory');

      if (file.name.toLowerCase().includes('huge')) {
        throw new MockEngineError('TARGET_UNREACHABLE', 'Target unreachable', {
          smallestBytes: Math.round(target * 1.6),
          width: 160,
          height: 120,
        });
      }

      let outW = width;
      let outH = height;
      let outputBytes: number;
      let quality: number;
      if (file.size <= target) {
        notes.push('already-small');
        outputBytes = Math.round(Math.min(file.size * rand(0.8, 0.98), target));
        quality = 0.92;
      } else {
        outputBytes = Math.round(target * rand(0.9, 0.995));
        quality = Math.round(rand(0.55, 0.85) * 100) / 100;
        // ~0.5 bytes per pixel at medium quality; shrink if needed.
        const allowedPixels = outputBytes / 0.5;
        if (!opts.keepDimensions && allowedPixels < width * height) {
          const s = Math.max(
            Math.sqrt(allowedPixels / (width * height)),
            160 / Math.min(width, height),
          );
          outW = Math.round(width * s);
          outH = Math.round(height * s);
          notes.push('resized');
        }
      }

      return {
        blob: file,
        fileName: `${baseName(file.name)}-${sizeLabel(opts.targetKB)}.${EXT[format]}`,
        format,
        width: outW,
        height: outH,
        inputBytes: file.size,
        outputBytes,
        quality,
        notes,
        ms: Math.round(performance.now() - started),
      } satisfies EngineResult;
    });
  },

  convert(file: File, opts: ConvertOptions, onProgress?: ProgressFn) {
    const started = performance.now();
    return job(rand(300, 800), onProgress, async () => {
      checkInput(file);
      checkWebp(file, opts.to);
      const { width, height } = await dimensions(file);
      const notes: EngineNote[] = [];
      const from = formatOf(file);
      if (opts.to === 'jpeg' && from !== 'jpeg') notes.push('transparency-flattened');
      const factor =
        opts.to === 'png' ? rand(1.5, 3) : opts.to === 'webp' ? rand(0.25, 0.6) : rand(0.4, 0.8);
      return {
        blob: file,
        fileName: `${baseName(file.name)}.${EXT[opts.to]}`,
        format: opts.to,
        width,
        height,
        inputBytes: file.size,
        outputBytes: Math.max(200, Math.round(file.size * factor)),
        quality: opts.to === 'png' ? undefined : (opts.quality ?? 0.9),
        notes,
        ms: Math.round(performance.now() - started),
      } satisfies EngineResult;
    });
  },

  compress(file: File, opts: CompressOptions, onProgress?: ProgressFn) {
    const started = performance.now();
    return job(rand(400, 900), onProgress, async () => {
      checkInput(file);
      const format = !opts.format || opts.format === 'same' ? formatOf(file) : opts.format;
      checkWebp(file, format);
      const { width, height } = await dimensions(file);
      const notes: EngineNote[] = [];
      let outW = width;
      let outH = height;
      if (opts.maxWidth && width > opts.maxWidth) {
        outW = opts.maxWidth;
        outH = Math.round((height * opts.maxWidth) / width);
        notes.push('resized');
      }
      const pixelRatio = (outW * outH) / (width * height);
      return {
        blob: file,
        fileName: `${baseName(file.name)}-compressed.${EXT[format]}`,
        format,
        width: outW,
        height: outH,
        inputBytes: file.size,
        outputBytes: Math.max(
          200,
          Math.round(file.size * pixelRatio * opts.quality * rand(0.2, 0.4)),
        ),
        quality: format === 'png' ? undefined : opts.quality,
        notes,
        ms: Math.round(performance.now() - started),
      } satisfies EngineResult;
    });
  },

  pngToIco(file: File) {
    const started = performance.now();
    return job(rand(200, 500), undefined, async () => {
      checkInput(file);
      return {
        blob: new Blob([await file.arrayBuffer()], { type: 'image/x-icon' }),
        fileName: `${baseName(file.name)}.ico`,
        format: 'ico',
        width: 48,
        height: 48,
        inputBytes: file.size,
        outputBytes: Math.round(rand(4000, 15000)),
        notes: [],
        ms: Math.round(performance.now() - started),
      } satisfies EngineResult;
    });
  },

  makeFavicons(src: FaviconSource) {
    return job(rand(300, 700), undefined, async () => {
      const label = src.mode === 'text' ? src.text : src.mode === 'emoji' ? src.emoji : 'IMG';
      const bg = src.background === 'transparent' ? 'none' : src.background;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="42" font-size="28" text-anchor="middle" font-family="system-ui">${label}</text></svg>`;
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const names = [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'site.webmanifest',
        'README.txt',
      ];
      if (src.mode !== 'image') names.push('favicon.svg');
      return {
        files: names.map((name) => ({ name, blob: svgBlob })),
        snippet: [
          '<link rel="icon" href="/favicon.ico" sizes="48x48">',
          ...(src.mode !== 'image'
            ? ['<link rel="icon" href="/favicon.svg" type="image/svg+xml">']
            : []),
          '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
          '<link rel="manifest" href="/site.webmanifest">',
        ].join('\n'),
        previews: { 16: url, 32: url, 48: url, 180: url, 512: url },
      } satisfies FaviconPackage;
    });
  },

  async zip(files) {
    await new Promise((r) => setTimeout(r, 300));
    return new Blob(
      files.map((f) => f.blob),
      { type: 'application/zip' },
    );
  },

  async capabilities(): Promise<Capabilities> {
    const shareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] });
    return {
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      workerCanvas: typeof OffscreenCanvas !== 'undefined',
      encodeWebp: true,
      shareFiles,
      maxPixels: 16_777_216,
    };
  },
};
