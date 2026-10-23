// Section 3: mobile UX at 360x640.
import { expect, test, type Page } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { ALL_PATHS, TOOL_SLUGS, gotoTool, logMetric, pickAndWait } from './helpers/tool';

test.use({ viewport: { width: 360, height: 640 } });
test.beforeAll(ensureFixtures);

interface Target {
  tag: string;
  text: string;
  w: number;
  h: number;
  x: number;
  y: number;
}

/** Visible interactive elements inside a scope, with their bounding boxes. */
async function interactive(page: Page, scope: string): Promise<Target[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    const out: Target[] = [];
    const els = root.querySelectorAll<HTMLElement>(
      'button, a[href], [role=radio], [role=switch], summary, input:not([type=hidden]), select, textarea',
    );
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      // The real file input is visually hidden inside its (big) label.
      if (el instanceof HTMLInputElement && el.type === 'file') continue;
      if (el.closest('details:not([open])') && el.tagName !== 'SUMMARY') continue; // closed menu / more-options content
      if (el.getAttribute('href') === '#main') continue; // skip link: visible only on focus
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      out.push({
        tag: el.tagName.toLowerCase(),
        text: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        x: Math.round(r.x),
        y: Math.round(r.y + window.scrollY),
      });
    }
    return out;
  }, scope) as Promise<Target[]>;
}

for (const path of ALL_PATHS) {
  test(`no horizontal scroll at 360px: ${path}`, async ({ page }) => {
    await page.goto(path);
    const m = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(m.doc, JSON.stringify(m)).toBeLessThanOrEqual(m.inner);
    expect(m.body).toBeLessThanOrEqual(m.inner);
  });
}

test('no horizontal scroll on the 404 page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res?.status()).toBe(404);
  const m = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(m[0]).toBeLessThanOrEqual(m[1]);
});

for (const slug of TOOL_SLUGS) {
  test(`picker button fully visible without scrolling: /${slug}`, async ({ page }) => {
    await page.goto(`/${slug}`);
    const label = page.getByTestId('file-picker').locator('label').first();
    await expect(label).toBeVisible();
    const box = await label.boundingBox();
    const vh = page.viewportSize()?.height ?? 640;
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(
      box!.y + box!.height,
      `bottom ${box!.y + box!.height} vs viewport ${vh}`,
    ).toBeLessThanOrEqual(vh);
    expect(box!.height).toBeGreaterThanOrEqual(48);
    logMetric('picker-position.ndjson', {
      slug,
      project: test.info().project.name,
      bottom: box!.y + box!.height,
      vh,
    });
  });
}

for (const slug of TOOL_SLUGS) {
  test(`tap targets >= 48px in the tool area and header: /${slug}`, async ({ page }) => {
    await gotoTool(page, slug);
    const tool = await interactive(page, '[data-testid=tool-shell]');
    const header = await interactive(page, 'header');
    const crumbs = await interactive(page, 'nav[aria-label=Breadcrumb]'); // now below the tool
    const small = [...tool, ...header].filter((t) => t.h < 47.5 || t.w < 47.5);
    logMetric('tap-targets.ndjson', {
      slug,
      project: test.info().project.name,
      count: tool.length + header.length,
      small,
      crumbs,
    });
    expect(small, JSON.stringify(small)).toEqual([]);
    const smallCrumbs = crumbs.filter((t) => t.h < 47.5);
    expect(smallCrumbs, JSON.stringify(smallCrumbs)).toEqual([]);
  });
}

for (const slug of ['compress-image-to-50kb', 'webp-to-jpg', 'compress-image', 'image-converter']) {
  test(`after results: tap targets, spacing and no pinned bar on /${slug}`, async ({ page }) => {
    test.setTimeout(120_000);
    await gotoTool(page, slug);
    await pickAndWait(page, [fixture('photo-2mp.jpg'), fixture('photo-small.jpg')]);
    const tool = await interactive(page, '[data-testid=tool-shell]');
    const small = tool.filter((t) => t.h < 47.5 || t.w < 47.5);
    expect(small, JSON.stringify(small)).toEqual([]);

    // The sticky action bar is gone: each card has its own Download, a batch has one "download-all".
    await expect(page.getByTestId('action-bar')).toHaveCount(0);
    await expect(page.getByTestId('download')).toHaveCount(2);
    await expect(page.getByTestId('download-all')).toHaveCount(1);
    const pinned = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((e) => ['fixed', 'sticky'].includes(getComputedStyle(e).position))
        .filter((e) => !(e instanceof HTMLAnchorElement && e.getAttribute('href') === '#main'))
        .filter((e) => getComputedStyle(e).pointerEvents !== 'none') // the toast
        .map((e) => e.tagName),
    );
    expect(pinned, 'fixed/sticky elements').toEqual([]);

    // Buttons inside the cards are at least 48px tall and 8px apart in a row.
    const btns = await interactive(page, '[data-testid=results]');
    for (const t of btns) expect(t.h, t.text).toBeGreaterThanOrEqual(48);

    // Nothing covers the end of the page: the last footer link is hit-testable and inside the viewport.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => {
      const links = document.querySelectorAll<HTMLElement>('footer a');
      const last = links[links.length - 1];
      const rr = last.getBoundingClientRect();
      const hit = document.elementFromPoint(rr.x + rr.width / 2, rr.y + rr.height / 2);
      return {
        covered: !hit || !last.contains(hit),
        bottom: rr.bottom,
        vh: window.innerHeight,
        scrollW: document.documentElement.scrollWidth,
      };
    });
    expect(r.covered, JSON.stringify(r)).toBe(false);
    expect(r.bottom, JSON.stringify(r)).toBeLessThanOrEqual(r.vh + 0.5);
    expect(r.scrollW).toBeLessThanOrEqual(360);
  });
}

test('menu: tap targets >= 48px, fits the screen, no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('header summary[aria-label="Menu"]').click();
  await expect(page.locator('header details')).toHaveAttribute('open', '');
  const items = await interactive(page, 'header details');
  expect(items.length).toBeGreaterThanOrEqual(23); // summary + 18 tools + 4 info pages
  const small = items.filter((t) => t.h < 47.5);
  expect(small, JSON.stringify(small)).toEqual([]);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(360);
  const panel = await page.locator('header details > div').boundingBox();
  expect(panel!.width).toBeLessThanOrEqual(360);
  expect(panel!.y + panel!.height, 'menu panel fits the viewport').toBeLessThanOrEqual(640.5);
});

test('home: size chips and tool cards are >= 48px', async ({ page }) => {
  await page.goto('/');
  const main = await interactive(page, 'main');
  const small = main.filter((t) => t.h < 47.5);
  expect(small, JSON.stringify(small)).toEqual([]);
});

async function trackCls(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const ls = e as PerformanceEntry & { hadRecentInput: boolean; value: number };
        // Count every shift: choosing a file is not an input event Chrome excludes.
        if (ls.value > 0) (window as unknown as { __cls: number }).__cls += ls.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}
const readCls = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);

for (const slug of ['/', '/compress-image-to-50kb', '/webp-to-jpg', '/compress-image']) {
  test(`CLS while loading stays under 0.05 (Chromium): ${slug}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium-only');
    await trackCls(page);
    await page.goto(slug);
    await page.waitForTimeout(1500);
    const cls = await readCls(page);
    logMetric('cls.ndjson', { slug, phase: 'load', cls });
    expect(cls).toBeLessThan(0.05);
  });
}

for (const slug of ['compress-image-to-50kb', 'webp-to-jpg']) {
  test(`CLS when results appear stays under 0.05 (Chromium): /${slug}`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium-only');
    await trackCls(page);
    await gotoTool(page, slug);
    await page.waitForTimeout(800);
    await pickAndWait(page, [fixture('photo-2mp.jpg')]);
    await page.waitForTimeout(800);
    const cls = await readCls(page);
    logMetric('cls.ndjson', { slug, phase: 'results', cls });
    expect(cls, `CLS on /${slug} after processing one file`).toBeLessThan(0.05);
  });
}

test('tool works with the visible label tapped (no hidden-input dependency) and focus lands on Results', async ({
  page,
}) => {
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(focused).toBe('Results');
  await expect(page.locator('[role=status]').filter({ hasText: /^Done\./ })).toHaveCount(1);
});
