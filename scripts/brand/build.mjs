// Builds every brand asset from scripts/brand/mark.mjs.
// Run: node scripts/brand/build.mjs
// Uses Playwright's Chromium (already a dev dependency) to rasterize SVG to PNG,
// and writes the ICO container by hand (PNG-in-ICO, 16/32/48).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PAPER, SHU, pixelSvg16, sealSvg } from './mark.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = (p) => join(root, p);

async function save(path, data) {
  await mkdir(dirname(out(path)), { recursive: true });
  await writeFile(out(path), data);
  console.log('wrote', path);
}

/** Full-bleed seal (no padding, transparent outside the seal). */
const markSvg = (size, detail) => sealSvg({ size, detail });

/** Opaque square with the seal centred inside `pad` units (of 64). */
const paddedSvg = (size, pad, background, detail = 'full') =>
  sealSvg({ size, detail, pad, background });

const logoSvg = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64" width="300" height="64">` +
  `<g>${sealSvg({ size: 64 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` +
  `<style>.w{fill:#17120f}@media (prefers-color-scheme:dark){.w{fill:${PAPER}}}</style>` +
  `<text class="w" x="80" y="43" font-family="'Shippori Mincho', 'Yu Mincho', 'Hiragino Mincho ProN', Georgia, 'Times New Roman', serif" font-size="30" font-weight="800">Img <tspan fill="${SHU}">Samurai</tspan></text>` +
  `</svg>`;

function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function rasterize(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace(
      /width="\d+" height="\d+"/,
      `width="${size}" height="${size}"`,
    )}</body></html>`,
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// SVG masters
await save('public/icons/logo-mark.svg', markSvg(64, 'full') + '\n');
await save('public/icons/logo.svg', logoSvg() + '\n');
await save('app/icon.svg', markSvg(64, 'small') + '\n');

// ICO: 16 is pixel-hinted, 32 uses the small-detail seal, 48 the full one.
const icoPngs = [{ size: 16, data: await rasterize(pixelSvg16(), 16) }];
for (const [size, detail] of [
  [32, 'small'],
  [48, 'full'],
]) {
  icoPngs.push({ size, data: await rasterize(markSvg(size, detail), size) });
}
await save('app/favicon.ico', ico(icoPngs));

// Apple touch icon: opaque paper, seal centred (iOS adds its own rounded mask).
await save('app/apple-icon.png', await rasterize(paddedSvg(180, 8, PAPER), 180));

// PWA icons: transparent "any" icons, and a maskable one on solid crimson with
// the seal inside the 80% safe zone.
await save('public/icons/icon-192.png', await rasterize(markSvg(192, 'full'), 192));
await save('public/icons/icon-512.png', await rasterize(markSvg(512, 'full'), 512));
await save('public/icons/icon-512-maskable.png', await rasterize(paddedSvg(512, 12, SHU), 512));

// JSON-LD Organization logo.
await save('public/og/logo.png', await rasterize(paddedSvg(512, 4, PAPER), 512));

await browser.close();
