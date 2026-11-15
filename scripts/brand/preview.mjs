// Screenshot sheet of the brand icons (actual size and 8× zoom) for review.
// Run after build.mjs: node scripts/brand/preview.mjs
// Optional: BASE_URL=http://localhost:3000 also captures the site header.
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'scripts', 'brand', 'preview');
await mkdir(dir, { recursive: true });

const b64 = async (p) => (await readFile(join(root, p))).toString('base64');

// Pull the 16/32/48 PNGs out of favicon.ico.
const icoBuf = await readFile(join(root, 'app', 'favicon.ico'));
const count = icoBuf.readUInt16LE(4);
const icoPngs = [];
for (let i = 0; i < count; i++) {
  const o = 6 + i * 16;
  const size = icoBuf.readUInt8(o) || 256;
  const len = icoBuf.readUInt32LE(o + 8);
  const off = icoBuf.readUInt32LE(o + 12);
  icoPngs.push({ size, src: icoBuf.subarray(off, off + len).toString('base64') });
}
const apple = await b64('app/apple-icon.png');
const maskable = await b64('public/icons/icon-512-maskable.png');
const i192 = await b64('public/icons/icon-192.png');
const logo = await b64('public/og/logo.png');
const logoSvg = await b64('public/icons/logo.svg');

const cell = (label, src, size, zoom = 1) =>
  `<figure><img src="data:image/png;base64,${src}" width="${size * zoom}" height="${size * zoom}" style="image-rendering:${zoom > 1 ? 'pixelated' : 'auto'}"><figcaption>${label}</figcaption></figure>`;

const row = (bg) => `<section style="background:${bg}">
  ${icoPngs.map((p) => cell(`ico ${p.size}`, p.src, p.size)).join('')}
  ${icoPngs.map((p) => cell(`ico ${p.size} ×8`, p.src, p.size, p.size === 48 ? 4 : 8)).join('')}
  ${cell('apple 180', apple, 180)}
  ${cell('maskable 512 (circle)', maskable, 180).replace('<img ', '<img style="border-radius:50%" ')}
  ${cell('icon-192', i192, 96)}
  ${cell('og/logo 512', logo, 120)}
  <figure><img src="data:image/svg+xml;base64,${logoSvg}" height="48"><figcaption>logo.svg</figcaption></figure>
</section>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
await page.setContent(`<html><head><style>
  body{margin:0;font:12px sans-serif}
  section{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;padding:20px}
  figure{margin:0;text-align:center} figcaption{margin-top:4px;color:#888}
</style></head><body>${row('#f2ece1')}${row('#17120f')}${row('#ffffff')}</body></html>`);
await page.screenshot({ path: join(dir, 'icons.png'), fullPage: true });

// Browser-tab mock: favicon at real size next to a title.
await page.setViewportSize({ width: 420, height: 80 });
await page.setContent(`<html><body style="margin:0;background:#dee1e6;padding:16px;font:13px system-ui">
  <div style="display:inline-flex;gap:8px;align-items:center;background:#fff;border-radius:8px 8px 0 0;padding:8px 12px">
  <img src="data:image/png;base64,${icoPngs[0].src}" width="16" height="16">Compress image to 50KB · Img Samurai</div>
  <div style="display:inline-flex;gap:8px;align-items:center;background:#35363a;color:#fff;border-radius:8px 8px 0 0;padding:8px 12px">
  <img src="data:image/png;base64,${icoPngs[0].src}" width="16" height="16">Dark tab</div></body></html>`);
await page.screenshot({ path: join(dir, 'tab.png') });

const base = process.env.BASE_URL;
if (base) {
  for (const theme of ['light', 'dark']) {
    for (const width of [360, 1280]) {
      const p = await browser.newPage({ viewport: { width, height: 640 }, deviceScaleFactor: 2 });
      await p.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {}
      }, theme);
      await p.goto(`${base}/compress-image-to-50kb`, { waitUntil: 'networkidle' });
      await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await p.screenshot({ path: join(dir, `page-${width}-${theme}.png`) });
      await p.screenshot({
        path: join(dir, `header-${width}-${theme}.png`),
        clip: { x: 0, y: 0, width, height: width < 1024 ? 64 : 76 },
      });
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(200);
      await p.screenshot({ path: join(dir, `footer-${width}-${theme}.png`) });
      await p.close();
    }
  }
}
await browser.close();
console.log('preview written to', dir);
