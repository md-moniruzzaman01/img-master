# Img Master — image engine

Everything that touches pixels lives in `lib/image-engine/`. The UI talks to it only through the public API below. The engine never makes network requests.

## 1. File layout

```
lib/image-engine/
├─ index.ts          # public API (main thread); routes jobs to the worker client
├─ client.ts         # worker pool, job queue, progress events, cancellation, fallback
├─ worker.ts         # Web Worker entry; runs jobs with OffscreenCanvas
├─ run-job.ts        # job runner shared by the worker and the main-thread fallback
├─ capabilities.ts   # feature detection (cached)
├─ decode.ts         # File/Blob → ImageBitmap (orientation, memory guard)
├─ resize.ts         # high-quality downscale
├─ encode.ts         # canvas → Blob for jpeg/png/webp, WebP support check
├─ compress-to-size.ts  # target-size search (pure logic + encoder injection)
├─ convert.ts
├─ compress.ts       # quality-based compression
├─ favicon/
│  ├─ render.ts      # image/text/emoji → square canvases at each size
│  ├─ ico.ts         # ICO writer (PNG-in-ICO)
│  ├─ svg.ts         # SVG favicon for text/emoji
│  └─ package.ts     # webmanifest, snippet, README, file list
├─ zip.ts            # fflate zip of results
├─ names.ts          # output file naming
├─ errors.ts         # EngineError + codes
└─ __tests__/
```

## 2. Public API (the contract; copy the types into `lib/types.ts`)

```ts
export type ImageFormat = 'jpeg' | 'png' | 'webp';

export type EngineNote =
  | 'resized'                 // dimensions reduced to reach the target
  | 'downscaled-for-memory'   // input over the pixel cap, reduced before processing
  | 'transparency-flattened'  // alpha filled with the background color for JPG
  | 'already-small'           // input was already under target; returned a clean re-encode
  | 'animation-dropped';      // animated input, first frame used

export interface EngineResult {
  blob: Blob;
  fileName: string;
  format: ImageFormat;
  width: number;
  height: number;
  inputBytes: number;
  outputBytes: number;
  quality?: number;      // 0–1, lossy outputs only
  notes: EngineNote[];
  ms: number;            // processing time
}

export type EngineErrorCode =
  | 'UNSUPPORTED_FORMAT'  // browser can't decode this file
  | 'DECODE_FAILED'
  | 'TARGET_UNREACHABLE'
  | 'ENCODE_UNSUPPORTED'  // e.g. browser can't encode WebP
  | 'OUT_OF_MEMORY'
  | 'CANCELLED';

export interface CompressToSizeOptions {
  targetKB: number;            // decimal KB as shown to users (1MB page uses 1000)
  format?: 'jpeg' | 'webp';    // default 'jpeg'
  keepDimensions?: boolean;    // default false
  background?: string;         // for alpha → JPG, default '#ffffff'
}

export interface ConvertOptions {
  to: ImageFormat;
  quality?: number;            // 0–1, default 0.9 for lossy
  background?: string;
}

export interface CompressOptions {
  quality: number;             // 0–1
  format?: ImageFormat | 'same';
  maxWidth?: number;
}

export type FaviconSource =
  | { mode: 'image'; file: File; zoom: number; padding: number; background: string | 'transparent'; shape: 'square' | 'rounded' | 'circle' }
  | { mode: 'text'; text: string; fontWeight: 400 | 600 | 800; color: string; background: string; shape: 'square' | 'rounded' | 'circle'; padding: number }
  | { mode: 'emoji'; emoji: string; background: string | 'transparent'; shape: 'square' | 'rounded' | 'circle'; padding: number };

export interface FaviconPackage {
  files: { name: string; blob: Blob }[];
  snippet: string;      // HTML <link> tags
  previews: Record<16 | 32 | 48 | 180 | 512, string>; // object URLs
}

export interface JobHandle<T> {
  promise: Promise<T>;
  cancel(): void;
}

export type ProgressFn = (p: { stage: 'decode' | 'search' | 'encode'; ratio: number }) => void;

export interface ImageEngine {
  compressToSize(file: File, opts: CompressToSizeOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  convert(file: File, opts: ConvertOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  compress(file: File, opts: CompressOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  pngToIco(file: File): JobHandle<EngineResult>;
  makeFavicons(src: FaviconSource): JobHandle<FaviconPackage>;
  zip(files: { name: string; blob: Blob }[]): Promise<Blob>;
  capabilities(): Promise<Capabilities>;
}

export interface Capabilities {
  offscreenCanvas: boolean;
  workerCanvas: boolean;
  encodeWebp: boolean;
  shareFiles: boolean;
  maxPixels: number;
}
```

Also export a **mock engine** (`lib/image-engine/mock.ts`, written by the lead in Phase 0) with the same interface, fake delays and fake sizes, so the UI can be built before the real engine exists.

## 3. Capabilities (`capabilities.ts`)

Detect once and cache:

- `offscreenCanvas`: `typeof OffscreenCanvas !== 'undefined'`
- `workerCanvas`: worker can create `OffscreenCanvas` with a `2d` context **and** `convertToBlob` works (test with a 1×1 canvas inside the worker)
- `encodeWebp`: encode a 1×1 canvas as `image/webp` and check that `blob.type === 'image/webp'`. Some browsers silently return PNG.
- `shareFiles`: `navigator.canShare?.({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })`
- `maxPixels`: 16,777,216 (4096 × 4096; Safari's canvas area limit). Lower to 8M when `navigator.deviceMemory <= 2`.

If `encodeWebp` is false, WebP outputs fail with `ENCODE_UNSUPPORTED` and the UI shows the message from `DESIGN.md`. A lazy-loaded WASM WebP encoder is a possible Phase 2 addition (ask the owner before adding the dependency).

## 4. Decode (`decode.ts`)

1. Reject non-images early by checking magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`, GIF `GIF8`, BMP `BM`, HEIC/AVIF `ftyp` box). Unknown signatures still get one decode attempt.
2. `createImageBitmap(file, { imageOrientation: 'from-image' })` so phone photos aren't sideways.
3. If decode fails: `UNSUPPORTED_FORMAT` for known-but-unsupported types (HEIC outside Safari), otherwise `DECODE_FAILED`.
4. If `width × height > maxPixels`, downscale to fit before anything else and add note `downscaled-for-memory`. Use `createImageBitmap` with `resizeWidth`/`resizeHeight` and `resizeQuality: 'high'` where supported, otherwise a stepped canvas downscale.
5. Detect alpha cheaply: for PNG/WebP/GIF inputs, draw a 64×64 sample and check for any alpha < 255.
6. Always `close()` bitmaps when done.

## 5. Resize (`resize.ts`)

- Keep aspect ratio. Never upscale.
- For reductions bigger than 2×, step down by halves, then do the final step; set `imageSmoothingQuality = 'high'`. This avoids the jagged look of a single big downscale.
- When flattening alpha for JPG, fill the background color before drawing (note `transparency-flattened`).

## 6. Compress to size (`compress-to-size.ts`)

Write the search as **pure logic with an injected encoder** so it can be unit-tested without a canvas:

```ts
type Encoder = (width: number, height: number, quality: number) => Promise<{ bytes: number; blob: Blob }>;
```

### Target

`targetBytes = targetKB × 1000`, then subtract a 1% safety margin (minimum 200 bytes). A file under `targetKB × 1000` bytes is also under `targetKB × 1024`, so it passes forms that use either definition of KB.

### Algorithm

```
inputs: source dims (W, H), targetBytes, keepDimensions, format
constants: Q_MAX = 0.92, Q_FLOOR = 0.45, Q_HARD_FLOOR = 0.15,
           SCALE_STEP = 0.85, MIN_SIDE = 160 px, MAX_ENCODES = 24

1. Quick check: encode at Q_MAX at full size. If ≤ target → done (note 'already-small'
   if the input file itself was already ≤ target).
2. Starting size (skip if keepDimensions):
   estimate bits-per-pixel from step 1: bpp = bytes / (W×H) at Q_MAX.
   Allowed pixels at roughly quality 0.75 ≈ targetBytes / (bpp × 0.45).
   If allowed pixels < W×H, start at scale s = sqrt(allowed / (W×H)), clamped so the
   short side ≥ MIN_SIDE.
3. Binary-search quality in [Q_FLOOR, Q_MAX] at the current size, up to 7 encodes.
   Keep the highest quality whose output ≤ target.
4. If found → done (note 'resized' if scale < 1).
5. If not found and not keepDimensions and short side × SCALE_STEP ≥ MIN_SIDE:
   scale ×= SCALE_STEP, go to 3.
6. If still not found (or keepDimensions): binary-search quality in
   [Q_HARD_FLOOR, Q_FLOOR] at the current size.
7. Still too big → throw TARGET_UNREACHABLE (include the smallest size achieved so the UI
   can suggest the next target up).
8. Stop at MAX_ENCODES total and return the best result under target, or throw.
```

Approved changes (owner, 2026-10-23):
- **Probe before step 1:** for inputs over 2 MP, first encode a ~1 MP copy at Q_MAX. If a conservative estimate from it (× pixel ratio × 0.3) is still over the target, skip the full-size check. The probe counts toward MAX_ENCODES and is never returned as a result.
- **Faster shrinking in step 5:** scale by `min(SCALE_STEP, √(target / bytes))` instead of always SCALE_STEP, clamped so the short side stays ≥ MIN_SIDE.

Notes:
- Report progress after each encode (`stage: 'search'`, ratio = encodes / MAX_ENCODES as an upper bound).
- Check the cancel flag between encodes.
- Output is always re-encoded, so metadata (EXIF, GPS) is always removed.
- PNG is never an output of compress-to-size (canvas PNG can't hit size targets well). PNG inputs default to JPG output (WebP if chosen).

## 7. Convert (`convert.ts`)

- Decode → (flatten alpha if output is JPG) → encode at `quality` (default 0.9) → result.
- PNG output ignores quality.
- If source and target format are the same, still re-encode (cleans metadata) but keep quality high.
- Animated GIF/WebP: first frame, note `animation-dropped`.

## 8. Compress by quality (`compress.ts`)

Decode → optional `maxWidth` resize → encode at the chosen quality in the chosen or same format. If the result is larger than the input (can happen with already-optimized files), return the input re-encoded at the original format's best smaller attempt, or the input untouched with a note. Never hand the user a bigger file without saying so.

## 9. Favicons (`favicon/`)

- `render.ts`: draw the source into a square canvas at 512px with shape mask (square, rounded with 20% radius, circle), padding and background; text uses the system font stack centered with font size fitted to the box; emoji uses the platform emoji font. Then downscale to 192, 180, 48, 32 and 16 with the stepped resize. For text and emoji at 16 and 32, render directly at that size instead of downscaling, which gives crisper icons.
- `ico.ts`: write the ICO container with embedded PNGs.
  - Header (6 bytes): reserved `0`, type `1`, image count.
  - Directory entry per image (16 bytes): width (0 means 256), height, color count `0`, reserved `0`, planes `1`, bit count `32`, byte size of PNG data, byte offset.
  - Then the PNG data blocks in order. `favicon.ico` holds 16, 32 and 48.
- `svg.ts`: text and emoji modes also produce `favicon.svg` (vector, crisp at any size).
- `package.ts`: build `site.webmanifest` (name, short_name, icons 192/512, theme and background color), the HTML snippet and `README.txt`.

Snippet:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"> <!-- text/emoji only -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

`pngToIco`: decode the PNG, render 16/32/48 (plus 256 if the source is at least 256px), write the ICO.

## 10. Worker and client

- **Pool size:** 1 worker if `navigator.hardwareConcurrency <= 4` or `deviceMemory <= 2`, otherwise 2.
- **Queue:** jobs run in order; one image at a time per worker to limit memory.
- **Messages:**
  - main → worker: `{ id, type: 'compressToSize' | 'convert' | 'compress' | 'pngToIco' | 'favicons', file, options }` (Blobs and Files are structured-cloneable)
  - worker → main: `{ id, type: 'progress', stage, ratio }`, `{ id, type: 'done', result }`, `{ id, type: 'error', code, message, detail? }`
  - main → worker: `{ id, type: 'cancel' }`
- **Fallback:** if `workerCanvas` is false, run the same `run-job.ts` on the main thread with `HTMLCanvasElement`, yielding with `await new Promise(r => setTimeout(r))` between encodes so the UI stays responsive.
- **Create the worker** with `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`. Confirm it is emitted correctly in the static export build.
- **Out of memory:** catch allocation failures (`RangeError`, failed `convertToBlob`) and retry once at half the pixel cap; then `OUT_OF_MEMORY`.

## 11. File names (`names.ts`)

- Compress to size: `{base}-{target}kb.jpg` (or `-1mb`)
- Convert: `{base}.{ext}`
- Compress: `{base}-compressed.{ext}`
- Sanitize: keep letters, numbers, dashes and underscores; max 60 characters; fallback `image`.
- Duplicates in one batch get `-2`, `-3`.

## 12. Tests

### Unit (Vitest, `__tests__/`)

- `compress-to-size`: with a fake encoder modeling `bytes ≈ pixels × f(quality)`, check that results are always ≤ target, that the highest passing quality is chosen, that scaling happens only when needed, that `keepDimensions` never scales, that `MAX_ENCODES` is respected, and that impossible targets throw `TARGET_UNREACHABLE`.
- `ico`: header bytes, directory offsets and sizes are correct for 1, 3 and 4 images; 256px stored as `0`.
- `names`: sanitizing, extensions, duplicates.
- Target math: 50KB → ≤ 49,500 bytes; 1MB page → ≤ 990,000 bytes.

### Browser (owned by qa-reviewer, see its agent file)

Playwright runs the real tool pages with fixtures and checks real outputs, timing and that no image data goes over the network.

## 13. Performance targets

| Case | Target |
|---|---|
| 12 MP phone photo → 100 KB, desktop | < 1.5 s |
| 12 MP phone photo → 100 KB, Chrome with 4× CPU throttle (mid-range phone proxy) | < 4 s |
| 12 MP photo → 20 KB | < 5 s throttled |
| WebP → JPG, 2 MP | < 0.5 s desktop |
| Favicon package | < 1 s desktop |
| Engine code loaded on the main thread before first use | ≤ 15 KB gzipped (load the rest in the worker) |
