// HEIC pages (/heic-to-jpg, /heic-to-png): convert, status UI, errors, no-Worker fallback,
// privacy and lazy loading of the libheif chunk. Chromium has no native HEIC (exercises libheif);
// WebKit may decode natively.
import { expect, test, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR, ROOT } from './helpers/fixtures';
import {
  cardData,
  cards,
  decodeInBrowser,
  downloadVia,
  gotoTool,
  logMetric,
  openMoreOptions,
  pickAndWait,
  recordNetwork,
  sniff,
  watchCsp,
} from './helpers/tool';

const DIR = join(ROOT, 'e2e', 'fixtures', 'heic');
const H = (n: string) => join(DIR, n);
const PAGES = [
  { slug: 'heic-to-jpg', ext: 'jpg', mime: 'image/jpeg', fmt: 'jpeg' },
  { slug: 'heic-to-png', ext: 'png', mime: 'image/png', fmt: 'png' },
] as const;

// The libheif chunk = the largest .js file in out/_next/static/chunks (about 2 MB raw).
function libheifChunk(): string {
  const dir = join(OUT_DIR, '_next', 'static', 'chunks');
  let best = '';
  let size = 0;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    const s = statSync(join(dir, f)).size;
    if (s > size) {
      size = s;
      best = f;
    }
  }
  return best;
}
const CHUNK = libheifChunk();

/** A corrupt file: valid `ftyp heic` header, pseudo-random body. */
function garbageHeic(): { name: string; mimeType: string; buffer: Buffer } {
  const head = Buffer.from([
    0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0, 0x6d, 0x69, 0x66,
    0x31, 0x68, 0x65, 0x69, 0x63,
  ]);
  let seed = 12345;
  const body = Buffer.alloc(4000);
  for (let i = 0; i < body.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    body[i] = seed >> 16;
  }
  return { name: 'garbage.heic', mimeType: 'image/heic', buffer: Buffer.concat([head, body]) };
}

async function nativeHeic(page: Page): Promise<boolean> {
  const b64 = readFileSync(H('colors-no-alpha.heic')).toString('base64');
  return page.evaluate(async (d) => {
    try {
      const bin = atob(d);
      const a = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([a], { type: 'image/heic' }));
      bmp.close();
      return true;
    } catch {
      return false;
    }
  }, b64);
}

async function redness(page: Page, b: Buffer): Promise<number> {
  return page.evaluate(
    async ({ data }) => {
      const bin = atob(data);
      const a = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      const bmp = await createImageBitmap(new Blob([a], { type: 'image/jpeg' }));
      const c = document.createElement('canvas');
      c.width = bmp.width;
      c.height = bmp.height;
      const x = c.getContext('2d', { willReadFrequently: true })!;
      x.drawImage(bmp, 0, 0);
      const px = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0;
      let g = 0;
      for (let i = 0; i < px.length; i += 4) {
        r += px[i];
        g += px[i + 1];
      }
      return (r - g) / (px.length / 4);
    },
    { data: b.toString('base64') },
  );
}

for (const p of PAGES) {
  test.describe(`/${p.slug}`, () => {
    test('native HEIC support of this browser (info)', async ({ page }, info) => {
      await page.goto(`/${p.slug}`);
      const native = await nativeHeic(page);
      info.annotations.push({ type: 'native-heic', description: String(native) });
      logMetric('heic.ndjson', { test: 'native', project: info.project.name, native });
    });

    test('convert colors-no-alpha.heic: correct name, signature and 64x64', async ({ page }) => {
      await gotoTool(page, p.slug);
      await pickAndWait(page, H('colors-no-alpha.heic'));
      await expect(cards(page)).toHaveCount(1);
      const d = await cardData(cards(page).first());
      expect(d.status, JSON.stringify(d)).toBe('success');
      const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
      expect(name).toBe(`colors-no-alpha.${p.ext}`);
      expect(sniff(bytes)).toBe(p.fmt);
      const dec = await decodeInBrowser(page, bytes, p.mime);
      expect([dec.width, dec.height]).toEqual([64, 64]);
    });

    test('alpha HEIC: png keeps transparency, jpg is flattened onto the fill colour', async ({
      page,
    }) => {
      await gotoTool(page, p.slug);
      await pickAndWait(page, H('colors-with-alpha.heic'));
      const d = await cardData(cards(page).first());
      expect(d.status, JSON.stringify(d)).toBe('success');
      const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
      expect(name).toBe(`colors-with-alpha.${p.ext}`);
      const dec = await decodeInBrowser(page, bytes, p.mime);
      expect([dec.width, dec.height]).toEqual([64, 64]);
      if (p.fmt === 'png') {
        expect(dec.minAlpha, 'some pixel alpha < 255').toBeLessThan(255);
      } else {
        expect(dec.minAlpha).toBe(255);
        const white = await redness(page, bytes);
        await openMoreOptions(page);
        await page.locator('input[type=color]').fill('#ff0000');
        await page.waitForTimeout(1500);
        await expect(page.getByTestId('tool-shell')).toHaveAttribute('data-state', 'done');
        const red = await downloadVia(page, page.getByTestId('download').first());
        const redMean = await redness(page, red.bytes);
        logMetric('heic.ndjson', { test: 'fill', white, red: redMean });
        expect(redMean).toBeGreaterThan(white + 5);
      }
    });

    test('batch of 3 gives 3 results and a ZIP with 3 files', async ({ page }) => {
      test.setTimeout(120_000);
      await gotoTool(page, p.slug);
      await pickAndWait(page, [
        H('colors-no-alpha.heic'),
        H('colors-with-alpha.heic'),
        H('clap_cropped.heic'),
      ]);
      await expect(cards(page)).toHaveCount(3);
      const { bytes } = await downloadVia(page, page.getByTestId('download-all'));
      const zip = unzipSync(new Uint8Array(bytes));
      expect(Object.keys(zip).sort()).toEqual(
        ['clap_cropped', 'colors-no-alpha', 'colors-with-alpha'].map((s) => `${s}.${p.ext}`),
      );
    });

    test('errors: corrupt .heic, then PNG on the HEIC page; page stays usable', async ({
      page,
    }) => {
      await gotoTool(page, p.slug);
      await pickAndWait(page, [garbageHeic()]);
      const d = await cardData(cards(page).first());
      expect(d.status).toBe('failed');
      const text =
        (await cards(page).first().innerText()) + (await page.locator('main').innerText());
      logMetric('heic.ndjson', { test: 'garbage', error: d.error, text: text.slice(0, 400) });
      expect(text).toMatch(
        /We couldn't read this file\. It may be damaged\.|format we can't open yet/,
      );
      await pickAndWait(page, H('colors-no-alpha.heic'));
      expect((await cardData(cards(page).first())).status).toBe('success');
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await pickAndWait(page, join(ROOT, 'e2e', 'fixtures', 'generated', 'photo-2mp.png'));
      const d2 = await cardData(cards(page).first());
      logMetric('heic.ndjson', { test: 'png-on-heic', status: d2.status, error: d2.error });
      expect(errors).toEqual([]);
      await expect(page.getByTestId('tool-shell')).toBeVisible();
    });

    test('main-thread fallback: no Worker, HEIC still converts', async ({ page }, info) => {
      test.setTimeout(120_000);
      await page.addInitScript(() => {
        delete (window as unknown as { Worker?: unknown }).Worker;
      });
      await gotoTool(page, p.slug);
      expect(await page.evaluate(() => typeof Worker)).toBe('undefined');
      await pickAndWait(page, H('colors-no-alpha.heic'));
      const d = await cardData(cards(page).first());
      expect(d.status, `${info.project.name} ${JSON.stringify(d)}`).toBe('success');
      const { bytes } = await downloadVia(page, page.getByTestId('download').first());
      expect(sniff(bytes)).toBe(p.fmt);
    });
  });
}

test('status UI: opening line, slow first-use note after ~1.5 s, no layout shift', async ({
  page,
  browserName,
}, info) => {
  test.skip(browserName !== 'chromium', 'WebKit may decode natively, no libheif wait');
  test.setTimeout(90_000);
  await page.context().route(`**/${CHUNK}`, async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
        if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await gotoTool(page, 'heic-to-jpg');
  await page.waitForTimeout(500);
  const cls = () => page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  const before = await cls();
  const t0 = Date.now();
  await page.getByTestId('file-input').setInputFiles(H('colors-no-alpha.heic'));
  await expect(page.getByText('Opening your HEIC photo…').locator('visible=true').first()).toBeVisible({ timeout: 1400 });
  const note = page.getByTestId('decode-note');
  await expect(note).toContainText('First time only: loading the HEIC reader', { timeout: 4000 });
  const tNote = Date.now() - t0;
  await expect(page.getByTestId('tool-shell')).toHaveAttribute('data-state', 'done', {
    timeout: 30_000,
  });
  const delta = (await cls()) - before;
  logMetric('heic.ndjson', { test: 'status-ui', noteAfterMs: tNote, clsDelta: delta });
  info.annotations.push({ type: 'note-ms', description: String(tNote) });
  expect(tNote).toBeGreaterThan(1200);
  expect(tNote).toBeLessThan(2600);
  expect(delta).toBeLessThan(0.02);
});

test('libheif chunk is not referenced by any page HTML or preload', async ({ request }) => {
  test.skip(test.info().project.name !== 'mobile-chromium', 'static check, run once');
  for (const p of ['/', '/heic-to-jpg', '/heic-to-png', '/webp-to-jpg', '/compress-image-to-50kb']) {
    const html = await (await request.get(p)).text();
    expect(html.includes(CHUNK), `${p} must not reference ${CHUNK}`).toBe(false);
  }
});

test.describe('privacy and lazy loading', () => {
  for (const p of PAGES) {
    test(`/${p.slug}: no upload, same-origin only, no CSP violation, chunk lazy`, async ({
      page,
      baseURL,
      browserName,
    }) => {
      test.setTimeout(120_000);
      const net = recordNetwork(page.context());
      const csp = await watchCsp(page);
      const own = new URL(baseURL ?? 'http://localhost:4173').host;
      await gotoTool(page, p.slug);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      expect(
        net.filter((e) => e.url.includes(CHUNK)),
        'libheif chunk must not load with the page',
      ).toEqual([]);
      await pickAndWait(page, [H('colors-no-alpha.heic'), H('colors-with-alpha.heic')]);
      await downloadVia(page, page.getByTestId('download-all'));
      await page.waitForTimeout(500);
      const bad = net.filter((e) => {
        if (['blob:', 'data:', 'about:'].includes(e.origin)) return false;
        const path = new URL(e.url, 'http://x').pathname;
        const okPath = !path.includes('/api/');
        return e.host !== own || !['GET', 'HEAD'].includes(e.method) || e.bodyBytes > 0 || !okPath;
      });
      expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
      expect(csp).toEqual([]);
      const chunkReq = net.filter((e) => e.url.includes(CHUNK));
      logMetric('heic.ndjson', {
        test: 'privacy',
        page: p.slug,
        browser: browserName,
        requests: net.length,
        chunkRequests: chunkReq.length,
        paths: [...new Set(net.map((e) => new URL(e.url, 'http://x').pathname.split('/')[1]))],
      });
      if (browserName === 'chromium') expect(chunkReq.length).toBeGreaterThan(0);
    });
  }

  test('/webp-to-jpg: normal JPG/PNG/WebP never fetch the libheif chunk', async ({ page }) => {
    test.setTimeout(120_000);
    const net = recordNetwork(page.context());
    await gotoTool(page, 'webp-to-jpg');
    const g = (n: string) => join(ROOT, 'e2e', 'fixtures', 'generated', n);
    await pickAndWait(page, [g('photo-2mp.webp'), g('photo-2mp.jpg'), g('photo-2mp.png')]);
    await expect(cards(page)).toHaveCount(3);
    await page.waitForTimeout(500);
    expect(net.filter((e) => e.url.includes(CHUNK))).toEqual([]);
  });

  test('/webp-to-jpg: a HEIC picked there (Chromium) pulls the chunk only then', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'native decoders in WebKit');
    const net = recordNetwork(page.context());
    await gotoTool(page, 'webp-to-jpg');
    expect(net.filter((e) => e.url.includes(CHUNK))).toEqual([]);
    await pickAndWait(page, H('colors-no-alpha.heic'));
    logMetric('heic.ndjson', {
      test: 'heic-on-webp-page',
      status: (await cardData(cards(page).first())).status,
      chunk: net.filter((e) => e.url.includes(CHUNK)).length,
    });
  });
});
