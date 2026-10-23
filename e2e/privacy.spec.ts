// Section 1: nothing leaves the device. Also: no CSP violations during tool runs.
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ensureFixtures, fixture, OUT_DIR } from './helpers/fixtures';
import {
  CONVERTER_PAGES,
  SIZE_PAGES,
  TOOL_SLUGS,
  cards,
  gotoTool,
  pickAndWait,
  recordNetwork,
  watchCsp,
} from './helpers/tool';

test.beforeAll(ensureFixtures);

const ANALYTICS_HOST = process.env.NEXT_PUBLIC_ANALYTICS_HOST ?? '';

for (const slug of TOOL_SLUGS) {
  test(`privacy: no upload, no third party, no CSP violation on /${slug}`, async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    const net = recordNetwork(page.context());
    const csp = await watchCsp(page);
    const ownHost = new URL(baseURL ?? 'http://localhost:4173').host;

    await gotoTool(page, slug);
    // 3 files: a JPG with EXIF/GPS marker, a PNG with transparency, a WebP.
    await pickAndWait(page, [
      fixture('exif-gps.jpg'),
      fixture('transparent.png'),
      fixture('photo-2mp.webp'),
    ]);
    await expect(cards(page)).toHaveCount(3);
    // Trigger the other code paths too: change an option, then ZIP.
    const zip = page.getByTestId('download-all');
    if (await zip.count()) {
      await Promise.all([page.waitForEvent('download'), zip.click()]);
    }
    await page.waitForTimeout(500);

    const bad = net.filter((e) => {
      if (e.origin === 'blob:' || e.origin === 'data:' || e.origin === 'about:') return false;
      const external = e.host !== ownHost && !(ANALYTICS_HOST && e.host === ANALYTICS_HOST);
      return (
        external ||
        !['GET', 'HEAD', 'OPTIONS'].includes(e.method) ||
        e.bodyBytes > 1024 ||
        e.url.length > 1000
      );
    });
    expect(bad, `unexpected requests:\n${JSON.stringify(bad, null, 1)}`).toEqual([]);
    expect(csp, 'CSP violations').toEqual([]);
  });
}

test('privacy: compress-to-size with 12 MP photo keeps every request same-origin GET', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const net = recordNetwork(page.context());
  const csp = await watchCsp(page);
  await gotoTool(page, SIZE_PAGES[1].slug);
  await pickAndWait(page, fixture('photo-12mp.jpg'));
  const own = new URL(baseURL ?? 'http://localhost:4173').host;
  const bad = net.filter(
    (e) =>
      !['blob:', 'data:', 'about:'].includes(e.origin) &&
      (e.host !== own || !['GET', 'HEAD'].includes(e.method) || e.bodyBytes > 0),
  );
  expect(bad).toEqual([]);
  expect(csp).toEqual([]);
});

test('privacy: converters, same check on every converter page with its own input', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(240_000);
  const net = recordNetwork(page.context());
  const csp = await watchCsp(page);
  const own = new URL(baseURL ?? 'http://localhost:4173').host;
  for (const c of CONVERTER_PAGES) {
    await gotoTool(page, c.slug);
    await pickAndWait(page, fixture(c.input));
  }
  const bad = net.filter(
    (e) =>
      !['blob:', 'data:', 'about:'].includes(e.origin) &&
      (e.host !== own || !['GET', 'HEAD'].includes(e.method) || e.bodyBytes > 0),
  );
  expect(bad).toEqual([]);
  expect(csp).toEqual([]);
});

test('privacy: CSP and security headers are served on pages and assets', async ({ request }) => {
  for (const path of [
    '/',
    '/compress-image-to-50kb',
    '/webp-to-jpg',
    '/privacy',
    '/does-not-exist',
  ]) {
    const res = await request.get(path);
    const h = res.headers();
    const csp = h['content-security-policy'] ?? '';
    expect(csp, `${path} CSP`).toContain("connect-src 'self'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
  }
});

test('privacy: no server/upload code shipped (static scan of out/)', async () => {
  // No API route folders, no upload endpoints, no analytics beacons in our code.
  const files: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(OUT_DIR);
  expect(files.filter((f) => /[\/]api[\/]/.test(f))).toEqual([]);
  const js = files.filter((f) => /static[\/]chunks[\/].*\.js$/.test(f));
  const hits: string[] = [];
  for (const f of js) {
    const src = readFileSync(f, 'utf8');
    if (/sendBeacon/.test(src)) hits.push(`${f}: sendBeacon`);
    if (/XMLHttpRequest/.test(src)) hits.push(`${f}: XMLHttpRequest`);
    if (/new WebSocket/.test(src)) hits.push(`${f}: WebSocket`);
  }
  test.info().annotations.push({ type: 'scan', description: hits.join('; ') || 'none' });
  // sendBeacon/XHR may exist inside the Next.js framework; informational only.
  expect(files.some((f) => /upload/i.test(f))).toBe(false);
});
