// Helpers for the Phase 4 favicon tests: unzip, PNG/ICO parsing, in-browser PNG fixtures.
import { expect, type Locator, type Page } from '@playwright/test';
import { unzipSync, strFromU8 } from 'fflate';
import { downloadVia } from './tool';

export const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** PRODUCT.md section 4.4 file list; favicon.svg only for text and emoji. */
export function expectedZipNames(mode: 'image' | 'text' | 'emoji'): string[] {
  const n = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
  ];
  if (mode !== 'image') n.push('favicon.svg');
  n.push('site.webmanifest', 'README.txt');
  return n;
}

export function unzip(bytes: Buffer): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  for (const [k, v] of Object.entries(unzipSync(new Uint8Array(bytes)))) out[k] = Buffer.from(v);
  return out;
}
export const utf8 = (b: Buffer) => strFromU8(new Uint8Array(b));

export function pngHeader(b: Buffer) {
  const sig = b.subarray(0, 8).equals(PNG_SIG);
  return {
    sig,
    width: sig ? b.readUInt32BE(16) : -1,
    height: sig ? b.readUInt32BE(20) : -1,
    bitDepth: sig ? b[24] : -1,
    colorType: sig ? b[25] : -1,
    ihdr: b.subarray(12, 16).toString('latin1'),
  };
}

export interface IcoEntry {
  w: number;
  h: number;
  colors: number;
  reserved: number;
  planes: number;
  bpp: number;
  size: number;
  offset: number;
  png: Buffer;
  pngSig: boolean;
  pngW: number;
  pngH: number;
}
export function parseIco(b: Buffer) {
  const reserved = b.readUInt16LE(0);
  const type = b.readUInt16LE(2);
  const count = b.readUInt16LE(4);
  const entries: IcoEntry[] = [];
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    const e = {
      w: b[o] || 256,
      h: b[o + 1] || 256,
      colors: b[o + 2],
      reserved: b[o + 3],
      planes: b.readUInt16LE(o + 4),
      bpp: b.readUInt16LE(o + 6),
      size: b.readUInt32LE(o + 8),
      offset: b.readUInt32LE(o + 12),
    };
    const png = b.subarray(e.offset, e.offset + e.size);
    const hd = pngHeader(png);
    entries.push({ ...e, png, pngSig: hd.sig, pngW: hd.width, pngH: hd.height });
  }
  return { reserved, type, count, entries };
}

/** Creates a PNG in the page's browser: left half opaque colour, right half fully transparent when `alpha`. */
export async function makePng(
  page: Page,
  w: number,
  h: number,
  opts: { alpha?: boolean } = {},
): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ w, h, alpha }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#e11d48');
      g.addColorStop(1, '#2563eb');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, alpha ? w / 2 : w, h);
      const blob: Blob = await new Promise((r) => c.toBlob((x) => r(x!), 'image/png'));
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
      return btoa(s);
    },
    { w, h, alpha: !!opts.alpha },
  );
  return Buffer.from(b64, 'base64');
}

/** Pixel statistics of a PNG/JPEG decoded in the page's engine. */
export async function pixelStats(page: Page, bytes: Buffer, mime = 'image/png') {
  const b64 = bytes.toString('base64');
  return page.evaluate(
    async ({ b64: data, mime: type }) => {
      const bin = atob(data);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([arr], { type }));
      const c = document.createElement('canvas');
      c.width = bmp.width;
      c.height = bmp.height;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bmp, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      let minAlpha = 255;
      let transparentPx = 0;
      const colors = new Set<number>();
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < minAlpha) minAlpha = px[i + 3];
        if (px[i + 3] < 255) transparentPx++;
        if (px[i + 3] > 0) colors.add((px[i] << 16) | (px[i + 1] << 8) | px[i + 2]);
      }
      const at = (x: number, y: number) => {
        const k = (y * c.width + x) * 4;
        return [px[k], px[k + 1], px[k + 2], px[k + 3]];
      };
      return {
        width: bmp.width,
        height: bmp.height,
        minAlpha,
        transparentPx,
        distinctColors: colors.size,
        corner: at(0, 0),
        center: at(Math.floor(c.width / 2), Math.floor(c.height / 2)),
        right: at(c.width - 1, Math.floor(c.height / 2)),
      };
    },
    { b64, mime },
  );
}

export const fshell = (page: Page): Locator => page.getByTestId('favicon-shell');

export async function gotoFavicon(page: Page, slug: string): Promise<void> {
  page.on('dialog', (d) => void d.accept());
  await page.goto(`/${slug}`);
  await expect(fshell(page)).toBeVisible();
}

/** Waits until the preview is rendered for the current input. */
export async function waitPreviewReady(page: Page): Promise<void> {
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(page.getByTestId('favicon-preview')).toHaveAttribute('data-state', 'ready');
}

export async function chooseMode(page: Page, name: 'Image' | 'Text' | 'Emoji'): Promise<void> {
  await page.getByRole('radio', { name, exact: true }).click();
  await expect(fshell(page)).toHaveAttribute('data-mode', name.toLowerCase());
}

export async function downloadZip(page: Page) {
  await waitPreviewReady(page);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download-zip'));
  return { bytes, name, files: unzip(bytes) };
}

export async function previewSrcs(page: Page): Promise<string[]> {
  return page
    .getByTestId('favicon-preview')
    .locator('img')
    .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
}
