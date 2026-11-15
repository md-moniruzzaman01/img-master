// HEIC/HEIF fallback decoder (libheif-js, LGPL-3.0). Only loaded when the
// browser cannot decode HEIC itself (Chrome, Firefox, Edge without the OS codec).
// This file is imported with a dynamic import() from decode.ts, and libheif is a
// second dynamic import() inside it, so none of it reaches the first-load bundle.
// It runs in the worker and on the main thread. The wasm is inlined in the
// libheif bundle (served from our own origin, no fetch).
import { EngineError, MemoryError } from './errors';
import { fitPixels } from './resize';

/** Pixels libheif is allowed to decode at full size (RGBA = 4 bytes each). */
export const HEIC_MAX_DECODE_PIXELS = 50_000_000; // 48 MP phone photos fit
export const HEIC_MAX_DECODE_PIXELS_LOW_MEMORY = 25_000_000;
/** Above this many pixels the wasm instance is dropped so its heap can be freed. */
const DROP_INSTANCE_ABOVE = 20_000_000;

// The parts of the libheif emscripten module we use.
interface EnumValue {
  value: number;
}
interface HeifError {
  code: EnumValue;
  subcode: EnumValue;
  message: string;
}
interface Channel {
  stride: number;
  width: number;
  height: number;
  data: Uint8Array;
}
interface DecodedHandle {
  image: unknown;
  channels: Channel[];
  code?: undefined;
}
export interface Libheif {
  heif_context_alloc(): unknown;
  heif_context_free(ctx: unknown): void;
  heif_context_read_from_memory(ctx: unknown, data: Uint8Array): HeifError;
  heif_js_context_get_primary_image_handle(ctx: unknown): unknown;
  heif_image_handle_get_width(h: unknown): number;
  heif_image_handle_get_height(h: unknown): number;
  heif_image_handle_has_alpha_channel(h: unknown): number;
  heif_image_handle_release(h: unknown): void;
  heif_js_decode_image2(h: unknown, colorspace: unknown, chroma: unknown): DecodedHandle | HeifError;
  heif_image_release(img: unknown): void;
  heif_colorspace: { heif_colorspace_RGB: unknown };
  heif_chroma: { heif_chroma_interleaved_RGBA: unknown };
  heif_error_code: Record<string, EnumValue>;
  heif_suberror_code: Record<string, EnumValue>;
}

let loading: Promise<Libheif> | null = null;

/** Loads libheif once and reuses it for later files (batch jobs). */
export function loadLibheif(): Promise<Libheif> {
  loading ??= import('libheif-js/libheif-wasm/libheif-bundle.mjs')
    .then(async (m) => (await m.default()) as Libheif)
    .catch(() => {
      loading = null; // allow a retry
      throw new EngineError(
        'DECODE_FAILED',
        'The HEIC decoder could not be loaded. Reload the page and try again.',
      );
    });
  return loading;
}

/** Test helper: forget the loaded instance. */
export function resetLibheif(): void {
  loading = null;
}

export interface HeicPixels {
  /** Tightly packed RGBA, width × height × 4 bytes (already rotated/mirrored by libheif). */
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Size before any memory downscale. */
  fullWidth: number;
  fullHeight: number;
  hasAlpha: boolean;
}

function isErr(x: unknown): x is HeifError {
  return !!x && typeof x === 'object' && (x as { code?: unknown }).code !== undefined;
}

const CORRUPT = () => new EngineError('DECODE_FAILED', 'The image could not be opened. It may be damaged.');
const UNSUPPORTED = () =>
  new EngineError('UNSUPPORTED_FORMAT', 'This HEIC file uses a format we cannot open');

/** Maps a libheif error to an EngineError (or MemoryError). */
export function mapHeifError(lib: Libheif, err: HeifError): Error {
  const c = err.code?.value;
  const E = lib.heif_error_code;
  if (c === E.heif_error_Memory_allocation_error?.value) return new MemoryError(err.message);
  const sub = err.subcode?.value;
  const S = lib.heif_suberror_code;
  if (
    c === E.heif_error_Unsupported_feature?.value ||
    c === E.heif_error_Plugin_loading_error?.value ||
    c === E.heif_error_Unsupported_filetype?.value ||
    sub === S.heif_suberror_Unsupported_codec?.value ||
    sub === S.heif_suberror_No_matching_decoder_installed?.value ||
    sub === S.heif_suberror_Unsupported_bit_depth?.value
  ) {
    return UNSUPPORTED();
  }
  return CORRUPT();
}

/** Area-average downscale of strided RGBA into packed RGBA. */
export function boxDownscale(
  src: Uint8Array,
  stride: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(dw * dh * 4);
  const xr = sw / dw;
  const yr = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yr);
    const y1 = Math.min(sh, Math.max(y0 + 1, Math.ceil((y + 1) * yr)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xr);
      const x1 = Math.min(sw, Math.max(x0 + 1, Math.ceil((x + 1) * xr)));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let yy = y0; yy < y1; yy++) {
        let i = yy * stride + x0 * 4;
        for (let xx = x0; xx < x1; xx++, i += 4) {
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          a += src[i + 3];
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      const o = (y * dw + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = a / n;
    }
  }
  return out;
}

/**
 * Decodes the primary image of a HEIC/HEIF file to RGBA.
 * - The header size is read first; files above `hardCap` pixels are refused
 *   (MemoryError → OUT_OF_MEMORY) before any pixel buffer exists.
 * - Images above `maxPixels` are downscaled here, so no full-size canvas is needed.
 * - Only the primary image is decoded (bursts, Live Photos, depth maps ignored).
 */
export async function decodeHeicRgba(
  bytes: Uint8Array,
  maxPixels: number,
  hardCap: number = HEIC_MAX_DECODE_PIXELS,
  loader: () => Promise<Libheif> = loadLibheif,
): Promise<HeicPixels> {
  const lib = await loader();
  let ctx: unknown = null;
  let handle: unknown = null;
  let decoded: DecodedHandle | null = null;
  let pixelsSeen = 0;
  try {
    ctx = lib.heif_context_alloc();
    if (!ctx) throw new MemoryError('Could not create a HEIF context');
    const read = lib.heif_context_read_from_memory(ctx, bytes);
    if (read.code.value !== lib.heif_error_code.heif_error_Ok.value) throw mapHeifError(lib, read);

    handle = lib.heif_js_context_get_primary_image_handle(ctx);
    if (!handle || isErr(handle)) throw isErr(handle) ? mapHeifError(lib, handle) : CORRUPT();

    // Size after rotation/mirroring, known before decoding.
    const width = lib.heif_image_handle_get_width(handle);
    const height = lib.heif_image_handle_get_height(handle);
    if (!(width > 0 && height > 0)) throw CORRUPT();
    pixelsSeen = width * height;
    if (pixelsSeen > hardCap) throw new MemoryError('HEIC image is too large to decode');
    const hasAlpha = lib.heif_image_handle_has_alpha_channel(handle) !== 0;

    const res = lib.heif_js_decode_image2(
      handle,
      lib.heif_colorspace.heif_colorspace_RGB,
      lib.heif_chroma.heif_chroma_interleaved_RGBA,
    );
    if (!res || isErr(res)) throw isErr(res) ? mapHeifError(lib, res) : CORRUPT();
    decoded = res;
    const ch = res.channels?.[0];
    if (!ch || ch.width !== width || ch.height !== height) throw CORRUPT();

    let data: Uint8ClampedArray;
    let outW = width;
    let outH = height;
    if (width * height > maxPixels) {
      const fit = fitPixels(width, height, maxPixels);
      outW = fit.width;
      outH = fit.height;
      data = boxDownscale(ch.data, ch.stride, width, height, outW, outH);
    } else if (ch.stride === width * 4) {
      data = new Uint8ClampedArray(ch.data.slice(0, width * height * 4).buffer); // copy off the wasm heap
    } else {
      data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) {
        data.set(ch.data.subarray(y * ch.stride, y * ch.stride + width * 4), y * width * 4);
      }
    }
    return { data, width: outW, height: outH, fullWidth: width, fullHeight: height, hasAlpha };
  } finally {
    if (decoded) lib.heif_image_release(decoded.image);
    if (handle && !isErr(handle)) lib.heif_image_handle_release(handle);
    if (ctx) lib.heif_context_free(ctx);
    // Emscripten's heap never shrinks: after a very large image, let it go.
    if (pixelsSeen > DROP_INSTANCE_ABOVE) resetLibheif();
  }
}
