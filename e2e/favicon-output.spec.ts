// Phase 4: favicon tools, output correctness per mode and /png-to-ico.
import { expect, test } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { cards, downloadVia } from './helpers/tool';
import {
  chooseMode,
  downloadZip,
  fshell,
  gotoFavicon,
  makePng,
  parseIco,
  pixelStats,
  pngHeader,
  previewSrcs,
  unzip,
  utf8,
  waitPreviewReady,
} from './helpers/favicon';
import { checkPackage, checkSvg } from './helpers/favicon-check';

test.beforeAll(ensureFixtures);

const text = (p: import('@playwright/test').Page) => p.getByTestId('text-input');
const emoji = (p: import('@playwright/test').Page) => p.getByTestId('emoji-input');

// ── ZIP contents per mode ────────────────────────────────────────────────

test('ZIP (text mode, /favicon-from-text): every file, ICO 16/32/48, PNG sizes, manifest, README, SVG', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-text');
  await expect(fshell(page)).toHaveAttribute('data-mode', 'text');
  await text(page).fill('Ab');
  const { files, name } = await downloadZip(page);
  expect(name).toBe('favicon-package.zip');
  await checkPackage(page, files, 'text');
  await checkSvg(page, files['favicon.svg'], 'Ab');
  expect(JSON.parse(utf8(files['site.webmanifest'])).name).toBe('Ab');
  const ico = await downloadVia(page, page.getByTestId('download-ico'));
  expect(ico.name).toBe('favicon.ico');
  expect(ico.bytes.equals(files['favicon.ico'])).toBe(true);
});

test('ZIP (emoji mode, /favicon-from-emoji): every file incl. SVG; PNG not blank', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-emoji');
  await expect(fshell(page)).toHaveAttribute('data-mode', 'emoji');
  await emoji(page).fill('🚀');
  const { files } = await downloadZip(page);
  await checkPackage(page, files, 'emoji');
  await checkSvg(page, files['favicon.svg'], '🚀');
  const st = await pixelStats(page, files['android-chrome-512x512.png']);
  expect(st.distinctColors, 'emoji drawn (many colours)').toBeGreaterThan(8);
});

test('ZIP (image mode, /favicon-generator): no favicon.svg; rest complete', async ({ page }) => {
  await gotoFavicon(page, 'favicon-generator');
  await expect(fshell(page)).toHaveAttribute('data-mode', 'image');
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  const { files } = await downloadZip(page);
  await checkPackage(page, files, 'image');
  expect(files['favicon.svg']).toBeUndefined();
});

test('hub switches modes: text and emoji ZIPs from /favicon-generator', async ({ page }) => {
  await gotoFavicon(page, 'favicon-generator');
  await chooseMode(page, 'Text');
  await text(page).fill('QA');
  let z = await downloadZip(page);
  await checkPackage(page, z.files, 'text');
  await chooseMode(page, 'Emoji');
  await emoji(page).fill('🔥');
  z = await downloadZip(page);
  await checkPackage(page, z.files, 'emoji');
  await chooseMode(page, 'Image');
  await expect(fshell(page)).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('download-ico')).toBeDisabled();
  await expect(page.getByTestId('download-zip')).toHaveCount(0);
});

// ── Text / emoji / image behaviour ───────────────────────────────────────

test('text mode: 1 to 3 characters kept, 4th dropped; whitespace trimmed', async ({ page }) => {
  await gotoFavicon(page, 'favicon-from-text');
  for (const [typed, kept] of [
    ['A', 'A'],
    ['ab', 'ab'],
    ['abc', 'abc'],
    ['abcd', 'abc'],
    ['  xy', 'xy'],
  ] as const) {
    await text(page).fill(typed);
    await expect(text(page)).toHaveValue(kept);
    await waitPreviewReady(page);
  }
});

test('text mode: Bengali text renders (not blank) and lands in the SVG', async ({ page }) => {
  await gotoFavicon(page, 'favicon-from-text');
  await text(page).fill('আ');
  await expect(text(page)).toHaveValue('আ');
  const { files } = await downloadZip(page);
  await checkSvg(page, files['favicon.svg'], 'আ');
  const st = await pixelStats(page, files['android-chrome-512x512.png']);
  test.info().annotations.push({ type: 'bengali-colors', description: String(st.distinctColors) });
  expect(st.distinctColors, 'glyph drawn').toBeGreaterThan(5);
  await text(page).fill('আমি');
  await expect(text(page)).toHaveValue('আমি');
});

test('text mode: empty or whitespace-only disables every download and shows the hint', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  for (const v of ['', '   ']) {
    await text(page).fill(v);
    await expect(page.getByText('Type 1 to 3 characters to see your icon.')).toBeVisible();
    await expect(page.getByTestId('download-ico')).toBeDisabled();
    await expect(page.getByTestId('download-zip')).toHaveCount(0);
    await expect(fshell(page)).not.toHaveAttribute('data-state', 'error');
    // Observed (QA-10): the previous icon stays in the preview and the Copy button stays enabled.
    test.info().annotations.push({
      type: `empty text "${v}"`,
      description: `preview=${await page.getByTestId('favicon-preview').getAttribute('data-state')} copyDisabled=${await page.getByTestId('copy-snippet').isDisabled()}`,
    });
  }
  await text(page).fill('Z');
  await waitPreviewReady(page);
  await expect(page.getByTestId('download-zip')).toBeVisible();
  await expect(page.getByTestId('download-ico')).toBeEnabled();
});

test('emoji mode: pasting two emoji keeps one; ZWJ family and flag count as one', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-emoji');
  await emoji(page).fill('😀😎');
  await expect(emoji(page)).toHaveValue('😎');
  const family = '👨‍👩‍👧‍👦';
  await emoji(page).fill(family);
  await expect(emoji(page)).toHaveValue(family);
  await waitPreviewReady(page);
  const { files } = await downloadZip(page);
  await checkSvg(page, files['favicon.svg'], family);
  await emoji(page).fill('🇧🇩');
  await expect(emoji(page)).toHaveValue('🇧🇩');
  await emoji(page).fill('❤️');
  await expect(emoji(page)).toHaveValue('❤️');
  await page.getByRole('radio', { name: 'Rocket' }).click();
  await expect(emoji(page)).toHaveValue('🚀');
  await emoji(page).fill('');
  await expect(page.getByTestId('download-ico')).toBeDisabled();
  await expect(page.getByTestId('download-zip')).toHaveCount(0);
});

test('image mode: shape, zoom, padding and transparent switch change the output', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoFavicon(page, 'favicon-generator');
  await expect(fshell(page)).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('favicon-preview')).toHaveAttribute('data-state', 'empty');
  await page.getByTestId('file-input').setInputFiles(fixture('transparent.png'));
  await waitPreviewReady(page);

  const controls = page.getByTestId('favicon-controls');
  await controls.getByRole('radio', { name: 'Square' }).click();
  await controls.getByLabel('Padding').fill('0');
  await waitPreviewReady(page);
  let z = await downloadZip(page);
  let st = await pixelStats(page, z.files['android-chrome-512x512.png']);
  expect(st.minAlpha, 'transparent PNG keeps alpha with "Transparent background" on').toBe(0);

  const sw = controls.getByRole('switch', { name: 'Transparent background' });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(controls.getByTestId('color-input')).toBeEnabled();
  await waitPreviewReady(page);
  z = await downloadZip(page);
  st = await pixelStats(page, z.files['android-chrome-512x512.png']);
  expect(st.minAlpha, 'opaque when background is a colour').toBe(255);
  expect(st.corner.slice(0, 3)).toEqual([255, 255, 255]);

  await controls.getByRole('radio', { name: 'Circle' }).click();
  await waitPreviewReady(page);
  z = await downloadZip(page);
  st = await pixelStats(page, z.files['android-chrome-512x512.png']);
  expect(st.corner[3], 'circle corner is transparent').toBe(0);
  expect(st.center[3]).toBe(255);

  const before = await previewSrcs(page);
  await controls.getByLabel('Zoom').fill('2');
  await expect.poll(async () => (await previewSrcs(page))[0]).not.toBe(before[0]);
  const mid = await previewSrcs(page);
  await controls.getByLabel('Padding').fill('30');
  await expect.poll(async () => (await previewSrcs(page))[0]).not.toBe(mid[0]);
  await expect(controls.getByLabel('Padding')).toHaveValue('30');
});

test('image mode: not-an-image and corrupt files show an error; a good file recovers', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-generator');
  for (const f of ['not-an-image.png', 'corrupt.jpg']) {
    await page.getByTestId('file-input').setInputFiles(fixture(f));
    await expect(fshell(page)).toHaveAttribute('data-state', 'error', { timeout: 30_000 });
    await expect(page.getByTestId('error-banner')).toBeVisible();
    await expect(page.getByTestId('download-zip')).toHaveCount(0);
    await expect(page.getByTestId('download-ico')).toBeDisabled();
  }
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.png'));
  await waitPreviewReady(page);
});

test('image mode: tiny (40x40), tall (1000x8000) and 48 MP images still produce a package', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await gotoFavicon(page, 'favicon-generator');
  for (const f of ['tiny-40.png', 'tall-1000x8000.jpg', 'photo-48mp.jpg']) {
    await page.getByTestId('file-input').setInputFiles(fixture(f));
    await page.waitForTimeout(200);
    await expect(fshell(page)).toHaveAttribute('data-state', /done|error/, { timeout: 90_000 });
    const state = await fshell(page).getAttribute('data-state');
    test.info().annotations.push({ type: f, description: state ?? '' });
    expect(state, `${f} should produce a package`).toBe('done');
    const z = await downloadZip(page);
    expect(pngHeader(z.files['android-chrome-512x512.png']).width).toBe(512);
  }
});

// ── /png-to-ico ──────────────────────────────────────────────────────────

test('png-to-ico: 300px PNG -> 16/32/48/256; 40x20 -> 16/32/48; names and header', async ({
  page,
}) => {
  await gotoFavicon(page, 'png-to-ico');
  await expect(fshell(page)).toHaveAttribute('data-kind', 'png-to-ico');
  await expect(fshell(page)).toHaveAttribute('data-state', 'idle');

  const big = await makePng(page, 300, 300);
  await page
    .getByTestId('file-input')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: big });
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(cards(page)).toHaveCount(1);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download'));
  expect(name).toBe('logo.ico');
  const ico = parseIco(bytes);
  expect([ico.reserved, ico.type, ico.count]).toEqual([0, 1, 4]);
  expect(ico.entries.map((e) => e.w)).toEqual([16, 32, 48, 256]);
  let off = 6 + 4 * 16;
  for (const e of ico.entries) {
    expect(e.offset).toBe(off);
    expect(e.pngSig).toBe(true);
    expect([e.pngW, e.pngH]).toEqual([e.w, e.h]);
    off += e.size;
  }
  expect(off).toBe(bytes.length);
  await expect(cards(page).first()).toContainText('16, 32, 48 and 256');

  const small = await makePng(page, 40, 20);
  await page
    .getByTestId('file-input')
    .setInputFiles({ name: 'wide.png', mimeType: 'image/png', buffer: small });
  await page.waitForTimeout(200);
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(page.getByTestId('download')).toHaveAttribute('download', 'wide.ico');
  const d2 = await downloadVia(page, page.getByTestId('download'));
  expect(d2.name).toBe('wide.ico');
  const i2 = parseIco(d2.bytes);
  expect(i2.entries.map((e) => e.w)).toEqual([16, 32, 48]);
  expect(i2.entries.every((e) => e.pngSig && e.pngW === e.w && e.pngH === e.h)).toBe(true);
  await expect(cards(page).first()).toContainText('16, 32 and 48');
});

test('png-to-ico: transparent PNG keeps alpha in every embedded PNG', async ({ page }) => {
  await gotoFavicon(page, 'png-to-ico');
  const png = await makePng(page, 300, 300, { alpha: true });
  await page
    .getByTestId('file-input')
    .setInputFiles({ name: 'alpha.png', mimeType: 'image/png', buffer: png });
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  const { bytes } = await downloadVia(page, page.getByTestId('download'));
  const ico = parseIco(bytes);
  expect(ico.entries.length).toBe(4);
  for (const e of ico.entries) {
    const st = await pixelStats(page, e.png);
    expect(st.minAlpha, `${e.w}px keeps fully transparent pixels`).toBe(0);
    expect(st.right[3], `${e.w}px right edge transparent`).toBe(0);
    expect(st.transparentPx).toBeGreaterThan((e.w * e.h) / 4);
    expect(st.transparentPx, `${e.w}px not entirely transparent`).toBeLessThan(e.w * e.h);
  }
});

test('png-to-ico: JPG input shows the failed card; mixed batch is partial; Download all has the .ico files', async ({
  page,
}) => {
  await gotoFavicon(page, 'png-to-ico');
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  await expect(fshell(page)).toHaveAttribute('data-state', 'error', { timeout: 30_000 });
  const card = cards(page).first();
  await expect(card).toHaveAttribute('data-status', 'failed');
  await expect(card).toContainText('This tool needs a PNG file. Convert your image to PNG first.');
  await expect(page.getByTestId('download')).toHaveCount(0);
  await expect(page.getByTestId('download-all')).toHaveCount(0);

  const a = await makePng(page, 100, 100);
  const b = await makePng(page, 300, 200);
  await page.getByTestId('file-input').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: a },
    { name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('JFIF') },
    { name: 'b.png', mimeType: 'image/png', buffer: b },
    { name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('this is text, not a PNG') },
  ]);
  await expect(fshell(page)).toHaveAttribute('data-state', 'partial', { timeout: 30_000 });
  await expect(cards(page)).toHaveCount(4);
  const statuses = await cards(page).evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-status')),
  );
  expect(statuses).toEqual(['success', 'failed', 'success', 'failed']);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download-all'));
  expect(name).toBe('img-master-png-to-ico.zip');
  expect(Object.keys(unzip(bytes)).sort()).toEqual(['a.ico', 'b.ico']);
  const dl = await downloadVia(page, cards(page).first().getByTestId('download'));
  expect(dl.name).toBe('a.ico');
  expect(parseIco(dl.bytes).entries.map((e) => e.w)).toEqual([16, 32, 48]);
});

test('png-to-ico: 10 PNGs -> 10 cards, ZIP of 10 .ico, duplicate names get suffixes', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await gotoFavicon(page, 'png-to-ico');
  const png = await makePng(page, 64, 64);
  const files = Array.from({ length: 10 }, (_, i) => ({
    name: i === 9 ? 'icon-1.png' : `icon-${i + 1}.png`,
    mimeType: 'image/png',
    buffer: png,
  }));
  await page.getByTestId('file-input').setInputFiles(files);
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 60_000 });
  await expect(cards(page)).toHaveCount(10);
  const { bytes } = await downloadVia(page, page.getByTestId('download-all'));
  const names = Object.keys(unzip(bytes)).sort();
  expect(names).toHaveLength(10);
  expect(names).toContain('icon-1.ico');
  expect(names).toContain('icon-1-2.ico');
});
