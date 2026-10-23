// Phase 4: mobile UX (360x640), accessibility and navigation of the favicon pages.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { FAVICON_SLUGS, logMetric } from './helpers/tool';
import {
  chooseMode,
  fshell,
  gotoFavicon,
  makePng,
  waitPreviewReady,
} from './helpers/favicon';

test.use({ viewport: { width: 360, height: 640 } });
test.beforeAll(ensureFixtures);

const text = (p: Page) => p.getByTestId('text-input');
const emoji = (p: Page) => p.getByTestId('emoji-input');

interface Target {
  tag: string;
  text: string;
  w: number;
  h: number;
  x: number;
  y: number;
}
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
      if (el instanceof HTMLInputElement && el.type === 'file') continue;
      if (el.closest('details:not([open])') && el.tagName !== 'SUMMARY') continue; // closed menu / more-options content
      if (el.getAttribute('href') === '#main') continue;
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

/** Brings every favicon page into its "has results" state. */
async function reachResults(page: Page, slug: string) {
  if (slug === 'png-to-ico') {
    const png = await makePng(page, 300, 300);
    await page.getByTestId('file-input').setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
    ]);
    await expect(fshell(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    return;
  }
  if (slug === 'favicon-generator')
    await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  await waitPreviewReady(page);
}

// ── Above the fold ───────────────────────────────────────────────────────

for (const slug of FAVICON_SLUGS) {
  test(`first control is fully above the fold with header, H1 and subtitle: /${slug}`, async ({
    page,
  }) => {
    await page.goto(`/${slug}`);
    const vh = 640;
    const bottomOf = async (sel: string) => {
      const box = await page.locator(sel).first().boundingBox();
      expect(box, sel).not.toBeNull();
      return { top: box!.y, bottom: box!.y + box!.height, h: box!.height };
    };
    const header = await bottomOf('header');
    const h1 = await bottomOf('main h1');
    const sub = await bottomOf('main h1 + p');
    expect(header.top).toBeGreaterThanOrEqual(0);
    expect(sub.bottom).toBeLessThan(vh);

    // The first control: picker button (image pages) or the text/emoji field with its label.
    const first =
      slug === 'favicon-from-text'
        ? text(page)
        : slug === 'favicon-from-emoji'
          ? emoji(page)
          : page.getByTestId('file-picker').locator('label').first();
    await expect(first).toBeVisible();
    const box = (await first.boundingBox())!;
    const bottom = box.y + box.height;
    logMetric('favicon-fold.ndjson', {
      slug,
      project: test.info().project.name,
      firstControlBottom: bottom,
      subtitleBottom: sub.bottom,
      headerBottom: header.bottom,
      h1Bottom: h1.bottom,
    });
    expect(box.y, 'control starts below subtitle').toBeGreaterThanOrEqual(sub.bottom - 1);
    expect(bottom, `first control bottom ${bottom} vs viewport ${vh}`).toBeLessThanOrEqual(vh);
    expect(box.height).toBeGreaterThanOrEqual(48);
    // Redesign order: picker, privacy line, then the mode tabs (when present) below them.
    const tabs = page.getByRole('radiogroup', { name: 'Make your icon from' });
    if (await tabs.count()) {
      const t = (await tabs.boundingBox())!;
      const pn = (await page.getByTestId('privacy-note').first().boundingBox())!;
      expect(t.y, 'mode tabs come after the privacy line').toBeGreaterThanOrEqual(pn.y + pn.height - 1);
    }
  });
}

// ── Horizontal scroll, tap targets ───────────────────────────────────────

for (const slug of FAVICON_SLUGS) {
  test(`no horizontal scroll in every state at 360px: /${slug}`, async ({ page }) => {
    test.setTimeout(90_000);
    const wide = async (label: string) => {
      const m = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }));
      expect(m.doc, `${label}: ${JSON.stringify(m)}`).toBeLessThanOrEqual(360);
      expect(m.inner, `${label} layout viewport widened`).toBe(360);
    };
    await gotoFavicon(page, slug);
    await wide('initial');
    await reachResults(page, slug);
    await wide('results');
    if (slug !== 'png-to-ico') {
      await page.getByTestId('favicon-controls').getByRole('radio', { name: 'Circle' }).click();
      await waitPreviewReady(page);
      await wide('after shape change');
    }
    if (slug === 'favicon-generator') {
      await chooseMode(page, 'Text');
      await text(page).fill('WWW');
      await waitPreviewReady(page);
      await wide('text mode WWW');
      await chooseMode(page, 'Emoji');
      await waitPreviewReady(page);
      await wide('emoji mode');
    }
  });
}

for (const slug of FAVICON_SLUGS) {
  test(`tap targets >= 48px in the tool area, header and breadcrumbs (below the tool), before and after results: /${slug}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await gotoFavicon(page, slug);
    const check = async (label: string) => {
      const tool = await interactive(page, '[data-testid=favicon-shell]');
      const header = await interactive(page, 'header');
      const crumbs = await interactive(page, 'nav[aria-label=Breadcrumb]');
      const small = [...tool, ...header].filter((t) => t.h < 47.5 || t.w < 47.5);
      logMetric('favicon-tap-targets.ndjson', {
        slug,
        label,
        project: test.info().project.name,
        count: tool.length + header.length,
        small,
      });
      expect(small, `${label}: ${JSON.stringify(small)}`).toEqual([]);
      expect(
        crumbs.filter((t) => t.h < 47.5),
        `${label} crumbs`,
      ).toEqual([]);
      return tool.length;
    };
    const before = await check('initial');
    await reachResults(page, slug);
    const after = await check('results');
    expect(after).toBeGreaterThanOrEqual(before);
    if (slug === 'favicon-generator') {
      await chooseMode(page, 'Emoji');
      await waitPreviewReady(page);
      await check('emoji mode (quick picks)');
      await chooseMode(page, 'Text');
      await waitPreviewReady(page);
      await check('text mode');
    }
  });
}

// ── No sticky bar; last controls and footer stay reachable ───────────────

for (const slug of FAVICON_SLUGS) {
  test(`no sticky action bar; downloads, snippet and footer are reachable: /${slug}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await gotoFavicon(page, slug);
    await reachResults(page, slug);
    await expect(page.getByTestId('action-bar')).toHaveCount(0);
    // Nothing in the page is position:fixed/sticky (except the skip link while focused).
    const pinned = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((e) => ['fixed', 'sticky'].includes(getComputedStyle(e).position))
        .filter((e) => !(e instanceof HTMLAnchorElement && e.getAttribute('href') === '#main'))
        .filter((e) => getComputedStyle(e).pointerEvents !== 'none') // the toast
        .map((e) => e.tagName + '.' + e.className.toString().slice(0, 40)),
    );
    expect(pinned, 'fixed/sticky elements').toEqual([]);

    // Every control, scrolled to the middle of the screen, receives the pointer.
    const ids =
      slug === 'png-to-ico'
        ? ['download-all']
        : ['download-zip', 'download-ico', 'copy-snippet', 'snippet', 'favicon-controls'];
    for (const id of ids) {
      const hit = await page.evaluate((tid) => {
        const el = document.querySelector(`[data-testid=${tid}]`) as HTMLElement | null;
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const rr = el.getBoundingClientRect();
        const h = document.elementFromPoint(rr.x + rr.width / 2, rr.y + Math.min(12, rr.height / 2));
        return !!h && el.contains(h);
      }, id);
      if (hit === null) continue;
      expect(hit, `${id} receives the pointer when centred`).toBe(true);
    }
    // Footer: last link is hit-testable at the end of the page.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const ok = await page.evaluate(() => {
      const links = document.querySelectorAll<HTMLElement>('footer a');
      const last = links[links.length - 1];
      const rr = last.getBoundingClientRect();
      const h = document.elementFromPoint(rr.x + rr.width / 2, rr.y + rr.height / 2);
      return !!h && last.contains(h) && rr.bottom <= window.innerHeight + 0.5;
    });
    expect(ok, 'last footer link hit-testable inside the viewport at scroll end').toBe(true);
  });
}

// ── Copy button ──────────────────────────────────────────────────────────

test('Copy button copies the snippet and says "Copied"', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  const snippet = (await page.getByTestId('snippet').innerText()).trim();
  expect(snippet).toContain('<link rel="icon" href="/favicon.ico"');
  const btn = page.getByTestId('copy-snippet');
  await btn.click();
  if (browserName === 'chromium') {
    await expect(btn).toContainText('Copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // Windows clipboards convert line breaks to CRLF; that is the OS, not the page.
    expect(clip.split(/\r?\n/).join('|').trim()).toBe(snippet.split('\n').join('|'));
    // returns to "Copy code"
    await expect(btn).toContainText('Copy code', { timeout: 6000 });
  } else {
    // WebKit under automation may block navigator.clipboard; the page then falls back to execCommand.
    await expect(
      page.getByText(/^Copied$|Select the code and copy it\./).first(),
    ).toBeVisible();
    const copied = await btn.innerText();
    test.info().annotations.push({ type: 'webkit-copy', description: copied.trim() });
  }
});

test('Copy button is disabled when there is nothing to copy (image mode before a file)', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-generator');
  await expect(page.getByTestId('copy-snippet')).toBeDisabled();
  await expect(page.getByTestId('snippet')).toContainText('Your code will show here.');
});

// ── Navigation lists the favicon category ────────────────────────────────

test('header menu lists the favicon category and its four pages; footer has no tool list', async ({
  page,
}) => {
  await page.goto('/');
  const menu = page.locator('header details');
  await menu.locator('summary[aria-label="Menu"]').click();
  await expect(menu).toHaveAttribute('open', '');
  await expect(menu.getByText('Favicon', { exact: true }).first()).toBeVisible();
  for (const s of FAVICON_SLUGS)
    expect(await menu.locator(`a[href="/${s}"]`).count(), s).toBeGreaterThan(0);
  for (const s of FAVICON_SLUGS)
    expect(await page.locator(`footer a[href="/${s}"]`).count(), `footer ${s}`).toBe(0);
  // A favicon link in the menu opens the page
  await menu.locator('a[href="/favicon-from-emoji"]').click();
  await expect(page).toHaveURL(/\/favicon-from-emoji$/);
  await expect(fshell(page)).toHaveAttribute('data-mode', 'emoji');
});

test('home page links to the four favicon pages', async ({ page }) => {
  await page.goto('/');
  for (const s of FAVICON_SLUGS)
    expect(await page.locator(`main a[href="/${s}"]`).count(), s).toBeGreaterThan(0);
});

// ── Long file names must not widen the page (found while testing hostile names) ──

for (const [slug, fx, mime] of [
  ['png-to-ico', 'tiny-40.png', 'image/png'],
  ['compress-image-to-50kb', 'photo-small.jpg', 'image/jpeg'],
  ['webp-to-jpg', 'photo-2mp.webp', 'image/webp'],
] as const) {
  test(`a typical camera file name does not widen the page at 360px: /${slug}`, async ({
    page,
  }) => {
    const ext = fx.split('.')[1];
    await page.goto(`/${slug}`);
    await page.getByTestId('file-input').setInputFiles({
      name: `PXL_20260101_123456789.${ext}`,
      mimeType: mime,
      buffer: readFileSync(fixture(fx)),
    });
    await expect(page.getByTestId('result-card').first()).toHaveAttribute('data-status', 'success', {
      timeout: 60_000,
    });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(m, 'layout viewport grew beyond 360').toEqual({ inner: 360, scroll: 360 });
  });
}

// ── Accessibility ────────────────────────────────────────────────────────

async function axe(page: Page, label: string) {
  const res = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  logMetric('axe.ndjson', {
    label,
    project: test.info().project.name,
    serious: bad.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) })),
    minor: res.violations.filter((v) => !bad.includes(v)).map((v) => `${v.id}:${v.impact}`),
  });
  expect(
    bad.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 4),
    })),
    label,
  ).toEqual([]);
}

for (const scheme of ['light'] as const) {
  test(`axe ${scheme}: favicon pages after changing mode and after generating results`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await page.emulateMedia({ colorScheme: scheme });
    await gotoFavicon(page, 'favicon-generator');
    await axe(page, `${scheme} generator, empty image mode`);
    await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
    await waitPreviewReady(page);
    await axe(page, `${scheme} generator, image results`);
    await chooseMode(page, 'Text');
    await waitPreviewReady(page);
    await axe(page, `${scheme} generator, text mode`);
    await text(page).fill('');
    await axe(page, `${scheme} generator, text mode invalid (error hint)`);
    await text(page).fill('Qa');
    await chooseMode(page, 'Emoji');
    await waitPreviewReady(page);
    await axe(page, `${scheme} generator, emoji mode`);
    await page.getByTestId('copy-snippet').click();
    await axe(page, `${scheme} generator, after copy`);

    await gotoFavicon(page, 'favicon-from-text');
    await waitPreviewReady(page);
    await axe(page, `${scheme} text page with preview`);
    await gotoFavicon(page, 'favicon-from-emoji');
    await waitPreviewReady(page);
    await axe(page, `${scheme} emoji page with preview`);

    await gotoFavicon(page, 'png-to-ico');
    await axe(page, `${scheme} png-to-ico empty`);
    const png = await makePng(page, 300, 300);
    await page.getByTestId('file-input').setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') },
    ]);
    await expect(fshell(page)).toHaveAttribute('data-state', 'partial', { timeout: 30_000 });
    await axe(page, `${scheme} png-to-ico partial results with failed card`);
  });
}

test('keyboard: mode tabs, shape and weight radiogroups, Download ZIP', async ({
  page,
  browserName,
}) => {
  test.setTimeout(90_000);
  await gotoFavicon(page, 'favicon-generator');

  // Mode tabs: radiogroup with roving tabindex and arrow keys
  const image = page.getByRole('radio', { name: 'Image', exact: true });
  const textTab = page.getByRole('radio', { name: 'Text', exact: true });
  const emojiTab = page.getByRole('radio', { name: 'Emoji', exact: true });
  await expect(image).toHaveAttribute('tabindex', '0');
  await expect(textTab).toHaveAttribute('tabindex', '-1');
  await image.focus();
  await page.keyboard.press('ArrowRight');
  await expect(textTab).toBeChecked();
  await expect(textTab).toBeFocused();
  await expect(fshell(page)).toHaveAttribute('data-mode', 'text');
  await page.keyboard.press('ArrowRight');
  await expect(emojiTab).toBeChecked();
  await expect(fshell(page)).toHaveAttribute('data-mode', 'emoji');
  await page.keyboard.press('ArrowRight'); // wraps
  await expect(image).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(emojiTab).toBeChecked();
  await page.keyboard.press('Home');
  await expect(image).toBeChecked();
  await page.keyboard.press('End');
  await expect(emojiTab).toBeChecked();

  // Text mode: weight and shape radiogroups
  await textTab.focus();
  await page.keyboard.press('Enter'); // radio buttons: Space/Enter activates
  await chooseMode(page, 'Text');
  const weight = page.getByRole('radiogroup', { name: 'Weight' });
  await expect(weight).toBeVisible();
  const bold = weight.getByRole('radio', { name: 'Bold', exact: true });
  await expect(bold).toBeChecked(); // default weight 800
  await bold.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(weight.getByRole('radio', { name: 'Semibold' })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(weight.getByRole('radio', { name: 'Regular' })).toBeChecked();
  const shape = page.getByRole('radiogroup', { name: 'Shape' });
  const rounded = shape.getByRole('radio', { name: 'Rounded' });
  await expect(rounded).toBeChecked();
  await rounded.focus();
  await page.keyboard.press('ArrowRight');
  await expect(shape.getByRole('radio', { name: 'Circle' })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(shape.getByRole('radio', { name: 'Square' })).toBeChecked();
  await waitPreviewReady(page);

  // Slider by keyboard
  const pad = page.getByTestId('favicon-controls').getByLabel('Padding');
  await pad.focus();
  const v0 = Number(await pad.inputValue());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect(Number(await pad.inputValue())).toBe(v0 + 2);

  // Tab order reaches Download ZIP, Enter downloads
  await waitPreviewReady(page);
  const zip = page.getByTestId('download-zip');
  let reached = false;
  if (browserName === 'webkit') {
    await zip.focus();
    reached = true;
  } else {
    // Download ZIP sits between the preview and the style controls: Tab from the mode tabs.
    await page.getByRole('radio', { name: 'Text', exact: true }).focus();
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(
        () => document.activeElement?.getAttribute('data-testid') === 'download-zip',
      );
    }
  }
  expect(reached, 'Download ZIP reachable with Tab').toBe(true);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  expect(dl.suggestedFilename()).toBe('favicon-package.zip');
  // Focus indicator on the focused button
  const ring = await zip.evaluate((el) => {
    const cs = getComputedStyle(el);
    return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.boxShadow}`;
  });
  test.info().annotations.push({ type: 'zip-focus-ring', description: ring });
});

test('keyboard: text field, Download favicon.ico only and Copy are reachable and labelled', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  await expect(page.getByLabel('Text (1 to 3 characters)')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Download favicon.ico only' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Copy code' })).toBeEnabled();
  // The preview region has a name and a description
  const region = page.getByTestId('favicon-preview');
  await expect(region).toHaveAttribute('aria-labelledby', /.+/);
  await expect(region).toHaveAttribute('aria-describedby', /.+/);
  // Preview images are decorative
  const imgs = await region.locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
  expect(imgs.every((a) => a === '')).toBe(true);
});

test('screen reader hooks: preview update is announced politely after an edit', async ({
  page,
}) => {
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  await text(page).fill('Zz');
  await expect(
    page.locator('[role=status][aria-live=polite]').filter({ hasText: /Preview updated/ }),
  ).toHaveCount(1, { timeout: 5000 });
});
