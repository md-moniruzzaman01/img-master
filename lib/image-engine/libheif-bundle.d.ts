// libheif-js ships no types for the single-file ES module bundle (wasm inlined).
// The real shape we use is described by `Libheif` in ./heic.ts.
declare module 'libheif-js/libheif-wasm/libheif-bundle.mjs' {
  const factory: (options?: Record<string, unknown>) => Promise<unknown> | unknown;
  export default factory;
}
