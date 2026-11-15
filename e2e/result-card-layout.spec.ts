// Regression: after a conversion the result card must lay out by its own width. At wide windows the
// file name and size text once collapsed to ~30 px and wrapped one letter per line.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers/fixtures';
import { cards, logMetric, pickAndWait } from './helpers/tool';

const GEN = (n: string) => join(ROOT, 'e2e', 'fixtures', 'generated', n);
const HEIC = join(ROOT, 'e2e', 'fixtures', 'heic', 'colors-no-alpha.heic');

const WIDTHS = [
  { w: 1536, h: 760 },
  { w: 1280, h: 800 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
];

const PAGES: { path: string; file: string; kind: 'tool' | 'favicon' }[] = [
  { path: '/', file: GEN('photo-2mp.jpg'), kind: 'tool' },
  { path: '/compress-image-to-50kb', file: GEN('photo-2mp.jpg'), kind: 'tool' },
  { path: '/heic-to-jpg', file: HEIC, kind: 'tool' },
  { path: '/png-to-ico', file: GEN('photo-2mp.png'), kind: 'favicon' },
];

async function noOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/** A text element is healthy when it is wide enough and has at most two lines of text. */
async function checkText(el: Locator, what: string, minW = 200): Promise<void> {
  const m = await el.evaluate((n) => {
    const r = n.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(n).lineHeight) || 24;
    return { w: r.width, h: r.height, lh };
  });
  expect(m.w, `${what} width`).toBeGreaterThanOrEqual(minW);
  expect(m.h, `${what} height ${m.h} vs line ${m.lh}`).toBeLessThanOrEqual(m.lh * 2.2);
}

for (const pg of PAGES) {
  for (const s of WIDTHS) {
    test(`result card layout ${pg.path} at ${s.w}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile-chromium', 'viewport is set explicitly; run once');
      test.setTimeout(120_000);
      page.on('dialog', (d) => void d.accept());
      await page.setViewportSize({ width: s.w, height: s.h });
      await page.goto(pg.path);
      if (pg.kind === 'favicon') {
        await page.getByTestId('file-input').setInputFiles(pg.file);
        await expect(page.getByTestId('favicon-shell')).toHaveAttribute('data-state', 'done', {
          timeout: 30_000,
        });
      } else {
        await pickAndWait(page, pg.file);
      }
      const card = cards(page).first();
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('data-status', 'success');
      const name = card.getByTestId('file-name');
      // Phones: the thumbnail takes 92 px, so the name column is ~200 px at 390 (198 on the home hero card).
      const minW = s.w <= 390 ? 180 : 200;
      await checkText(name, 'file name', minW);
      // The size line: first text paragraph after the name, the one with the byte sizes.
      const size = card.locator('p.tabular-nums').first();
      await checkText(size, 'size text', minW);
      const box = (await card.boundingBox())!;
      expect(box.x + box.width, 'card inside viewport').toBeLessThanOrEqual(s.w + 1);
      expect(await noOverflow(page), 'horizontal overflow').toBeLessThanOrEqual(0);
      logMetric('result-card-layout.ndjson', {
        path: pg.path,
        w: s.w,
        cardW: Math.round(box.width),
        nameW: Math.round((await name.boundingBox())!.width),
        sizeW: Math.round((await size.boundingBox())!.width),
      });
    });
  }
}

test('very long file name truncates and does not break the layout', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-chromium', 'viewport is set explicitly; run once');
  page.on('dialog', (d) => void d.accept());
  const long = `${'very-long-holiday-photo-name-'.repeat(8)}end.jpg`;
  const buffer = readFileSync(GEN('photo-2mp.jpg'));
  for (const s of [WIDTHS[0], WIDTHS[3], WIDTHS[4]]) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.goto('/compress-image-to-50kb');
    await pickAndWait(page, [{ name: long, mimeType: 'image/jpeg', buffer }]);
    const card = cards(page).first();
    await expect(card).toHaveAttribute('data-status', 'success');
    const name = card.getByTestId('file-name');
    const m = await name.evaluate((n) => ({
      w: n.getBoundingClientRect().width,
      h: n.getBoundingClientRect().height,
      truncated: n.scrollWidth > n.clientWidth,
      overflow: getComputedStyle(n).textOverflow,
    }));
    expect(m.truncated, 'long name is cut with an ellipsis').toBe(true);
    expect(m.overflow).toBe('ellipsis');
    expect(m.w).toBeGreaterThanOrEqual(150);
    expect(m.h).toBeLessThan(40);
    await checkText(card.locator('p.tabular-nums').first(), 'size text', 150);
    expect(await noOverflow(page), `overflow at ${s.w}`).toBeLessThanOrEqual(0);
    // Download buttons stay inside the card.
    const cb = (await card.boundingBox())!;
    const db = (await card.getByTestId('download').boundingBox())!;
    expect(db.x + db.width).toBeLessThanOrEqual(cb.x + cb.width + 1);
  }
});
