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
const HEADER_MAX = 68;
const INFO = ['/about', '/privacy', '/terms', '/contact'];
// Header carries these three; Terms and Contact live in the footer (two-line footer, DESIGN.md §4.1).
const HEADER_INFO = ['/how-it-works', '/about', '/privacy'];

// ── Header ──────────────────────────────────────────────────────────────

for (const path of ALL_PATHS) {
  test(`header is at most 68px tall and not sticky: ${path}`, async ({ page }) => {
    await page.goto(path);
    const h = await page.locator('header').first().boundingBox();
    // Figma header is ~65px (DESIGN.md §4.1 text still says 52: stale doc, see report).
    expect(h!.height).toBeLessThanOrEqual(HEADER_MAX);
    const pos = await page
      .locator('header')
      .first()
      .evaluate((e) => getComputedStyle(e).position);
    expect(pos).not.toBe('sticky');
    expect(pos).not.toBe('fixed');
  });
}

// ── Menu ────────────────────────────────────────────────────────────────

test('menu: server HTML lists every tool in the static HTML; phone menu has the hubs and key tools; opens; Esc closes and returns focus', async ({
  page,
  request,
}) => {
  // Crawlable without JavaScript.
  const html = await (await request.get('/about')).text();
  const header = /<header[\s\S]*?<\/header>/.exec(html)![0];
  for (const s of ALL_TOOLS) expect(header, s).toContain(`href="/${s}"`);
  for (const l of HEADER_INFO) expect(header, l).toContain(`href="${l}"`);
  const footerHtml = /<footer[\s\S]*?<\/footer>/.exec(html)![0];
  for (const l of ['/terms', '/contact']) expect(footerHtml, l).toContain(`href="${l}"`);

  await page.goto('/compress-image-to-50kb');
  const details = page.locator('header details[data-menu="mobile"]');
  const summary = details.locator('summary[aria-label="Menu"]');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toBeVisible();
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  const hrefs = await details
    .locator('a[href]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  // Phone menu: 6 size chips, 3 convert pairs + More, Favicon generator, PNG to ICO, Resize, info links.
  const MOBILE = [
    ...['20kb', '50kb', '100kb', '200kb', '500kb', '1mb'].map((k) => `/compress-image-to-${k}`),
    '/image-converter',
    '/favicon-generator',
    '/png-to-ico',
    '/resize-image',
    ...HEADER_INFO,
  ];
  for (const h of MOBILE) expect(hrefs, h).toContain(h.startsWith('/') ? h : `/${h}`);
  expect(hrefs.length, `phone menu links: ${hrefs.length}`).toBeGreaterThanOrEqual(15);
  // Opening the menu does not move the page below it.
  const h1Top = (await page.locator('main h1').boundingBox())!.y;
  await page.keyboard.press('Escape');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  expect((await page.locator('main h1').boundingBox())!.y).toBe(h1Top);
});

test('menu: closes on link tap and on outside tap', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('header details[data-menu="mobile"]');
  const summary = details.locator('summary');
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  // Outside tap: the panel covers the page, so tap the empty part of the header bar.
  await page.mouse.click(180, 25);
  await expect(details).not.toHaveAttribute('open', '');
  await summary.click();
  await details.locator('a[href="/webp-to-jpg"]').click();
  await expect(page).toHaveURL(/\/webp-to-jpg$/);
  await expect(page.locator('header details[data-menu="mobile"]')).not.toHaveAttribute('open', '');
});

test('desktop 1280: no menu button; Compress, Convert, Resize, Favicon, How it works', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(
    page.locator('header details[data-menu="mobile"] summary[aria-label="Menu"]'),
  ).toBeHidden();
  const nav = page.locator('header nav[aria-label="Main"]');
  await expect(nav).toBeVisible();
  // Top-level items: Compress / Convert / Favicon open mega menus (<summary>), Resize and How it works are links.
  const tops = nav.locator(':scope > ul > li');
  const labels = await tops.evaluateAll((lis) =>
    lis.map((li) => (li.querySelector('summary, a')?.textContent ?? '').replace(/\s+/g, ' ').trim()),
  );
  expect(labels).toEqual(['Compress', 'Convert', 'Resize', 'Favicon', 'How it works']);
  for (const li of await tops.all()) {
    const item = li.locator('summary, a').first();
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
  }
  for (const a of await nav.locator(':scope > ul > li > a').all()) {
    const res = await page.request.get((await a.getAttribute('href'))!);
    expect(res.status()).toBe(200);
  }
});

// ── Footer ──────────────────────────────────────────────────────────────

// Current footer (Figma): dark band, brand name, three phone links (All tools, How it works,
// About · Privacy · Terms) and the copyright line; the 4-column nav is desktop only.
for (const path of ['/', '/compress-image-to-50kb', '/png-to-ico', '/about']) {
  test(`footer (phone): compact link list + copyright; links >= 48px: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    const year = new Date().getFullYear();
    const txt = (await footer.innerText()).replace(/\s+/g, ' ').trim();
    expect(txt).toContain(`© ${year} Img Master · Built by Softwara`);
    const visible = await footer.locator('a[href^="/"]').evaluateAll((as) =>
      as
        .filter((a) => {
          const r = a.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((a) => a.getAttribute('href')),
    );
    expect(visible).toEqual(['/tools', '/how-it-works', '/about', '/privacy', '/terms']);
    // Contact stays crawlable in the static HTML (desktop footer column).
    const html = await (await page.request.get(path)).text();
    expect(/<footer[\s\S]*?<\/footer>/.exec(html)![0]).toContain('href="/contact"');
    for (const a of await footer.locator('a:visible').all())
      expect((await a.boundingBox())!.height, `footer link ${await a.innerText()}`).toBeGreaterThanOrEqual(47.5);
  });
}

// ── Picker and privacy line above the fold ──────────────────────────────

for (const slug of ALL_TOOLS) {
  test(`picker, then privacy line, both above the fold: /${slug}`, async ({ page }) => {
    await page.goto(`/${slug}`);
    const textMode = slug === 'favicon-from-text' || slug === 'favicon-from-emoji';
    const privacy = page.getByTestId('privacy-note').first();
    await expect(privacy).toBeVisible();
    await expect(privacy).toHaveText(/Processed on this device\. Nothing is uploaded\./);
    const pb = (await privacy.boundingBox())!;
    expect(pb.y + pb.height, `privacy line bottom ${pb.y + pb.height}`).toBeLessThanOrEqual(640);
    if (textMode) return; // first control is a text field, not the picker button
    const label = page.getByTestId('file-picker');
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
      const label = document.querySelector('[data-testid=file-picker]') as HTMLElement;
      const bottom = label.getBoundingClientRect().bottom;
      const els = [
        ...document.querySelectorAll<HTMLElement>(
          'main h1, main h2, main p, main button, main a, main label, main summary, main input:not([type=file]), main select, main textarea',
        ),
      ]
        .filter((e) => e !== label && !label.contains(e))
        .map((e) => ({ e, r: e.getBoundingClientRect(), cs: getComputedStyle(e) }))
        .filter(
          ({ r, cs }) =>
            r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
        )
        // Below the picker button on screen ("More options" is the collapsed row some pages keep there).
        .filter(({ r }) => r.top >= bottom - 1)
        .filter(({ e }) => !(e.tagName === 'SUMMARY' && /more options/i.test(e.textContent ?? '')))
        .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
      const e = els[0]?.e;
      return e
        ? (e.getAttribute('data-testid') ?? e.tagName + ':' + (e.textContent ?? '').slice(0, 30))
        : null;
    });
    expect(next, 'first visible element after the picker button').toBe('privacy-note');
  });
}

// ── Flat cards, allowed colours ─────────────────────────────────────────

// Palette discipline (DESIGN.md colour tokens): every opaque background must equal a design token
// (`--paper`, `--card`, `--shu`, ... in app/globals.css, light or dark). The set is resolved in the
// browser from the stylesheet, so tokens can change without editing this test, but a raw colour can't sneak in.
async function tokenRgb(page: Page, name: string) {
  return page.evaluate((n) => {
    const p = document.createElement('i');
    document.body.appendChild(p);
    p.style.backgroundColor = `var(${n})`;
    const c = getComputedStyle(p).backgroundColor;
    p.remove();
    return c;
  }, name);
}

async function colourScan(page: Page, allowExtra: string[] = []) {
  const r = await page.evaluate(() => {
    const probe = document.createElement('i');
    document.body.appendChild(probe);
    const names = new Set<string>();
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list: CSSRuleList) => {
        for (const rule of [...list]) {
          if (rule instanceof CSSStyleRule)
            for (const p of [...rule.style]) if (p.startsWith('--')) names.add(p);
          if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
        }
      };
      walk(rules);
    }
    const tokens = new Set<string>(['rgba(0, 0, 0, 0)']);
    for (const n of names) {
      probe.style.backgroundColor = '';
      probe.style.backgroundColor = `var(${n})`;
      const c = getComputedStyle(probe).backgroundColor;
      if (/^(rgb|color)/.test(c)) tokens.add(c);
    }
    probe.remove();
    const bg = new Map<string, string>();
    const shadows: string[] = [];
    for (const e of document.querySelectorAll<HTMLElement>('body, body *')) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none') continue;
      const c = cs.backgroundColor;
      // Translucent mixes (scrims, tints) are derived from tokens: only opaque colours are checked.
      const translucent = /^rgba\(|\/ ?[0-9.]+\)$/.test(c) && !/, 1\)$/.test(c);
      if (!tokens.has(c) && !translucent && !bg.has(c))
        bg.set(c, e.tagName + '.' + String(e.className).slice(0, 50));
      // The only shadow in the design is the soft float shadow on menus and dialogs.
      if (cs.boxShadow !== 'none' && !e.closest('[data-menu-panel], dialog, [role=dialog], [data-float]'))
        shadows.push(e.tagName + '.' + String(e.className).slice(0, 40) + ' ' + cs.boxShadow);
    }
    return { bg: [...bg.entries()], shadows };
  });
  return {
    badBg: r.bg.filter(([c]) => !allowExtra.includes(c)),
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
    expect(cs.bg).toBe(await tokenRgb(page, '--card'));
    expect(cs.border).not.toBe('0px');
    // The old dedicated danger red is gone: errors use the crimson (--shu) tokens, so the palette scan covers them.
    const res = await colourScan(page);
    expect(res.shadows, 'shadows (results)').toEqual([]);
    expect(res.badBg, 'backgrounds (results)').toEqual([]);
    const btn = await page
      .getByTestId('download')
      .first()
      .evaluate((e) => getComputedStyle(e).backgroundColor);
    // The primary Download button is crimson (redesign); secondary variants stay white or surface.
    expect([
      await tokenRgb(page, '--shu'),
      await tokenRgb(page, '--shu-deep'),
      await tokenRgb(page, '--card'),
      await tokenRgb(page, '--paper-2'),
      await tokenRgb(page, '--ink'),
    ]).toContain(btn);
    await page.locator('header details[data-menu="mobile"] summary').click();
    await page.waitForTimeout(500); // let the button's colour transition finish
    const withMenu = await colourScan(page);
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
        : [], // neutral browser-tab mocks
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
  await expect(page.locator('h1')).toHaveText(/^Cut any image down to size\.$/);
});
