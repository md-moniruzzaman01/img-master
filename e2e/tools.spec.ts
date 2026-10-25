// Section 2: the tools work. Real outputs are downloaded and decoded.
import { expect, test, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';
import { basename, extname } from 'node:path';
import { ensureFixtures, fixture, fixtureBytes, realFixtures } from './helpers/fixtures';
import {
  CONVERTER_PAGES,
  FMT_EXT,
  FMT_MIME,
  SIZE_PAGES,
  cardData,
  cards,
  decodeInBrowser,
  downloadVia,
  gotoTool,
  logMetric,
  openMoreOptions,
  pickAndWait,
  sniff,
  watchCsp,
  type Fmt,
} from './helpers/tool';

test.beforeAll(ensureFixtures);

const stem = (f: string) => basename(f, extname(f));
const UNREACHABLE_MSG = /We couldn't get this image under .+ and keep it readable\. Try .+\./;
const NOT_IMAGE_MSG = "We can't open this file. Try a JPG, PNG or WebP image.";

// Fixtures that a normal photo-ish page must be able to reach every target with.
const REALISTIC = [
  'photo-12mp.jpg',
  'photo-2mp.png',
  'transparent.png',
  'signature.png',
  'photo-small.jpg',
  'tall-1000x8000.jpg',
];
const realList = realFixtures().map((f) => ({ name: `real/${f.name}`, path: f.path }));

async function checkCompressOutput(
  page: Page,
  file: { name: string; path: string },
  sp: (typeof SIZE_PAGES)[number],
  mustReach: boolean,
  tag: string,
) {
  await pickAndWait(page, file.path);
  const card = cards(page).first();
  const d = await cardData(card);
  logMetric('compress-matrix.ndjson', {
    tag,
    page: sp.slug,
    fixture: file.name,
    status: d.status,
    error: d.error,
    inputBytes: d.inputBytes,
    outputBytes: d.outputBytes,
    width: d.width,
    height: d.height,
    quality: d.quality,
    ms: d.ms,
    notes: d.notes,
    project: test.info().project.name,
  });
  if (d.status === 'failed') {
    expect(d.error, 'only an honest unreachable message is acceptable').toBe('TARGET_UNREACHABLE');
    await expect(card).toContainText(UNREACHABLE_MSG);
    expect(mustReach, `${file.name} should be reachable at ${sp.kb} KB`).toBe(false);
    return;
  }
  expect(d.status).toBe('success');
  // PRODUCT.md 4.1: under target in decimal (so also under in binary).
  expect(d.outputBytes).toBeLessThanOrEqual(sp.kb * 1000);
  expect(d.format).toBe('jpeg');
  const base = stem(file.path.split(/[\\/]/).pop() ?? 'image');
  expect(d.fileName).toBe(`${base}${sp.suffix}.jpg`);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
  expect(name).toBe(d.fileName);
  expect(bytes.length).toBe(d.outputBytes);
  expect(sniff(bytes)).toBe('jpeg');
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect(dec.width).toBe(d.width);
  expect(dec.height).toBe(d.height);
}

for (const sp of SIZE_PAGES) {
  for (const f of REALISTIC) {
    test(`compress-to-size ${sp.kb}KB: ${f}`, async ({ page }) => {
      test.setTimeout(150_000);
      const csp = await watchCsp(page);
      await gotoTool(page, sp.slug);
      await checkCompressOutput(page, { name: f, path: fixture(f) }, sp, true, 'generated');
      expect(csp).toEqual([]);
    });
  }
  test(`compress-to-size ${sp.kb}KB: pure noise image (unreachable allowed)`, async ({ page }) => {
    test.setTimeout(150_000);
    await gotoTool(page, sp.slug);
    await checkCompressOutput(
      page,
      { name: 'noise-1200.jpg', path: fixture('noise-1200.jpg') },
      sp,
      false,
      'generated',
    );
  });
  for (const rf of realList) {
    test(`compress-to-size ${sp.kb}KB: ${rf.name}`, async ({ page }) => {
      test.setTimeout(150_000);
      await gotoTool(page, sp.slug);
      await checkCompressOutput(page, rf, sp, false, 'real');
    });
  }
}
if (realList.length === 0) {
  test('compress-to-size: real photos in e2e/fixtures/real', () => {
    test.skip(
      true,
      'e2e/fixtures/real/ is empty; real-photo runs are skipped until the owner adds files',
    );
  });
}

test('compress-to-size: changing the target chip re-runs and respects the new size', async ({
  page,
}) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const a = await cardData(cards(page).first());
  expect(a.outputBytes).toBeLessThanOrEqual(50_000);
  await page.getByRole('radio', { name: '200KB' }).click();
  await expect
    .poll(async () => (await cardData(cards(page).first())).outputBytes, { timeout: 30_000 })
    .toBeGreaterThan(a.outputBytes);
  const b = await cardData(cards(page).first());
  expect(b.outputBytes).toBeLessThanOrEqual(200_000);
});

test('compress-to-size: WebP output works or says so (never a broken file)', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-100kb');
  await openMoreOptions(page);
  await page.getByRole('radio', { name: 'WebP' }).click();
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const card = cards(page).first();
  const d = await cardData(card);
  if (d.status === 'success') {
    expect(d.format).toBe('webp');
    expect(d.outputBytes).toBeLessThanOrEqual(100_000);
    const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
    expect(name).toMatch(/\.webp$/);
    expect(sniff(bytes)).toBe('webp');
    await decodeInBrowser(page, bytes, 'image/webp');
  } else {
    expect(d.error).toBe('ENCODE_UNSUPPORTED');
    await expect(page.getByTestId('error-banner')).toContainText(
      "Your browser can't save WebP files yet. Try Chrome or Firefox, or choose JPG.",
    );
    await expect(page.getByTestId('download')).toHaveCount(0);
  }
  test.info().annotations.push({ type: 'webp-compress', description: d.status ?? '' });
});

// ── Converters ───────────────────────────────────────────────────────────

async function checkConvert(page: Page, input: string, to: Fmt, expectBase?: string) {
  await pickAndWait(page, fixture(input));
  const card = cards(page).first();
  const d = await cardData(card);
  if (to === 'webp' && d.status === 'failed') {
    // Allowed only as the documented message, never a broken file.
    expect(d.error).toBe('ENCODE_UNSUPPORTED');
    await expect(page.getByTestId('error-banner')).toContainText(
      "Your browser can't save WebP files yet",
    );
    await expect(page.getByTestId('download')).toHaveCount(0);
    test
      .info()
      .annotations.push({ type: 'webp-output', description: 'ENCODE_UNSUPPORTED message shown' });
    return null;
  }
  expect(d.status).toBe('success');
  expect(d.format).toBe(to);
  expect(d.fileName).toBe(`${expectBase ?? stem(input)}.${FMT_EXT[to]}`);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
  expect(name).toBe(d.fileName);
  expect(sniff(bytes)).toBe(to);
  expect(bytes.length).toBe(d.outputBytes);
  const dec = await decodeInBrowser(page, bytes, FMT_MIME[to]);
  expect(dec.width).toBe(d.width);
  expect(dec.height).toBe(d.height);
  return { d, bytes, dec };
}

const mimeOf = (f: string) =>
  f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'image/jpeg';

for (const c of CONVERTER_PAGES) {
  test(`converter /${c.slug}: ${c.input} -> ${c.to}`, async ({ page }) => {
    test.setTimeout(120_000);
    await gotoTool(page, c.slug);
    const r = await checkConvert(page, c.input, c.to);
    if (r) {
      // Dimensions are unchanged by a conversion.
      const src = await decodeInBrowser(page, fixtureBytes(c.input), mimeOf(c.input));
      expect(r.dec.width).toBe(src.width);
      expect(r.dec.height).toBe(src.height);
    }
  });
}

test('converter png-to-jpg: transparent PNG gets a solid (white) background', async ({ page }) => {
  await gotoTool(page, 'png-to-jpg');
  const r = await checkConvert(page, 'transparent.png', 'jpeg');
  expect(r?.d.notes).toContain('transparency-flattened');
  expect(r?.dec.minAlpha).toBe(255);
  const [R, G, B] = r!.dec.corner;
  expect(R).toBeGreaterThan(245);
  expect(G).toBeGreaterThan(245);
  expect(B).toBeGreaterThan(245);
  await expect(page.getByText('Background color').first()).toBeVisible();
  // Changing the background re-runs with the new color.
  await page.locator('input[type=color]').fill('#ff0000');
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('tool-shell')).toHaveAttribute('data-state', 'done');
  const { bytes } = await downloadVia(page, page.getByTestId('download').first());
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect(dec.corner[0]).toBeGreaterThan(200);
  expect(dec.corner[1]).toBeLessThan(60);
  expect(dec.corner[2]).toBeLessThan(60);
});

test('converter webp-to-jpg: transparent WebP also flattens', async ({ page }) => {
  await gotoTool(page, 'webp-to-jpg');
  const r = await checkConvert(page, 'transparent.webp', 'jpeg');
  expect(r?.dec.minAlpha).toBe(255);
  expect(r?.d.notes).toContain('transparency-flattened');
});

test('converter webp-to-png keeps transparency', async ({ page }) => {
  await gotoTool(page, 'webp-to-png');
  const r = await checkConvert(page, 'transparent.webp', 'png');
  expect(r?.dec.minAlpha).toBeLessThan(10);
});

test('converter png-to-webp: transparent PNG keeps alpha when WebP is supported', async ({
  page,
}) => {
  await gotoTool(page, 'png-to-webp');
  const r = await checkConvert(page, 'transparent.png', 'webp');
  if (r) expect(r.dec.minAlpha).toBeLessThan(10);
});

test('image-converter: every output format from a JPG, PNG and WebP source', async ({ page }) => {
  test.setTimeout(180_000);
  await gotoTool(page, 'image-converter');
  for (const [label, to] of [
    ['JPG', 'jpeg'],
    ['PNG', 'png'],
    ['WebP', 'webp'],
  ] as const) {
    await page.getByRole('radio', { name: label, exact: true }).click();
    for (const input of ['photo-2mp.jpg', 'photo-2mp.png', 'photo-2mp.webp']) {
      await pickAndWait(page, fixture(input));
      const d = await cardData(cards(page).first());
      if (to === 'webp' && d.status === 'failed') {
        expect(d.error).toBe('ENCODE_UNSUPPORTED');
        continue;
      }
      expect(d.status, `${input} -> ${label}`).toBe('success');
      expect(d.format).toBe(to);
      expect(d.fileName).toBe(`${stem(input)}.${FMT_EXT[to]}`);
      const { bytes } = await downloadVia(page, page.getByTestId('download').first());
      expect(sniff(bytes)).toBe(to);
    }
  }
});

test('image-converter: GIF (first frame, note) and BMP inputs', async ({ page }) => {
  await gotoTool(page, 'image-converter');
  await pickAndWait(page, fixture('animated.gif'));
  const g = await cardData(cards(page).first());
  expect(g.status).toBe('success');
  expect(g.notes).toContain('animation-dropped');
  await expect(cards(page).first()).toContainText(
    'This was an animation. We kept the first frame.',
  );
  await pickAndWait(page, fixture('sample.bmp'));
  const b = await cardData(cards(page).first());
  expect(b.status).toBe('success');
  expect([b.width, b.height]).toEqual([300, 200]);
});

test('compress-image hub: quality mode and size mode both work', async ({ page }) => {
  await gotoTool(page, 'compress-image');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  let d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect(d.outputBytes).toBeLessThan(d.inputBytes);
  expect(d.fileName).toBe('photo-2mp-compressed.jpg');
  await page.getByRole('radio', { name: 'Pick a size' }).click();
  await page.getByRole('radio', { name: '100KB' }).click();
  await expect
    .poll(async () => (await cardData(cards(page).first())).outputBytes, { timeout: 30_000 })
    .toBeLessThanOrEqual(100_000);
  d = await cardData(cards(page).first());
  expect(d.format).toBe('jpeg');
});

// ── Batch and ZIP ────────────────────────────────────────────────────────

test('batch of 10 files: 10 cards, ZIP has 10 right-named files', async ({ page }) => {
  test.setTimeout(240_000);
  const src = fixtureBytes('photo-2mp.jpg');
  const files = Array.from({ length: 10 }, (_, i) => ({
    name: i < 8 ? `holiday ${i + 1}.jpg` : 'dup.jpg',
    mimeType: 'image/jpeg',
    buffer: src,
  }));
  await gotoTool(page, 'compress-image-to-100kb');
  await pickAndWait(page, files);
  await expect(cards(page)).toHaveCount(10);
  for (let i = 0; i < 10; i++) expect((await cardData(cards(page).nth(i))).status).toBe('success');
  await expect(page.getByTestId('download')).toHaveCount(10);
  await expect(page.getByTestId('download-all')).toBeVisible();
  const { bytes, name } = await downloadVia(page, page.getByTestId('download-all'));
  expect(name).toBe('img-master-compress-image-to-100kb.zip');
  expect(sniff(bytes)).toBe('zip');
  const zip = unzipSync(new Uint8Array(bytes));
  const expected = [
    ...Array.from({ length: 8 }, (_, i) => `holiday-${i + 1}-100kb.jpg`),
    'dup-100kb.jpg',
    'dup-100kb-2.jpg',
  ].sort();
  expect(Object.keys(zip).sort()).toEqual(expected);
  for (const [n, data] of Object.entries(zip)) {
    expect(data.length, n).toBeLessThanOrEqual(100_000);
    expect(sniff(Buffer.from(data))).toBe('jpeg');
  }
});

test('batch of 10 converted to PNG: ZIP names and types', async ({ page }) => {
  test.setTimeout(240_000);
  const src = fixtureBytes('photo-small.jpg');
  const files = Array.from({ length: 10 }, (_, i) => ({
    name: `pic${i}.jpg`,
    mimeType: 'image/jpeg',
    buffer: src,
  }));
  await gotoTool(page, 'jpg-to-png');
  await pickAndWait(page, files);
  const { bytes } = await downloadVia(page, page.getByTestId('download-all'));
  const zip = unzipSync(new Uint8Array(bytes));
  expect(Object.keys(zip).sort()).toEqual(
    Array.from({ length: 10 }, (_, i) => `pic${i}.png`).sort(),
  );
  for (const data of Object.values(zip)) expect(sniff(Buffer.from(data))).toBe('png');
});

// ── Edge cases and messages (DESIGN.md section 6) ────────────────────────

for (const bad of ['corrupt.jpg', 'not-an-image.png', 'empty.jpg']) {
  test(`edge: ${bad} shows "Not an image" and offers no download`, async ({ page }) => {
    await gotoTool(page, 'compress-image-to-50kb');
    await pickAndWait(page, fixture(bad));
    const card = cards(page).first();
    expect((await cardData(card)).status).toBe('failed');
    await expect(card).toContainText(NOT_IMAGE_MSG);
    await expect(page.getByTestId('download')).toHaveCount(0);
    await expect(page.getByTestId('action-bar')).toHaveCount(0);
  });
}

test('edge: good and bad file together -> partial, good one still downloadable', async ({
  page,
}) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, [fixture('corrupt.jpg'), fixture('photo-2mp.jpg')]);
  await expect(page.getByTestId('tool-shell')).toHaveAttribute('data-state', 'partial');
  await expect(page.getByTestId('download').first()).toBeVisible();
});

test('edge: 40x40 image is not upscaled and does not crash', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-20kb');
  await pickAndWait(page, fixture('tiny-40.png'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect([d.width, d.height]).toEqual([40, 40]);
  expect(d.notes).toContain('already-small');
  await expect(cards(page).first()).toContainText(
    /Already under 20 ?KB\. We saved a clean copy without hidden photo data\./,
  );
});

test('edge: very tall 1000x8000 keeps its aspect ratio', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-100kb');
  await pickAndWait(page, fixture('tall-1000x8000.jpg'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect(d.outputBytes).toBeLessThanOrEqual(100_000);
  expect(Math.abs(d.height / d.width - 8) / 8).toBeLessThan(0.02);
});

test('edge: 48 MP photo is downscaled first, with the "very large" note', async ({ page }) => {
  test.setTimeout(240_000);
  await gotoTool(page, 'compress-image-to-200kb');
  await pickAndWait(page, fixture('photo-48mp.jpg'), 200_000);
  const card = cards(page).first();
  const d = await cardData(card);
  logMetric('compress-matrix.ndjson', { tag: '48mp', project: test.info().project.name, ...d });
  expect(d.status).toBe('success');
  expect(d.notes).toContain('downscaled-for-memory');
  expect(d.outputBytes).toBeLessThanOrEqual(200_000);
  await expect(card).toContainText(
    'This photo is very large, so we reduced its dimensions first to keep your phone fast.',
  );
});

test('edge: animated GIF -> first frame with the animation note', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('animated.gif'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect(d.notes).toContain('animation-dropped');
  expect([d.width, d.height]).toEqual([96, 64]);
});

test('edge: 11 files -> first 10 are taken, with the "too many" message', async ({ page }) => {
  test.setTimeout(240_000);
  const src = fixtureBytes('photo-small.jpg');
  const files = Array.from({ length: 11 }, (_, i) => ({
    name: `p${i}.jpg`,
    mimeType: 'image/jpeg',
    buffer: src,
  }));
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, files);
  await expect(cards(page)).toHaveCount(10);
  await expect(page.getByTestId('error-banner')).toContainText(
    'You can add up to 10 images at once. We took the first 10.',
  );
});

test('edge: unreachable target -> honest message, next-size button, works after "allow smaller"', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await gotoTool(page, 'compress-image-to-20kb');
  await openMoreOptions(page);
  await page.getByRole('switch', { name: /Keep original dimensions/ }).click();
  await pickAndWait(page, fixture('noise-1200.jpg'));
  const card = cards(page).first();
  const d = await cardData(card);
  expect(d.status).toBe('failed');
  expect(d.error).toBe('TARGET_UNREACHABLE');
  await expect(card).toContainText(UNREACHABLE_MSG);
  await expect(card).toContainText('allow smaller dimensions');
  await expect(card.getByRole('button', { name: /^Try / })).toBeVisible();
  await card.getByRole('button', { name: 'Allow smaller dimensions' }).click();
  await expect
    .poll(async () => (await cardData(cards(page).first())).status, { timeout: 60_000 })
    .toMatch(/success|failed/);
  const after = await cardData(cards(page).first());
  if (after.status === 'success') expect(after.outputBytes).toBeLessThanOrEqual(20_000);
});

test('content privacy: EXIF/GPS data is removed from outputs', async ({ page }) => {
  const input = fixtureBytes('exif-gps.jpg');
  expect(input.includes('IMGMASTER-QA-GPS-TEST')).toBe(true);
  await gotoTool(page, 'compress-image-to-500kb');
  await pickAndWait(page, fixture('exif-gps.jpg'));
  const { bytes } = await downloadVia(page, page.getByTestId('download').first());
  expect(bytes.includes('IMGMASTER-QA-GPS-TEST')).toBe(false);
  expect(bytes.includes('Exif')).toBe(false);
  await gotoTool(page, 'jpg-to-png');
  await pickAndWait(page, fixture('exif-gps.jpg'));
  const c = await downloadVia(page, page.getByTestId('download').first());
  expect(c.bytes.includes('IMGMASTER-QA-GPS-TEST')).toBe(false);
});

test('edge: EXIF orientation 6 is applied (portrait output)', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('exif-orientation6.jpg'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect([d.width, d.height]).toEqual([240, 320]);
});

test('edge: a second batch replaces the first (no stale cards)', async ({ page }) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('photo-small.jpg'));
  await pickAndWait(page, [fixture('photo-small.jpg'), fixture('tiny-40.jpg')]);
  await expect(cards(page)).toHaveCount(2);
});

test('engine: Web Worker is used where OffscreenCanvas exists, main-thread fallback otherwise', async ({
  page,
  browserName,
}) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const hasOffscreen = await page.evaluate(() => typeof OffscreenCanvas !== 'undefined');
  const workers = page.workers().length;
  test
    .info()
    .annotations.push({
      type: 'engine-path',
      description: `${browserName}: OffscreenCanvas=${hasOffscreen}, workers=${workers}`,
    });
  if (hasOffscreen) expect(workers).toBeGreaterThan(0);
  else expect(workers).toBe(0);
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
});
