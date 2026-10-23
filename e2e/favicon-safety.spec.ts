// Phase 4: hostile input, preview behaviour (CLS, object URLs, console) and privacy of the favicon tools.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { FAVICON_SLUGS, cards, downloadVia, recordNetwork, watchCsp } from './helpers/tool';
import {
  chooseMode,
  downloadZip,
  fshell,
  gotoFavicon,
  makePng,
  previewSrcs,
  unzip,
  utf8,
  waitPreviewReady,
} from './helpers/favicon';
import { checkPackage, checkSvg } from './helpers/favicon-check';

test.beforeAll(ensureFixtures);

const text = (p: Page) => p.getByTestId('text-input');
const emoji = (p: Page) => p.getByTestId('emoji-input');
type W = {
  __pwn: number;
  __cls: number;
  __created: string[];
  __revoked: string[];
};

// ── Hostile input ────────────────────────────────────────────────────────

// The field keeps 3 characters, so each entry is a 3-grapheme attack string.
const HOSTILE = ['<&"', '</t', '<sc', '">&', "'<>", '&lt', '\\u0', '{{x', '&#x'];

test('hostile text: SVG, manifest and README stay well-formed and inert; nothing injected in the DOM', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    (window as unknown as W).__pwn = 0;
  });
  await gotoFavicon(page, 'favicon-from-text');
  const inlineBefore = await page.locator('script:not([src])').count();
  for (const h of HOSTILE) {
    await text(page).fill(h);
    const kept = await text(page).inputValue();
    await waitPreviewReady(page);
    const { files } = await downloadZip(page);
    await checkPackage(page, files, 'text');
    const svg = await checkSvg(page, files['favicon.svg']);
    expect(svg.textContent, `svg text for ${h}`).toBe(kept);
    const manifest = JSON.parse(utf8(files['site.webmanifest'])) as { name: string };
    expect(manifest.name).toBe(kept);
    const raw = utf8(files['favicon.svg']);
    expect(raw.match(/<script/gi)).toBeNull();
    if (kept.includes('<')) expect(raw).toContain('&lt;');
    if (kept.includes('&')) expect(raw).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
    expect(utf8(files['README.txt'])).not.toContain('<script');
    // Next lazily adds same-origin chunk <script src>; nothing inline may be added, nothing may point elsewhere.
    expect(await page.locator('script:not([src])').count()).toBe(inlineBefore);
    const srcs = await page.locator('script[src]').evaluateAll((e) => e.map((x) => (x as HTMLScriptElement).src));
    for (const src of srcs) expect(new URL(src).pathname).toMatch(/^\/_next\//);
    expect(await page.locator('[onerror], [onload]').count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as W).__pwn)).toBe(0);
  }
  // The literal strings from the brief (cut to 3 characters by the field)
  for (const s of ['<script>"&', '</text><script>']) {
    await text(page).fill(s);
    await expect(text(page)).toHaveValue(s.slice(0, 3));
  }
  expect(errors).toEqual([]);
});

test('hostile emoji field and tampered localStorage are neutralised', async ({ page }) => {
  await gotoFavicon(page, 'favicon-from-emoji');
  await emoji(page).fill('<');
  await waitPreviewReady(page);
  let z = await downloadZip(page);
  await checkSvg(page, z.files['favicon.svg']);

  await page.evaluate(() => {
    localStorage.setItem(
      'img-master:options:favicon-from-text',
      JSON.stringify({
        text: {
          text: '</text><script>window.__pwn=1</script>',
          color: '"/><script>window.__pwn=1</script>',
          background: 'red;}</style><script>window.__pwn=1</script>',
          weight: '800"><script>',
          shape: 'circle"/><script>',
          padding: 999,
        },
      }),
    );
  });
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  z = await downloadZip(page);
  const svg = await checkSvg(page, z.files['favicon.svg']);
  expect(svg.textContent!.length).toBeLessThanOrEqual(3);
  const raw = utf8(z.files['favicon.svg']);
  expect(raw).not.toMatch(/<script/i);
  expect(raw).not.toContain('__pwn');
  expect(await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn)).toBeUndefined();
  for (const m of raw.matchAll(/(?:fill|stroke)="([^"]+)"/g))
    expect(m[1]).toMatch(/^(#[0-9a-f]{3,8}|none|url\(#[A-Za-z0-9_-]+\)|transparent)$/i);
});

test('hostile file names are shown as text and sanitised in the ZIP (png-to-ico, image mode)', async ({
  page,
}) => {
  const evil = '"><img src=x onerror=window.__pwn=1>.png';
  await page.addInitScript(() => {
    (window as unknown as W).__pwn = 0;
  });
  await gotoFavicon(page, 'png-to-ico');
  const png = await makePng(page, 64, 64);
  await page.getByTestId('file-input').setInputFiles([
    { name: evil, mimeType: 'image/png', buffer: png },
    { name: 'ok.png', mimeType: 'image/png', buffer: png },
  ]);
  await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  expect(await page.locator('img[onerror], img[src="x"]').count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as W).__pwn)).toBe(0);
  // dispatchEvent: with a long file name the card overflows the 360px page and the bar covers (see QA-10), so a real click is blocked.
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-all').dispatchEvent('click'),
  ]);
  const names = Object.keys(unzip(readFileSync((await dl.path())!)));
  expect(names).toHaveLength(2);
  for (const n of names) {
    expect(n, 'ZIP entry name').not.toMatch(/[<>"/\\]/);
    expect(n).toMatch(/\.ico$/);
  }

  await gotoFavicon(page, 'favicon-generator');
  await page
    .getByTestId('file-input')
    .setInputFiles({ name: evil, mimeType: 'image/png', buffer: png });
  await waitPreviewReady(page);
  expect(await page.locator('img[onerror], img[src="x"]').count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as W).__pwn)).toBe(0);
});

// ── Preview behaviour ────────────────────────────────────────────────────

async function trackAll(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as W;
    w.__cls = 0;
    w.__created = [];
    w.__revoked = [];
    const c = URL.createObjectURL.bind(URL);
    const r = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = c(o);
      w.__created.push(u);
      return u;
    };
    URL.revokeObjectURL = (u: string) => {
      w.__revoked.push(u);
      r(u);
    };
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.__cls += (e as unknown as { value: number }).value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* WebKit has no layout-shift entries */
    }
  });
}

for (const slug of ['favicon-from-text', 'favicon-generator', 'favicon-from-emoji']) {
  test(`preview: no layout shift while dragging a slider or changing a colour (Chromium): /${slug}`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium-only');
    test.setTimeout(120_000);
    await trackAll(page);
    await gotoFavicon(page, slug);
    if (slug === 'favicon-generator')
      await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
    await waitPreviewReady(page);
    await page.waitForTimeout(600);
    const base = await page.evaluate(() => (window as unknown as W).__cls);

    const slider = page.getByTestId('favicon-controls').getByLabel('Padding');
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(box.x + 10 + ((box.width - 20) * i) / 12, box.y + box.height / 2);
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await waitPreviewReady(page);

    const color = page.getByTestId('color-input').first();
    if (await color.isEnabled()) {
      for (const c of ['#ff0000', '#00aa55', '#223344']) {
        await color.fill(c);
        await page.waitForTimeout(200);
      }
    }
    await waitPreviewReady(page);
    await page.waitForTimeout(800);
    const total = await page.evaluate(() => (window as unknown as W).__cls);
    test
      .info()
      .annotations.push({ type: 'cls', description: `base ${base.toFixed(4)} total ${total.toFixed(4)}` });
    expect(total - base, `CLS during interaction on /${slug}`).toBeLessThan(0.05);
    expect(total, 'raw CLS including load and first preview').toBeLessThan(0.05);
  });
}

test('preview: previous object URLs are revoked when the package is replaced', async ({ page }) => {
  test.setTimeout(120_000);
  await trackAll(page);
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  const letters = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  for (const l of letters) {
    await text(page).fill(l);
    await waitPreviewReady(page);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const w = window as unknown as W;
    const revoked = new Set(w.__revoked);
    return {
      created: w.__created.length,
      revoked: revoked.size,
      live: w.__created.filter((u) => !revoked.has(u)).length,
    };
  });
  test.info().annotations.push({ type: 'blob-urls', description: JSON.stringify(r) });
  expect(r.created).toBeGreaterThan(letters.length);
  expect(r.revoked).toBeGreaterThan(0);
  expect(r.live, `only the current package may be alive: ${JSON.stringify(r)}`).toBeLessThanOrEqual(6);
});

test('preview: png-to-ico frees URLs when a new batch replaces the old', async ({ page }) => {
  await trackAll(page);
  await gotoFavicon(page, 'png-to-ico');
  const png = await makePng(page, 64, 64);
  for (let i = 0; i < 3; i++) {
    await page
      .getByTestId('file-input')
      .setInputFiles({ name: `n${i}.png`, mimeType: 'image/png', buffer: png });
    await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await page.waitForTimeout(400);
  }
  const r = await page.evaluate(() => {
    const w = window as unknown as W;
    const revoked = new Set(w.__revoked);
    return { created: w.__created.length, live: w.__created.filter((u) => !revoked.has(u)).length };
  });
  expect(r.live, JSON.stringify(r)).toBeLessThanOrEqual(3);
});

test('preview: image mode swaps the previews in place (src changes, same count)', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-generator');
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  await waitPreviewReady(page);
  const a = await previewSrcs(page);
  expect(a.length).toBeGreaterThanOrEqual(8); // 2 tabs + home tile + 5 real sizes
  await page.getByTestId('favicon-controls').getByRole('radio', { name: 'Circle' }).click();
  await expect.poll(async () => (await previewSrcs(page))[0]).not.toBe(a[0]);
  expect((await previewSrcs(page)).length).toBe(a.length);
});

for (const slug of ['favicon-from-text', 'favicon-generator', 'png-to-ico']) {
  test(`no console errors, page errors or CSP violations through a full flow: /${slug}`, async ({
    page,
    context,
    browserName,
  }) => {
    test.setTimeout(120_000);
    if (browserName === 'chromium')
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    const csp = await watchCsp(page);
    await gotoFavicon(page, slug);
    if (slug === 'png-to-ico') {
      const png = await makePng(page, 300, 300);
      await page
        .getByTestId('file-input')
        .setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: png });
      await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
      await downloadVia(page, page.getByTestId('download'));
    } else {
      if (slug === 'favicon-generator') {
        await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
        await chooseMode(page, 'Text');
        await chooseMode(page, 'Emoji');
        await chooseMode(page, 'Image');
        await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.png'));
      } else {
        await text(page).fill('Q');
      }
      await waitPreviewReady(page);
      await downloadZip(page);
      await downloadVia(page, page.getByTestId('download-ico'));
      await page.getByTestId('copy-snippet').click();
    }
    await page.waitForTimeout(500);
    expect(errors, errors.join('\n')).toEqual([]);
    expect(csp, 'CSP violations').toEqual([]);
  });
}

// ── Privacy ──────────────────────────────────────────────────────────────

test('privacy: every favicon flow makes only same-origin GET/HEAD requests with no body', async ({
  page,
  context,
  baseURL,
  browserName,
}) => {
  test.setTimeout(240_000);
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const net = recordNetwork(context);
  const csp = await watchCsp(page);
  const own = new URL(baseURL ?? 'http://localhost:4173').host;
  const analytics = process.env.NEXT_PUBLIC_ANALYTICS_HOST ?? '';

  for (const slug of FAVICON_SLUGS) {
    await gotoFavicon(page, slug);
    if (slug === 'png-to-ico') {
      const png = await makePng(page, 300, 300, { alpha: true });
      await page.getByTestId('file-input').setInputFiles([
        { name: 'one.png', mimeType: 'image/png', buffer: png },
        { name: 'two.png', mimeType: 'image/png', buffer: png },
        { name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') },
      ]);
      await expect(fshell(page)).toHaveAttribute('data-state', 'partial', { timeout: 30_000 });
      await downloadVia(page, page.getByTestId('download-all'));
      await downloadVia(page, cards(page).first().getByTestId('download'));
      continue;
    }
    if (slug === 'favicon-generator') {
      await page.getByTestId('file-input').setInputFiles(fixture('exif-gps.jpg'));
      await waitPreviewReady(page);
      await chooseMode(page, 'Text');
      await text(page).fill('Pq');
      await chooseMode(page, 'Emoji');
      await emoji(page).fill('🌿');
      await chooseMode(page, 'Image');
    } else if (slug === 'favicon-from-text') {
      await text(page).fill('Hi');
    } else {
      await emoji(page).fill('☕');
    }
    await waitPreviewReady(page);
    await page.getByTestId('favicon-controls').getByRole('radio', { name: 'Circle' }).click();
    await waitPreviewReady(page);
    await downloadZip(page);
    await downloadVia(page, page.getByTestId('download-ico'));
    await page.getByTestId('copy-snippet').click();
  }
  await page.waitForTimeout(500);
  const bad = net.filter((e) => {
    if (['blob:', 'data:', 'about:'].includes(e.origin)) return false;
    const external = e.host !== own && !(analytics && e.host === analytics);
    return external || !['GET', 'HEAD', 'OPTIONS'].includes(e.method) || e.bodyBytes > 1024;
  });
  expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
  expect(csp).toEqual([]);
});
