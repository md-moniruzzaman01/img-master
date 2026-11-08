// /resize-image: pixels / percent / format / validation / batch / storage / privacy.
import { expect, test, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';
import { ensureFixtures, fixture, fixtureBytes } from './helpers/fixtures';
import {
  cardData,
  cards,
  decodeInBrowser,
  downloadVia,
  gotoTool,
  openMoreOptions,
  pickAndWait,
  recordNetwork,
  shell,
  sniff,
} from './helpers/tool';

test.beforeAll(ensureFixtures);
test.skip(({ browserName }) => browserName !== 'chromium', 'resize e2e runs on mobile Chromium');

const SLUG = 'resize-image';
const W = (p: Page) => p.getByLabel('Width', { exact: true });
const H = (p: Page) => p.getByLabel('Height', { exact: true });
const PCT = (p: Page) => p.getByLabel('Scale', { exact: true });
const HINT_NEED = 'Enter a width or a height.';
const HINT_RANGE = 'Use a size from 1 to 20,000 px.';
const HINT_PCT = 'Use a percent from 1 to 400.';

async function setPx(page: Page, w: string, h: string) {
  await W(page).fill(w);
  await H(page).fill(h);
}
const keepRatio = (p: Page) => p.getByRole('switch', { name: /Keep ratio/ });
const settle = (p: Page) => p.waitForTimeout(700); // 250 ms debounce plus start

async function waitCardsDone(page: Page) {
  await expect(shell(page)).toHaveAttribute('data-state', /^(done|partial|error)$/, {
    timeout: 60_000,
  });
  await expect(
    page.locator('[data-testid=result-card][data-status=queued], [data-testid=result-card][data-status=processing]'),
  ).toHaveCount(0);
}

test('page: picker visible at 360x640, shell is the resize kind', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await gotoTool(page, SLUG);
  await expect(shell(page)).toHaveAttribute('data-kind', 'resize');
  const box = (await page.getByTestId('file-picker').boundingBox())!;
  expect(box).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(640);
  await expect(page.getByTestId('resize-controls')).toBeVisible();
});

test('pixels: width only with keep ratio -> 600 wide, ratio kept, name has size', async ({
  page,
}) => {
  await gotoTool(page, SLUG);
  await setPx(page, '600', '');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect(d.width).toBe(600);
  expect(d.height).toBe(450);
  expect(d.fileName).toBe('photo-2mp-600x450.jpg');
  await expect(cards(page).first()).toContainText('600 × 450 px');
  await expect(cards(page).first()).not.toContainText(/resized/i);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
  expect(name).toBe('photo-2mp-600x450.jpg');
  expect(sniff(bytes)).toBe('jpeg');
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect([dec.width, dec.height]).toEqual([600, 450]);
});

test('pixels: height only gives the right width', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '', '300');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const d = await cardData(cards(page).first());
  expect([d.width, d.height]).toEqual([400, 300]);
});

test('pixels: width + height. keep ratio fits inside the box; ratio off is exact', async ({
  page,
}) => {
  await gotoTool(page, SLUG);
  await expect(keepRatio(page)).toBeChecked();
  await setPx(page, '500', '500');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  let d = await cardData(cards(page).first());
  expect(d.width).toBeLessThanOrEqual(500);
  expect(d.height).toBeLessThanOrEqual(500);
  expect(Math.max(d.width, d.height)).toBe(500); // touches the box on one side
  expect(Math.abs(d.width / d.height - 4 / 3)).toBeLessThan(0.02);

  await keepRatio(page).click();
  await expect(keepRatio(page)).not.toBeChecked();
  await expect
    .poll(async () => (await cardData(cards(page).first())).width, { timeout: 30_000 })
    .toBe(500);
  await waitCardsDone(page);
  d = await cardData(cards(page).first());
  expect([d.width, d.height]).toEqual([500, 500]);
  expect(d.fileName).toBe('photo-2mp-500x500.jpg');
  const { bytes } = await downloadVia(page, page.getByTestId('download').first());
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect([dec.width, dec.height]).toEqual([500, 500]);
});

test('percent: 50 halves both sides, 400 upscales a small image', async ({ page }) => {
  await gotoTool(page, SLUG);
  await page.getByRole('radio', { name: 'Percent', exact: true }).click();
  await expect(PCT(page)).toBeVisible();
  await PCT(page).fill('50');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  let d = await cardData(cards(page).first());
  expect([d.width, d.height]).toEqual([800, 600]);

  await pickAndWait(page, fixture('photo-small.jpg'));
  await PCT(page).fill('400');
  await expect
    .poll(async () => (await cardData(cards(page).first())).width, { timeout: 30_000 })
    .toBe(1280);
  await waitCardsDone(page);
  d = await cardData(cards(page).first());
  expect([d.width, d.height]).toEqual([1280, 960]);
  const { bytes } = await downloadVia(page, page.getByTestId('download').first());
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect([dec.width, dec.height]).toEqual([1280, 960]);
});

for (const [label, fmt, mime, ext] of [
  ['JPG', 'jpeg', 'image/jpeg', 'jpg'],
  ['PNG', 'png', 'image/png', 'png'],
  ['WebP', 'webp', 'image/webp', 'webp'],
] as const) {
  test(`format: explicit ${label} gives ${mime}`, async ({ page }) => {
    await gotoTool(page, SLUG);
    await openMoreOptions(page);
    await page.getByRole('radio', { name: label, exact: true }).click();
    await setPx(page, '400', '');
    // Source is PNG so the explicit choice differs from "Same" for JPG and WebP.
    await pickAndWait(page, fixture('photo-2mp.png'));
    const d = await cardData(cards(page).first());
    if (fmt === 'webp' && d.status === 'failed') {
      expect(d.error).toBe('ENCODE_UNSUPPORTED');
      await expect(page.getByTestId('error-banner')).toContainText("Your browser can't save WebP");
      await expect(page.getByTestId('download')).toHaveCount(0);
      return;
    }
    expect(d.status).toBe('success');
    expect(d.format).toBe(fmt);
    expect(d.fileName).toBe(`photo-2mp-400x300.${ext}`);
    const { bytes, name } = await downloadVia(page, page.getByTestId('download').first());
    expect(name).toBe(`photo-2mp-400x300.${ext}`);
    expect(sniff(bytes)).toBe(fmt);
    const dec = await decodeInBrowser(page, bytes, mime);
    expect([dec.width, dec.height]).toEqual([400, 300]);
  });
}

test('format: Same keeps the source type (PNG stays PNG, JPG stays JPG)', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '300', '');
  await pickAndWait(page, fixture('photo-2mp.png'));
  expect((await cardData(cards(page).first())).format).toBe('png');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  expect((await cardData(cards(page).first())).format).toBe('jpeg');
});

test('transparency: -> JPG flattens to white with a note; Same keeps alpha', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '400', '');
  await openMoreOptions(page);
  await page.getByRole('radio', { name: 'JPG', exact: true }).click();
  await pickAndWait(page, fixture('transparent.png'));
  const card = cards(page).first();
  const d = await cardData(card);
  expect(d.status).toBe('success');
  expect(d.format).toBe('jpeg');
  expect(d.notes).toContain('transparency-flattened');
  await expect(card).toContainText('Transparent areas were filled with your background colour.');
  await expect(page.getByText('Background colour').first()).toBeVisible();
  const { bytes } = await downloadVia(page, page.getByTestId('download').first());
  const dec = await decodeInBrowser(page, bytes, 'image/jpeg');
  expect(dec.minAlpha).toBe(255);
  expect(dec.corner[0]).toBeGreaterThan(245);
  expect(dec.corner[1]).toBeGreaterThan(245);
  expect(dec.corner[2]).toBeGreaterThan(245);

  await page.getByRole('radio', { name: 'Same as original', exact: true }).click();
  await expect.poll(async () => (await cardData(cards(page).first())).format, { timeout: 30_000 }).toBe('png');
  await waitCardsDone(page);
  const s = await downloadVia(page, page.getByTestId('download').first());
  expect(sniff(s.bytes)).toBe('png');
  const sdec = await decodeInBrowser(page, s.bytes, 'image/png');
  expect(sdec.minAlpha).toBeLessThan(10);
  expect([sdec.width, sdec.height]).toEqual([400, 300]);
});

test('validation: invalid input starts no run and shows the hint; fixing it then runs', async ({
  page,
}) => {
  await gotoTool(page, SLUG);
  const hint = page.getByTestId('resize-controls').locator('p[aria-live=polite]');
  const noRun = async () => {
    await page.waitForTimeout(600);
    await expect(cards(page)).toHaveCount(0);
  };

  // Both sides empty.
  await setPx(page, '', '');
  await page.getByTestId('file-input').setInputFiles(fixture('photo-small.jpg'));
  await expect(hint).toContainText(HINT_NEED);
  await noRun();
  // Width 0 is the same as empty.
  await setPx(page, '0', '');
  await expect(hint).toContainText(HINT_NEED);
  await noRun();
  // Too big.
  await setPx(page, '99999', '');
  await expect(hint).toContainText(HINT_RANGE);
  await noRun();
  // Percent over 400.
  await page.getByRole('radio', { name: 'Percent', exact: true }).click();
  await PCT(page).fill('500');
  await expect(hint).toContainText(HINT_PCT);
  await noRun();
  await PCT(page).fill('');
  await expect(hint).toContainText(HINT_PCT);
  await noRun();
  // Fix it: the waiting file starts by itself (task h).
  await PCT(page).fill('50');
  await waitCardsDone(page);
  await expect(cards(page)).toHaveCount(1);
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect([d.width, d.height]).toEqual([160, 120]);
});

test('validation: file picked while invalid starts after pixels are fixed', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '', '');
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  await page.waitForTimeout(500);
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByTestId('resize-controls')).toContainText('Your image will start when this is fixed.');
  await W(page).fill('320');
  await waitCardsDone(page);
  const d = await cardData(cards(page).first());
  expect([d.width, d.height]).toEqual([320, 240]);
});

test('re-run: changing an option after a result re-runs with the new value', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '800', '');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  expect((await cardData(cards(page).first())).width).toBe(800);
  await W(page).fill('200');
  await expect
    .poll(async () => (await cardData(cards(page).first())).width, { timeout: 30_000 })
    .toBe(200);
  await waitCardsDone(page);
  expect((await cardData(cards(page).first())).fileName).toBe('photo-2mp-200x150.jpg');
});

test('batch: several files -> ZIP with right names', async ({ page }) => {
  test.setTimeout(120_000);
  const jpg = fixtureBytes('photo-small.jpg');
  const png = fixtureBytes('tiny-40.png');
  await gotoTool(page, SLUG);
  await setPx(page, '100', '');
  await pickAndWait(page, [
    { name: 'a.jpg', mimeType: 'image/jpeg', buffer: jpg },
    { name: 'b.jpg', mimeType: 'image/jpeg', buffer: jpg },
    { name: 'logo.png', mimeType: 'image/png', buffer: png },
  ]);
  await expect(cards(page)).toHaveCount(3);
  const { bytes, name } = await downloadVia(page, page.getByTestId('download-all'));
  expect(name).toBe('img-master-resize-image.zip');
  expect(sniff(bytes)).toBe('zip');
  const zip = unzipSync(new Uint8Array(bytes));
  expect(Object.keys(zip).sort()).toEqual(['a-100x75.jpg', 'b-100x75.jpg', 'logo-100x100.png']);
});

test('storage: options are remembered after reload', async ({ page }) => {
  await gotoTool(page, SLUG);
  await setPx(page, '640', '480');
  await keepRatio(page).click();
  await openMoreOptions(page);
  await page.getByRole('radio', { name: 'PNG', exact: true }).click();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(shell(page)).toBeVisible();
  await expect(W(page)).toHaveValue('640');
  await expect(H(page)).toHaveValue('480');
  await expect(keepRatio(page)).not.toBeChecked();
  await openMoreOptions(page);
  await expect(page.getByRole('radio', { name: 'PNG', exact: true })).toBeChecked();
});

test('storage: page still works when localStorage throws', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    Object.defineProperty(window, 'localStorage', {
      get: boom,
      configurable: true,
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gotoTool(page, SLUG);
  await setPx(page, '300', '');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const d = await cardData(cards(page).first());
  expect(d.status).toBe('success');
  expect(d.width).toBe(300);
  expect(errors).toEqual([]);
});

test('engine cap: an impossible size shows "Largest size for this image"', async ({ page }) => {
  await gotoTool(page, SLUG);
  await keepRatio(page).click(); // off: exact 16000 x 16000 = 256 MP
  await setPx(page, '16000', '16000');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const card = cards(page).first();
  const d = await cardData(card);
  expect(d.status).toBe('failed');
  expect(d.error).toBe('INVALID_OPTIONS');
  await expect(card).toContainText(/Largest size for this image is \d+ × \d+ px\./);
  await expect(page.getByTestId('download')).toHaveCount(0);
});

test('privacy: a resize run makes only same-origin requests (no POST/PUT/PATCH, no bodies)', async ({ page, context }) => {
  const net = recordNetwork(context);
  await gotoTool(page, SLUG);
  await setPx(page, '500', '');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  await downloadVia(page, page.getByTestId('download').first());
  const origin = new URL(page.url()).origin;
  const bad = net.filter(
    (n) =>
      !(n.origin === origin || n.origin === 'blob:' || n.origin === 'data:' || n.origin === 'about:') ||
      !['GET', 'HEAD'].includes(n.method) ||
      n.bodyBytes > 0,
  );
  expect(bad).toEqual([]);
});
