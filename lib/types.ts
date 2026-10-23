// Shared contracts for Img Master. Owned by the lead.
// Subagents propose changes in their reports; only the lead edits this file.
// Sources: docs/SEO.md §3 (tools and content) and docs/ENGINE.md §2 (engine).

/* ------------------------------------------------------------------ */
/* Image formats                                                       */
/* ------------------------------------------------------------------ */

export type ImageFormat = 'jpeg' | 'png' | 'webp';

/* ------------------------------------------------------------------ */
/* Tools (structure: lib/tools/registry.ts)                            */
/* ------------------------------------------------------------------ */

export type ToolKind =
  | 'compress-to-size'
  | 'compress'
  | 'convert'
  | 'favicon-image'
  | 'favicon-text'
  | 'favicon-emoji'
  | 'png-to-ico'
  | 'resize'; // later phase (PRODUCT.md §3.6); always draft for now

export type ToolCategory = 'compress' | 'convert' | 'favicon' | 'resize';

export interface ToolDefinition {
  slug: string;
  kind: ToolKind;
  category: ToolCategory;
  status: 'live' | 'draft';
  phase: 1 | 2 | 3;
  /** True for the category hub page (compress-image, image-converter, favicon-generator). */
  hub?: boolean;
  preset: {
    targetKB?: number; // compress-to-size (decimal KB; the 1MB page uses 1000)
    from?: ImageFormat | 'any'; // convert
    to?: ImageFormat; // convert, compress-to-size output
    quality?: number; // 0–1
  };
}

/** One breadcrumb. The last crumb (current page) has no href. */
export interface Crumb {
  label: string;
  href?: string;
}

/** Everything a ToolCard needs; built by lib/tools from registry + content. */
export interface ToolCardData {
  slug: string;
  href: string; // canonical path, e.g. "/compress-image-to-50kb"
  kind: ToolKind;
  category: ToolCategory;
  shortName: string;
  description: string; // content.cardDescription
}

/** A category with its live tools (menus, footer, home grid, 404). */
export interface ToolNavGroup {
  category: ToolCategory;
  label: string; // "Compress"
  hubHref?: string;
  tools: ToolCardData[];
}

/* ------------------------------------------------------------------ */
/* Content (text: content/pages/{slug}.ts, content/home.ts, legal)     */
/* ------------------------------------------------------------------ */

export interface RichSection {
  heading: string; // becomes an H2
  paragraphs: string[]; // supports **bold** and [text](/internal-path)
  list?: string[];
  table?: { caption: string; headers: string[]; rows: string[][] };
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ToolContent {
  primaryKeyword: string;
  secondaryKeywords: string[]; // 3–8 real variants
  shortName: string; // menus and cards, ≤ 18 chars ("To 50KB")
  cardDescription: string; // ≤ 70 chars
  title: string; // ≤ 60 chars including " | Img Master"
  description: string; // 120–155 chars
  h1: string;
  subtitle: string; // ≤ 100 chars, shown above the tool
  howTo: [string, string, string];
  sections: RichSection[]; // 2–4 page-unique sections
  tips?: string[];
  faqs: FaqItem[]; // 4–6
  related: string[]; // 4–6 slugs, must exist
  updatedAt: string; // ISO date
}

/** content/home.ts (DESIGN.md §3.2). */
export interface HomeContent {
  title: string; // ≤ 60 chars
  description: string; // 120–155 chars
  h1: string;
  subtitle: string;
  sizeRowHeading: string; // "Compress to a size"
  trustItems: string[]; // "No upload", "No signup", "No watermark", "Free"
  howItWorks: RichSection;
  faqs: FaqItem[]; // 4
  updatedAt: string;
}

export type LegalSlug = 'about' | 'privacy' | 'terms' | 'contact';

/** content/legal/{slug}.ts (SEO.md §6). */
export interface LegalContent {
  slug: LegalSlug;
  title: string;
  description: string;
  h1: string;
  sections: RichSection[];
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Image engine (ENGINE.md §2)                                         */
/* ------------------------------------------------------------------ */

export type EngineNote =
  | 'resized' // dimensions reduced to reach the target
  | 'downscaled-for-memory' // input over the pixel cap, reduced before processing
  | 'transparency-flattened' // alpha filled with the background color for JPG
  | 'already-small' // input was already under target; returned a clean re-encode
  | 'animation-dropped'; // animated input, first frame used

export interface EngineResult {
  blob: Blob;
  fileName: string;
  /** 'ico' only for pngToIco (added to ENGINE.md's type so ICO results are typed honestly). */
  format: ImageFormat | 'ico';
  width: number;
  height: number;
  inputBytes: number;
  /** Always use this for display; equals blob.size in the real engine. */
  outputBytes: number;
  quality?: number; // 0–1, lossy outputs only
  notes: EngineNote[];
  ms: number; // processing time
}

export type EngineErrorCode =
  | 'UNSUPPORTED_FORMAT' // browser can't decode this file
  | 'DECODE_FAILED'
  | 'TARGET_UNREACHABLE'
  | 'ENCODE_UNSUPPORTED' // e.g. browser can't encode WebP
  | 'OUT_OF_MEMORY'
  | 'CANCELLED';

/** Extra data an engine error may carry, so the UI can suggest a next step. */
export interface EngineErrorDetail {
  /** TARGET_UNREACHABLE: smallest output achieved, in bytes. */
  smallestBytes?: number;
  width?: number;
  height?: number;
}

/**
 * Jobs reject with an Error whose `name` is 'EngineError' and that has
 * `code` (and optionally `detail`). Use `isEngineError` to check.
 */
export interface EngineErrorShape extends Error {
  name: 'EngineError';
  code: EngineErrorCode;
  detail?: EngineErrorDetail;
}

export function isEngineError(e: unknown): e is EngineErrorShape {
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as { name?: unknown }).name === 'EngineError' &&
    typeof (e as { code?: unknown }).code === 'string'
  );
}

export interface CompressToSizeOptions {
  targetKB: number; // decimal KB as shown to users (1MB page uses 1000)
  format?: 'jpeg' | 'webp'; // default 'jpeg'
  keepDimensions?: boolean; // default false
  background?: string; // for alpha → JPG, default '#ffffff'
}

export interface ConvertOptions {
  to: ImageFormat;
  quality?: number; // 0–1, default 0.9 for lossy
  background?: string;
}

export interface CompressOptions {
  quality: number; // 0–1
  format?: ImageFormat | 'same';
  maxWidth?: number;
}

export type FaviconShape = 'square' | 'rounded' | 'circle';

export type FaviconSource =
  | {
      mode: 'image';
      file: File;
      zoom: number;
      padding: number;
      background: string | 'transparent';
      shape: FaviconShape;
    }
  | {
      mode: 'text';
      text: string;
      fontWeight: 400 | 600 | 800;
      color: string;
      background: string;
      shape: FaviconShape;
      padding: number;
    }
  | {
      mode: 'emoji';
      emoji: string;
      background: string | 'transparent';
      shape: FaviconShape;
      padding: number;
    };

export interface FaviconPackage {
  files: { name: string; blob: Blob }[];
  snippet: string; // HTML <link> tags
  previews: Record<16 | 32 | 48 | 180 | 512, string>; // object URLs
}

export interface JobHandle<T> {
  promise: Promise<T>;
  cancel(): void;
}

export type ProgressFn = (p: { stage: 'decode' | 'search' | 'encode'; ratio: number }) => void;

export interface Capabilities {
  offscreenCanvas: boolean;
  workerCanvas: boolean;
  encodeWebp: boolean;
  shareFiles: boolean;
  maxPixels: number;
}

export interface ImageEngine {
  compressToSize(
    file: File,
    opts: CompressToSizeOptions,
    onProgress?: ProgressFn,
  ): JobHandle<EngineResult>;
  convert(file: File, opts: ConvertOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  compress(file: File, opts: CompressOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  pngToIco(file: File): JobHandle<EngineResult>;
  makeFavicons(src: FaviconSource): JobHandle<FaviconPackage>;
  zip(files: { name: string; blob: Blob }[]): Promise<Blob>;
  capabilities(): Promise<Capabilities>;
}
