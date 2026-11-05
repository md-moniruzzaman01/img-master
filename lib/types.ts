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
  /** Decorative kanji for the card (e.g. "五十" for 50KB). From lib/tools/glyphs.ts. Always aria-hidden. */
  glyph: string;
}

/** One entry in the Ctrl+K search and the "Every tool" filter (built by lib/tools). */
export interface SearchItem {
  slug: string;
  href: string;
  title: string; // content.shortName, e.g. "To 50KB"
  description: string; // content.cardDescription
  glyph: string;
  category: ToolCategory;
  /** Lower-case words to match on: h1, primary and secondary keywords, slug parts. */
  keywords: string[];
}

/** Colour theme. Stored in localStorage under siteConfig.theme.storageKey. */
export type Theme = 'light' | 'dark';

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

/** Icons a use-case card may show (components/ui/icons.tsx draws them). */
export type UseCaseIcon = 'document' | 'cap' | 'globe' | 'mail' | 'phone' | 'image' | 'print' | 'code';

/** "Where a 50 KB limit shows up" cards on a tool page. */
export interface UseCase {
  icon: UseCaseIcon;
  title: string; // ≤ 28 chars
  text: string; // ≤ 70 chars
}

/** Heading + optional one-line intro for a page section. */
export interface SectionIntro {
  heading: string;
  intro?: string;
}

/** Three short value statements (dark band on home and About). */
export interface ValueItem {
  glyph: string; // one decorative kanji, aria-hidden
  title: string;
  text: string;
}

export interface ToolContent {
  primaryKeyword: string;
  secondaryKeywords: string[]; // 3–8 real variants
  shortName: string; // menus and cards, ≤ 18 chars ("To 50KB")
  cardDescription: string; // ≤ 70 chars
  title: string; // ≤ 60 chars including " | Img Master"
  description: string; // 120–155 chars
  h1: string;
  /** Exact substring of h1 drawn in crimson, e.g. "50 KB" in "Compress image to 50 KB". */
  h1Accent?: string;
  subtitle: string; // ≤ 100 chars, shown above the tool
  /** One line in the samurai panel's Tip card (desktop). */
  sideTip?: string;
  /** Use-case cards shown right after the tool (2–4). */
  useCases?: { heading: string; intro?: string; items: UseCase[] };
  howTo: [string, string, string];
  /** H2 above the three steps, e.g. "How to compress an image to 50KB". Default: "How it works". */
  howToHeading?: string;
  sections: RichSection[]; // 2–4 page-unique sections
  tips?: string[];
  faqs: FaqItem[]; // 4–6
  related: string[]; // 4–6 slugs, must exist
  updatedAt: string; // ISO date
}

/** content/home.ts (spec docs/superpowers/specs/2026-10-25-figma-redesign.md §5.1). */
export interface HomeContent {
  title: string; // ≤ 60 chars
  description: string; // 120–155 chars
  eyebrow: string; // "Free image tools"
  h1: string;
  h1Accent?: string; // substring of h1 in crimson ("size.")
  subtitle: string;
  trustItems: string[]; // exactly 3, under the hero tool
  compress: SectionIntro;
  convert: SectionIntro;
  compare: SectionIntro & { originalLabel: string; resultLabel: string };
  values: ValueItem[]; // exactly 3
  favicon: SectionIntro;
  howItWorks?: RichSection;
  faqHeading: string;
  faqs: FaqItem[]; // 4
  cta: { heading: string; text: string; button: string };
  updatedAt: string;
}

/** content/pages/how-it-works.ts and content/pages/tools-index.ts. */
export interface InfoPageContent {
  title: string; // ≤ 60 chars
  description: string; // 120–155 chars
  h1: string;
  subtitle: string;
  sections: RichSection[];
  faqs?: FaqItem[];
  updatedAt: string;
}

export type LegalSlug = 'about' | 'privacy' | 'terms' | 'contact';

/** content/legal/{slug}.ts (SEO.md §6). */
export interface LegalContent {
  slug: LegalSlug;
  title: string;
  description: string;
  h1: string;
  /** About only: small label above the H1 and a short hero intro. */
  eyebrow?: string;
  intro?: string[];
  /** About only: the three values band. */
  values?: ValueItem[];
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
  | 'animation-dropped' // animated input, first frame used
  | 'not-smaller'; // compress: no smaller version was possible (output ≥ input size)

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
  | 'INVALID_OPTIONS' // bad user input (e.g. resize to 0 px); show error.message
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
  keepDimensions?: boolean; // default false ("Pixel size: Keep exact" in the UI = true)
  /** Scale down first so width ≤ maxWidth (aspect ratio kept). Undefined = keep original. */
  maxWidth?: number;
  background?: string; // for alpha → JPG, default '#ffffff'
}

export interface ResizeOptions {
  /** Target size. Give width and/or height in px, or percent (1–400). */
  width?: number;
  height?: number;
  percent?: number;
  /** Default true: when only one side is given, or both with keepRatio, fit inside and keep the ratio. */
  keepRatio?: boolean;
  format?: ImageFormat | 'same'; // default 'same'
  quality?: number; // 0–1 for lossy output, default 0.9
  background?: string; // alpha → JPG
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

export type FaviconTypeface = 'brush' | 'mincho' | 'gothic';

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
      /** Typeface style picked in the UI (default 'mincho'). */
      typeface?: FaviconTypeface;
      /**
       * CSS font-family string the UI has already loaded with document.fonts.load()
       * (from next/font). The engine draws with it and falls back to serif/sans.
       */
      fontFamily?: string;
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
  resize(file: File, opts: ResizeOptions, onProgress?: ProgressFn): JobHandle<EngineResult>;
  pngToIco(file: File): JobHandle<EngineResult>;
  makeFavicons(src: FaviconSource): JobHandle<FaviconPackage>;
  zip(files: { name: string; blob: Blob }[]): Promise<Blob>;
  capabilities(): Promise<Capabilities>;
}
