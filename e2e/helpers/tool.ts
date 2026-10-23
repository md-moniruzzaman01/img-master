import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from './fixtures';

// ── Page lists (mirror lib/tools/registry.ts, status 'live') ─────────────

export interface SizePage {
  slug: string;
  kb: number;
  /** Suffix used in output names: `-50kb`, `-1mb`. */
  suffix: string;
}
export const SIZE_PAGES: SizePage[] = [
  { slug: 'compress-image-to-20kb', kb: 20, suffix: '-20kb' },
  { slug: 'compress-image-to-50kb', kb: 50, suffix: '-50kb' },
  { slug: 'compress-image-to-100kb', kb: 100, suffix: '-100kb' },
  { slug: 'compress-image-to-200kb', kb: 200, suffix: '-200kb' },
  { slug: 'compress-image-to-500kb', kb: 500, suffix: '-500kb' },
  { slug: 'compress-image-to-1mb', kb: 1000, suffix: '-1mb' },
];

export type Fmt = 'jpeg' | 'png' | 'webp';
export const FMT_EXT: Record<Fmt, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' };
export const FMT_MIME: Record<Fmt, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface ConverterPage {
  slug: string;
  to: Fmt;
  /** A fixture file in e2e/fixtures/generated/ of the matching input type. */
  input: string;
}
export const CONVERTER_PAGES: ConverterPage[] = [
  { slug: 'webp-to-jpg', to: 'jpeg', input: 'photo-2mp.webp' },
  { slug: 'webp-to-png', to: 'png', input: 'photo-2mp.webp' },
  { slug: 'png-to-webp', to: 'webp', input: 'photo-2mp.png' },
  { slug: 'jpg-to-webp', to: 'webp', input: 'photo-2mp.jpg' },
  { slug: 'png-to-jpg', to: 'jpeg', input: 'photo-2mp.png' },
  { slug: 'jpg-to-png', to: 'png', input: 'photo-2mp.jpg' },
];

export const HUB_PAGES = ['compress-image', 'image-converter'];
export const TOOL_SLUGS: string[] = [
  'compress-image',
  ...SIZE_PAGES.map((p) => p.slug),
  'image-converter',
  ...CONVERTER_PAGES.map((p) => p.slug),
];
/** Phase 4 favicon pages (different island: data-testid=favicon-shell, no result cards except png-to-ico). */
export const FAVICON_SLUGS = [
  'favicon-generator',
  'favicon-from-text',
  'favicon-from-emoji',
  'png-to-ico',
];
export const INFO_PATHS = ['/about', '/privacy', '/terms', '/contact'];
export const ALL_PATHS: string[] = [
  '/',
  ...TOOL_SLUGS.map((s) => `/${s}`),
  ...FAVICON_SLUGS.map((s) => `/${s}`),
  ...INFO_PATHS,
];

// ── Locators ─────────────────────────────────────────────────────────────

export const shell = (page: Page): Locator => page.getByTestId('tool-shell');
export const cards = (page: Page): Locator => page.getByTestId('result-card');

export interface CardData {
  status: string | null;
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
  format: string | null;
  quality: number;
  ms: number;
  notes: string[];
  error: string | null;
  fileName: string | null;
}

export async function cardData(card: Locator): Promise<CardData> {
  const a = async (n: string) => card.getAttribute(n);
  const num = async (n: string) => Number((await a(n)) ?? NaN);
  return {
    status: await a('data-status'),
    inputBytes: await num('data-input-bytes'),
    outputBytes: await num('data-output-bytes'),
    width: await num('data-width'),
    height: await num('data-height'),
    format: await a('data-format'),
    quality: await num('data-quality'),
    ms: await num('data-ms'),
    notes: ((await a('data-notes')) ?? '').split(' ').filter(Boolean),
    error: await a('data-error'),
    fileName: await a('data-file-name'),
  };
}

// ── Actions ──────────────────────────────────────────────────────────────

export type PickInput = string | string[] | { name: string; mimeType: string; buffer: Buffer }[];

export async function gotoTool(page: Page, slug: string): Promise<void> {
  // The tool asks before replacing unsaved results (DESIGN.md section 5); accept so tests can re-pick.
  page.on('dialog', (d) => void d.accept());
  await page.goto(`/${slug}`);
  await expect(shell(page)).toBeVisible();
}

/** Picks files through the real <input type=file> and waits until processing ends. */
export async function pickAndWait(page: Page, files: PickInput, timeout = 120_000): Promise<void> {
  await page.getByTestId('file-input').setInputFiles(files);
  await page.waitForTimeout(150); // let React start the new run (a previous run may still read 'done')
  await waitDone(page, timeout);
}

export async function waitDone(page: Page, timeout = 120_000): Promise<void> {
  await expect(shell(page)).toHaveAttribute('data-state', /^(done|partial|error)$/, { timeout });
  await expect(
    page.locator(
      '[data-testid=result-card][data-status=queued], [data-testid=result-card][data-status=processing]',
    ),
  ).toHaveCount(0, { timeout });
}

/** Clicks a download control and returns the saved bytes and suggested name. */
export async function downloadVia(
  page: Page,
  control: Locator,
): Promise<{ bytes: Buffer; name: string }> {
  const [download] = await Promise.all([page.waitForEvent('download'), control.click()]);
  const path = await download.path();
  return { bytes: readFileSync(path), name: download.suggestedFilename() };
}

export async function openMoreOptions(page: Page): Promise<void> {
  const details = page.getByTestId('more-options');
  const open = await details.evaluate((d) => (d as HTMLDetailsElement).open);
  if (!open) await details.locator('summary').click();
}

// ── Bytes and decoding ───────────────────────────────────────────────────

export function sniff(bytes: Buffer): Fmt | 'gif' | 'bmp' | 'zip' | 'unknown' {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpeg';
  if (
    bytes.length > 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString('latin1') === 'RIFF' &&
    bytes.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'webp';
  if (bytes.subarray(0, 3).toString('latin1') === 'GIF') return 'gif';
  if (bytes.subarray(0, 2).toString('latin1') === 'BM') return 'bmp';
  if (bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) return 'zip';
  return 'unknown';
}

export interface Decoded {
  width: number;
  height: number;
  /** RGBA of the top-left pixel. */
  corner: [number, number, number, number];
  /** Lowest alpha in the image (255 when fully opaque). */
  minAlpha: number;
}

/** Decodes bytes in the page's own browser engine (so WebKit decodes with WebKit). */
export async function decodeInBrowser(page: Page, bytes: Buffer, mime: string): Promise<Decoded> {
  const b64 = bytes.toString('base64');
  return page.evaluate(
    async ({ b64: data, mime: type }) => {
      const bin = atob(data);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([arr], { type }));
      const c = document.createElement('canvas');
      c.width = Math.min(bmp.width, 2000);
      c.height = Math.min(bmp.height, 2000);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no ctx');
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let minAlpha = 255;
      for (let i = 3; i < px.length; i += 4) if (px[i] < minAlpha) minAlpha = px[i];
      const result = {
        width: bmp.width,
        height: bmp.height,
        corner: [px[0], px[1], px[2], px[3]] as [number, number, number, number],
        minAlpha,
      };
      bmp.close();
      return result;
    },
    { b64, mime },
  );
}

// ── Network recording (privacy) ──────────────────────────────────────────

export interface NetEntry {
  method: string;
  url: string;
  host: string;
  origin: string;
  bodyBytes: number;
  type: string;
}

export function recordNetwork(context: BrowserContext): NetEntry[] {
  const entries: NetEntry[] = [];
  context.on('request', (req) => {
    let host = '';
    let origin = '';
    try {
      const u = new URL(req.url());
      host = u.host;
      origin = u.origin;
      if (u.protocol === 'blob:' || u.protocol === 'data:' || u.protocol === 'about:') {
        origin = u.protocol;
        host = u.protocol;
      }
    } catch {
      /* keep empty */
    }
    entries.push({
      method: req.method(),
      url: req.url().slice(0, 300),
      host,
      origin,
      bodyBytes: req.postDataBuffer()?.length ?? 0,
      type: req.resourceType(),
    });
  });
  return entries;
}

// ── Metrics log (read by hand when writing the report) ───────────────────

export function logMetric(file: string, record: Record<string, unknown>): void {
  const path = join(ROOT, 'reports', 'data', file);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify({ at: new Date().toISOString(), ...record }) + '\n');
}

// ── CSP violations ───────────────────────────────────────────────────────

/** Collects Content-Security-Policy violations (console errors + securitypolicyviolation events). */
export async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  page.on('console', (m) => {
    const t = m.text();
    if (/content security policy|refused to (load|connect|execute|apply|create)/i.test(t))
      violations.push(t.slice(0, 300));
  });
  page.on('pageerror', (e) => {
    if (/content security policy/i.test(e.message)) violations.push(e.message.slice(0, 300));
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return violations;
}
