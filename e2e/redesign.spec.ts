// Redesign checks (DESIGN.md §2-§4): header, menu, footer, picker, privacy line,
// flat cards, allowed colours, single-result Download in view.
import { expect, test, type Page } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import {
  ALL_PATHS,
  FAVICON_SLUGS,
  TOOL_SLUGS,
  gotoTool,
  logMetric,
  pickAndWait,
} from './helpers/tool';

test.use({ viewport: { width: 360, height: 640 } });
test.beforeAll(ensureFixtures);

const ALL_TOOLS = [...TOOL_SLUGS, ...FAVICON_SLUGS];
const INFO = ['/about', '/privacy', '/terms', '/contact'];

// ── Header ──────────────────────────────────────────────────────────────

for (const path of ALL_PATHS) {
  test(`header is at most 52px tall and not sticky: ${path}`, async ({ page }) => {
    await page.goto(path);
    const h = await page.locator('header').first().boundingBox();
    expect(h!.height).toBeLessThanOrEqual(52);
    const pos = await page
      .locator('header')
      .first()
      .evaluate((e) => getComputedStyle(e).position);
    expect(pos).not.toBe('sticky');
    expect(pos).not.toBe('fixed');
  });
}

// ── Menu ────────────────────────────────────────────────────────────────

test('menu: server HTML lists all 18 tools and 4 info pages; opens; Esc closes and returns focus', async ({
  page,
  request,
}) => {
  // Crawlable without JavaScript.
  const html = await (await request.get('/about')).text();
  const header = /<header[\s\S]*?<\/header>/.exec(html)![0];
  for (const s of ALL_TOOLS) expect(header, s).toContain(`href="/${s}"`);
  for (const l of INFO) expect(header, l).toContain(`href="${l}"`);

  await page.goto('/compress-image-to-50kb');
  const details = page.locator('header details');
  const summary = details.locator('summary[aria-label="Menu"]');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toBeVisible();
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  const hrefs = await details
    .locator('a[href]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const s of ALL_TOOLS) expect(hrefs, s).toContain(`/${s}`);
  for (const l of INFO) expect(hrefs, l).toContain(l);
  expect(hrefs.length).toBe(22);
  // Opening the menu does not move the page below it.
  const h1Top = (await page.locator('main h1').boundingBox())!.y;
  await page.keyboard.press('Escape');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  expect((await page.locator('main h1').boundingBox())!.y).toBe(h1Top);
});

test('menu: closes on link tap and on outside tap', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('header details');
  const summary = details.locator('summary');
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  // Outside tap: the panel covers the page, so tap the empty part of the header bar.
  await page.mouse.click(180, 25);
  await expect(details).not.toHaveAttribute('open', '');
  await summary.click();
  await details.locator('a[href="/webp-to-jpg"]').click();
  await expect(page).toHaveURL(/\/webp-to-jpg$/);
  await expect(page.locator('header details')).not.toHaveAttribute('open', '');
});

test('desktop 1280: no menu button; Compress, Convert, Favicon, About links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('header summary[aria-label="Menu"]')).toBeHidden();
  const nav = page.locator('header nav[aria-label="Main"]');
  await expect(nav).toBeVisible();
  const texts = await nav.locator('a').allInnerTexts();
  expect(texts.map((t) => t.trim())).toEqual(['Compress', 'Convert', 'Favicon', 'About']);
  for (const a of await nav.locator('a').all()) {
    expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
    const res = await page.request.get((await a.getAttribute('href'))!);
    expect(res.status()).toBe(200);
  }
});

// ── Footer ──────────────────────────────────────────────────────────────

for (const path of ['/', '/compress-image-to-50kb', '/png-to-ico', '/about']) {
  test(`footer is exactly two lines: copyright + Privacy, Terms, Contact: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    const year = new Date().getFullYear();
    const txt = (await footer.innerText()).replace(/\s+/g, ' ').trim();
    expect(txt).toBe(`© ${year} Img Master · Built by Softwara Privacy · Terms · Contact`);
    const internal = await footer
      .locator('a[href^="/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(internal).toEqual(['/privacy', '/terms', '/contact']);
    expect(await footer.locator('h2, h3, nav').count()).toBe(0);
    const lines = await footer.evaluate((f) => {
      const tops = new Set<number>();
      f.querySelectorAll('p, ul').forEach((e) =>
        tops.add(Math.round(e.getBoundingClientRect().top)),
      );
      return tops.size;
    });
    expect(lines).toBe(2);
    for (const a of await footer.locator('a').all())
      expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  });
}

// ── Picker and privacy line above the fold ──────────────────────────────

for (const slug of ALL_TOOLS) {
  test(`picker, then privacy line, both above the fold: /${slug}`, async ({ page }) => {
    await page.goto(`/${slug}`);
    const textMode = slug === 'favicon-from-text' || slug === 'favicon-from-emoji';
    const privacy = page.getByTestId('privacy-note').first();
    await expect(privacy).toBeVisible();
    await expect(privacy).toHaveText(/Your images never leave your device/);
    const pb = (await privacy.boundingBox())!;
    expect(pb.y + pb.height, `privacy line bottom ${pb.y + pb.height}`).toBeLessThanOrEqual(640);
    if (textMode) return; // first control is a text field, not the picker button
    const label = page.getByTestId('file-picker').locator('label').first();
    const lb = (await label.boundingBox())!;
    logMetric('redesign-fold.ndjson', {
      slug,
      project: test.info().project.name,
      pickerH: lb.height,
      pickerW: lb.width,
      privacyBottom: pb.y + pb.height,
    });
    expect(lb.height, 'picker button height').toBeGreaterThanOrEqual(52);
    expect(lb.width, 'picker button is full width').toBeGreaterThanOrEqual(360 - 2 * 24);
    expect(lb.x + lb.width).toBeLessThanOrEqual(360);
    expect(pb.y).toBeGreaterThanOrEqual(lb.y + lb.height - 1);
    // Next visible element after the picker button (in document order) must be the privacy line.
    const next = await page.evaluate(() => {
      const label = document.querySelector('[data-testid=file-picker] label') as HTMLElement;
      const els = [
        ...document.querySelectorAll<HTMLElement>(
          'main h1, main h2, main p, main button, main a, main label, main summary, main input:not([type=file]), main select, main textarea',
        ),
      ];
      for (const e of els) {
        if (e === label || label.contains(e)) continue;
        if (!(label.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none')
          continue;
        return (
          e.getAttribute('data-testid') ?? e.tagName + ':' + (e.textContent ?? '').slice(0, 30)
        );
      }
      return null;
    });
    expect(next, 'first visible element after the picker button').toBe('privacy-note');
  });
}

// ── Flat cards, allowed colours ─────────────────────────────────────────

// Ink Samurai palette (DESIGN.md colour tokens; spec 2026-10-24 section 4).
const ALLOWED_BG = new Set([
  'rgba(0, 0, 0, 0)',
  'rgb(250, 248, 244)', // --bg #FAF8F4 paper
  'rgb(255, 255, 255)', // --card #FFFFFF
  'rgb(240, 236, 228)', // --surface #F0ECE4
  'rgb(192, 57, 43)', // --primary #C0392B crimson
  'rgb(169, 50, 38)', // --primary-hover #A93226
  'rgb(251, 244, 226)', // --gold-tint #FBF4E2
  'rgb(26, 18, 18)', // --ink #1A1212 (progress fill, silhouettes)
  'rgb(226, 221, 214)', // --border #E2DDD6 (skeleton bars, dividers)
  'rgb(138, 129, 119)', // --border-strong #8A8177 (switch knob when off)
]);

async function colourScan(page: Page, allowExtra: string[] = []) {
  const r = await page.evaluate(() => {
    const bg = new Map<string, string>();
    const shadows: string[] = [];
    for (const e of document.querySelectorAll<HTMLElement>('body, body *')) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none') continue;
      if (!bg.has(cs.backgroundColor))
        bg.set(cs.backgroundColor, e.tagName + '.' + String(e.className).slice(0, 50));
      if (cs.boxShadow !== 'none')
        shadows.push(e.tagName + '.' + String(e.className).slice(0, 40) + ' ' + cs.boxShadow);
    }
    return { bg: [...bg.entries()], shadows };
  });
  return {
    badBg: r.bg.filter(([c]) => !ALLOWED_BG.has(c) && !allowExtra.includes(c)),
    shadows: r.shadows,
  };
}

for (const slug of ['compress-image-to-50kb', 'webp-to-jpg', 'image-converter', 'compress-image']) {
  test(`flat design and allowed colours with a result, a failure and the menu open: /${slug}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await gotoTool(page, slug);
    const empty = await colourScan(page);
    expect(empty.badBg, 'backgrounds (idle)').toEqual([]);
    expect(empty.shadows, 'shadows (idle)').toEqual([]);
    await pickAndWait(page, [fixture('photo-2mp.jpg'), fixture('corrupt.jpg')]);
    const card = page.getByTestId('result-card').first();
    const cs = await card.evaluate((e) => {
      const s = getComputedStyle(e);
      return { shadow: s.boxShadow, bg: s.backgroundColor, border: s.borderTopWidth };
    });
    expect(cs.shadow).toBe('none');
    expect(cs.bg).toBe('rgb(255, 255, 255)');
    expect(cs.border).not.toBe('0px');
    // Red (#B42318) is allowed only inside error UI.
    const res = await colourScan(page, ['rgb(180, 35, 24)']);
    expect(res.shadows, 'shadows (results)').toEqual([]);
    expect(res.badBg, 'backgrounds (results)').toEqual([]);
    const redOutsideErrors = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((e) => getComputedStyle(e).backgroundColor === 'rgb(180, 35, 24)')
        .filter((e) => !e.closest('[role=alert], [data-status=failed], [data-state=failed]'))
        .map((e) => e.tagName),
    );
    expect(redOutsideErrors, 'danger background outside error UI').toEqual([]);
    const btn = await page
      .getByTestId('download')
      .first()
      .evaluate((e) => getComputedStyle(e).backgroundColor);
    // The primary Download button is crimson (redesign); secondary variants stay white or surface.
    expect([
      'rgb(192, 57, 43)',
      'rgb(169, 50, 38)',
      'rgb(255, 255, 255)',
      'rgb(240, 236, 228)',
    ]).toContain(btn);
    await page.locator('header summary').click();
    await page.waitForTimeout(500); // let the button's colour transition finish
    const withMenu = await colourScan(page, ['rgb(180, 35, 24)']);
    expect(withMenu.badBg, 'backgrounds (menu)').toEqual([]);
    expect(withMenu.shadows, 'shadows (menu)').toEqual([]);
  });
}

for (const path of ['/', '/about', '/privacy', '/favicon-generator', '/png-to-ico']) {
  test(`flat design and allowed colours on ${path}`, async ({ page }) => {
    await page.goto(path);
    // The favicon preview keeps its own neutral light and dark browser-tab mocks on purpose (.pin-dark).
    const res = await colourScan(
      page,
      path.startsWith('/favicon')
        ? ['rgb(43, 43, 43)', 'rgb(26, 26, 26)', 'rgb(245, 245, 245)', 'rgb(224, 224, 224)']
        : [],
    );
    expect(res.badBg).toEqual([]);
    expect(res.shadows).toEqual([]);
  });
}

// ── Single result ───────────────────────────────────────────────────────

for (const [slug, fx, re] of [
  ['compress-image-to-50kb', 'photo-2mp.jpg', /-50kb\.jpg$/],
  ['webp-to-jpg', 'photo-2mp.webp', /\.jpg$/],
] as const) {
  test(`single result: card Download is in the viewport and works, no batch button: /${slug}`, async ({
    page,
  }) => {
    await gotoTool(page, slug);
    await pickAndWait(page, fixture(fx));
    const dl = page.getByTestId('download');
    await expect(dl).toHaveCount(1);
    await expect(page.getByTestId('download-all')).toHaveCount(0);
    await expect(dl).toBeInViewport({ ratio: 1 });
    const b = (await dl.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(48);
    expect(b.y + b.height).toBeLessThanOrEqual(640);
    const [d] = await Promise.all([page.waitForEvent('download'), dl.click()]);
    expect(d.suggestedFilename()).toMatch(re);
    await expect(page.getByTestId('result-card').first()).toContainText(
      /\d+% smaller|\d+% larger|slightly larger|slightly smaller|same size/,
    );
  });
}

// ── Home ────────────────────────────────────────────────────────────────

test('home H1 is the new one', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Free Image Tools. No Upload. No Signup.');
});
