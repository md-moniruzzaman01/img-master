// Public API of the image engine (ENGINE.md §2). Main-thread entry: small.
// Decoding, resizing and encoding run in the worker (or the lazy fallback).
import type { EngineResult, FaviconPackage, ImageEngine } from '../types';
import { capabilities, engineMode, rejectedHandle, submit } from './client';
import { EngineError } from './errors';

const notBuilt = () => new EngineError('ENCODE_UNSUPPORTED', 'Not built yet');

export const imageEngine: ImageEngine = {
  compressToSize: (file, opts, onProgress) =>
    submit<EngineResult>('compressToSize', file, { ...opts }, onProgress),
  convert: (file, opts, onProgress) => submit<EngineResult>('convert', file, { ...opts }, onProgress),
  compress: (file, opts, onProgress) => submit<EngineResult>('compress', file, { ...opts }, onProgress),
  // Phase 4.
  pngToIco: () => rejectedHandle<EngineResult>(notBuilt()),
  makeFavicons: () => rejectedHandle<FaviconPackage>(notBuilt()),
  zip: async (files) => (await import('./zip')).zipFiles(files),
  capabilities,
};

export { engineMode };
export { EngineError } from './errors';
