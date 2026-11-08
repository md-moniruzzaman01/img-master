// Ink Samurai redesign checks (spec 2026-10-24 section 16, DESIGN.md samurai sections).
import { expect, test, type Page } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { gotoFavicon, waitPreviewReady } from './helpers/favicon';
import { FAVICON_SLUGS, TOOL_SLUGS, gotoTool, pickAndWait, recordNetwork } from './helpers/tool';

test.beforeAll(ensureFixtures);

const SLUG = 'compress-image-to-50kb';
const stage = (page: Page) => page.getByTestId('samurai-stage').first();

/** Records every data-state value the stage shows, in order. */
async function watchStates(page: Page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid=samurai-stage]')!;
    const w = window as unknown as { __states: string[] };
    w.__states = [el.getAttribute('data-state')!];
    new MutationObserver(() => {
      const s = el.getAttribute('data-state')!;
      if (w.__states[w.__states.length - 1] !== s) w.__states.push(s);
    }).observe(el, { attributes: true, attributeFilter: ['data-state'] });
  });
}
const states = (page: Page) =>
  page.evaluate(() => (window as unknown as { __states: string[] }).__states);

// ── Fold ────────────────────────────────────────────────────────────────

test.describe('fold at 360x640', () => {
  test.use({ viewport: { width: 360, height: 640 } });
  for (const slug of [...TOOL_SLUGS, ...FAVICON_SLUGS]) {
    test(`stage, picker and privacy note end above 640: /${slug}`, async ({ page }) => {
      await page.goto(`/${slug}`);
      const textMode = slug === 'favicon-from-text' || slug === 'favicon-from-emoji';
      const parts = [stage(page), page.getByTestId('privacy-note').first()];
      if (!textMode) parts.push(page.getByTestId('file-picker'));
      for (const l of parts) {
        await expect(l).toBeVisible();
        const b = (await l.boundingBox())!;
        expect(b.y + b.height, `bottom ${b.y + b.height}`).toBeLessThanOrEqual(640);
      }
      const sb = (await stage(page).boundingBox())!;
      expect(sb.height).toBeLessThanOrEqual(130);
    });
  }
  // Current design: a compact status row (art in a 56px disc) up to lg, a tall panel from lg (1024).
  test('stage is a compact row below lg and a tall panel from lg up', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto(`/${SLUG}`);
    expect((await stage(page).boundingBox())!.height).toBeLessThanOrEqual(130);
    await page.setViewportSize({ width: 1280, height: 800 });
    expect((await stage(page).boundingBox())!.height).toBeGreaterThanOrEqual(200);
  });
});

// ── States ──────────────────────────────────────────────────────────────

test('stage goes idle, cutting, done for a photo', async ({ page }) => {
  await gotoTool(page, SLUG);
  await expect(stage(page)).toHaveAttribute('data-state', 'idle');
  await watchStates(page);
  await page.getByTestId('file-input').setInputFiles(fixture('photo-2mp.jpg'));
  await expect(stage(page)).toHaveAttribute('data-state', 'done', { timeout: 60_000 });
  const seen = await states(page);
  expect(seen[0]).toBe('idle');
  expect(seen).toContain('cutting');
  expect(seen.indexOf('cutting')).toBeLessThan(seen.lastIndexOf('done'));
  expect(seen.filter((s) => s === 'error')).toEqual([]);
});

test('stage shows error for a file that is not an image', async ({ page }) => {
  await gotoTool(page, SLUG);
  await page.getByTestId('file-input').setInputFiles(fixture('not-an-image.png'));
  await expect(stage(page)).toHaveAttribute('data-state', 'error', { timeout: 30_000 });
});

// ── Slash ───────────────────────────────────────────────────────────────

test('the cutting animation shows at least once per run, even for a tiny image', async ({
  page,
}) => {
  await gotoTool(page, SLUG);
  await page.evaluate(() => {
    const w = window as unknown as { __cuts: number };
    w.__cuts = 0;
    const el = document.querySelector('[data-testid=samurai-stage]')!;
    new MutationObserver(() => {
      if (el.querySelector('.sam-sweep')) w.__cuts = Math.max(w.__cuts, 1);
    }).observe(el, { subtree: true, childList: true, attributes: true });
  });
  await page.getByTestId('file-input').setInputFiles(fixture('tiny-40.jpg'));
  await expect(stage(page)).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  const cuts = await page.evaluate(() => (window as unknown as { __cuts: number }).__cuts);
  expect(cuts, 'sword sweep drawn while cutting').toBeGreaterThanOrEqual(1);
});

// ── Reduced motion ──────────────────────────────────────────────────────

test('reduced motion: no frame changes while idle, no slash animation after a run', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoTool(page, SLUG);
  const anim = () =>
    stage(page)
      .locator('.sam-body')
      .evaluate((e) => getComputedStyle(e).animationName);
  expect(await anim()).toBe('none');
  const snap = () => stage(page).evaluate((e) => e.innerHTML);
  const first = await snap();
  await page.waitForTimeout(1000);
  expect(await snap(), 'stage markup is still while idle').toBe(first);
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const sweep = page.locator('[data-testid=samurai-stage] .sam-sweep');
  for (const e of await sweep.all())
    expect(await e.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
});

// ── Sprite 404 ──────────────────────────────────────────────────────────

test('sprite 404 keeps the layout and the tool still works', async ({ page }) => {
  await page.route('**/samurai/kendo.svg*', (r) => r.abort());
  await gotoTool(page, SLUG);
  const before = (await stage(page).boundingBox())!;
  await page.waitForTimeout(500);
  const after = (await stage(page).boundingBox())!;
  expect(after.height).toBe(before.height);
  expect(after.width).toBe(before.width);
  const label = (await page.getByTestId('file-picker').boundingBox())!;
  expect(label.height).toBeGreaterThan(0);
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  await expect(page.getByTestId('result-card').first()).toHaveAttribute('data-status', 'success');
  expect((await stage(page).boundingBox())!.height).toBe(before.height);
});

// ── Favicon cut moment ──────────────────────────────────────────────────

test('favicon text: the cut plays after the first edit only', async ({ page }) => {
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  await page.evaluate(() => {
    const w = window as unknown as { __plays: number };
    w.__plays = 0;
    let on = false;
    new MutationObserver(() => {
      const n = document.querySelectorAll('[data-testid=cut-shard]').length;
      if (n > 0 && !on) w.__plays++;
      on = n > 0;
    }).observe(document.body, { subtree: true, childList: true });
  });
  const plays = () => page.evaluate(() => (window as unknown as { __plays: number }).__plays);
  const input = page.getByTestId('text-input');
  await input.click();
  await page.keyboard.type('Z');
  await expect.poll(plays, { timeout: 5_000 }).toBe(1);
  await expect(page.locator('[data-testid=cut-shard]')).toHaveCount(0, { timeout: 5_000 });
  await page.keyboard.type('abc', { delay: 80 });
  await waitPreviewReady(page);
  await page.waitForTimeout(1500);
  expect(await plays()).toBe(1);
});

// ── Sound ───────────────────────────────────────────────────────────────

test('no sound requests while sound is off; start.mp3 is fetched after turning it on', async ({
  page,
}) => {
  const reqs: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/sounds/')) reqs.push(r.url());
  });
  await gotoTool(page, SLUG);
  // On phones the header icon is hidden; the same toggle lives in the menu as a pill button.
  const hidden = page.getByTestId('sound-toggle');
  await expect(hidden).toHaveAttribute('aria-pressed', 'false');
  await expect(hidden).toHaveAttribute('aria-label', 'Sound on'); // constant label; aria-pressed carries the state
  const menu = page.locator('header details[data-menu="mobile"]');
  const pill = menu.getByRole('button', { name: 'Sound on' });
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  await page.waitForTimeout(1200);
  expect(reqs, 'sound requests while off').toEqual([]);
  await menu.locator('summary[aria-label="Menu"]').click();
  await expect(pill).toHaveAttribute('aria-pressed', 'false');
  await pill.click();
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  await expect(hidden).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /compress (more|another)/i }).click();
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  const hasAudio = await page.evaluate(
    () => typeof AudioContext !== 'undefined' || 'webkitAudioContext' in window,
  );
  if (!hasAudio) {
    // Playwright's WebKit build on Windows has no Web Audio: the app must stay silent and not fetch.
    test
      .info()
      .annotations.push({ type: 'note', description: 'No AudioContext in this browser build' });
    expect(reqs, 'sound requests without Web Audio').toEqual([]);
    return;
  }
  await expect
    .poll(() => reqs.some((u) => /\/sounds\/start\.mp3\?v=1/.test(u)), { timeout: 5000 })
    .toBe(true);
});

// ── No external hosts ───────────────────────────────────────────────────

test('every request is same-origin across home, a compress run and favicon pages', async ({
  page,
  context,
  baseURL,
}) => {
  const net = recordNetwork(context);
  await page.goto('/');
  await page.waitForTimeout(800);
  await gotoTool(page, SLUG);
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  await gotoFavicon(page, 'favicon-generator');
  await gotoFavicon(page, 'favicon-from-text');
  await waitPreviewReady(page);
  await page.getByTestId('text-input').click();
  await page.keyboard.type('Q');
  await page.waitForTimeout(1500);
  const origin = new URL(baseURL!).origin;
  const bad = net.filter(
    (n) => !['blob:', 'data:', 'about:'].includes(n.origin) && n.origin !== origin,
  );
  expect(bad.map((b) => b.url)).toEqual([]);
  expect(net.filter((n) => n.method !== 'GET' && n.method !== 'HEAD')).toEqual([]);
});
