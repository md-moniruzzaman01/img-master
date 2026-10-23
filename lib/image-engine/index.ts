// Public API of the image engine (ENGINE.md §2). Main-thread entry: small.
// Decoding, resizing and encoding run in the worker (or the lazy fallback).
import type { EngineResult, FaviconPackage, FaviconSource, ImageEngine, JobHandle } from '../types';
import { capabilities, engineMode, submit } from './client';
import type { FaviconWire } from './protocol';

/**
 * Object URLs are made here on the main thread (a worker's URLs can die with
 * the worker). The caller must revoke every URL in `previews` when it replaces
 * the package or unmounts.
 */
function makeFavicons(src: FaviconSource): JobHandle<FaviconPackage> {
  const { file, options } =
    src.mode === 'image'
      ? { file: src.file, options: { ...src, file: undefined } }
      : { file: null, options: { ...src } };
  const handle = submit<FaviconWire>('favicons', file, options);
  const promise = handle.promise.then((w): FaviconPackage => {
    const u = (b: Blob) => URL.createObjectURL(b);
    return {
      files: w.files,
      snippet: w.snippet,
      previews: {
        16: u(w.previews[16]),
        32: u(w.previews[32]),
        48: u(w.previews[48]),
        180: u(w.previews[180]),
        512: u(w.previews[512]),
      },
    };
  });
  return { promise, cancel: handle.cancel };
}

export const imageEngine: ImageEngine = {
  compressToSize: (file, opts, onProgress) =>
    submit<EngineResult>('compressToSize', file, { ...opts }, onProgress),
  convert: (file, opts, onProgress) => submit<EngineResult>('convert', file, { ...opts }, onProgress),
  compress: (file, opts, onProgress) => submit<EngineResult>('compress', file, { ...opts }, onProgress),
  pngToIco: (file) => submit<EngineResult>('pngToIco', file, {}),
  makeFavicons,
  zip: async (files) => (await import('./zip')).zipFiles(files),
  capabilities,
};

export { engineMode };
export { EngineError } from './errors';
