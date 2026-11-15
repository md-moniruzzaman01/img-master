// HEIC pages: layout at four widths in light and dark, axe, screenshots, navigation entries.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers/fixtures';
import { logMetric } from './helpers/tool';

const SHOTS = join(ROOT, 'reports', 'screens');
mkdirSync(SHOTS, { recursive: true });
const SLUGS = ['heic-to-jpg', 'heic-to-png', 'webp-to-jpg'];
const SIZES = [
  { w: 360, h: 640 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1280, h: 800 },
];

for (const slug of SLUGS) {
  for (const scheme of ['light', 'dark'] as const) {
    for (const s of SIZES) {
      test(`layout ${slug} ${s.w}x${s.h} ${scheme}`, async ({ page }, info) => {
        await page.setViewportSize({ width: s.w, height: s.h });
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(`/${slug}`);
        await expect(page.getByTestId('tool-shell')).toBeVisible();
        // The inline theme script follows the system setting (no saved choice).
        expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
          scheme,
        );
        const picker = page.getByTestId('file-picker');
        await expect(picker).toBeVisible();
        const box = (await picker.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, 'picker bottom vs viewport').toBeLessThanOrEqual(s.h);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(over, 'horizontal overflow px').toBeLessThanOrEqual(0);
        logMetric('heic-layout.ndjson', {
          slug,
          scheme,
          ...s,
          project: info.project.name,
          pickerBottom: box.y + box.height,
          pickerH: box.height,
        });
        if (s.w === 360 && s.h === 640) {
          await page.screenshot({
            path: join(SHOTS, `${slug}-360-${scheme}-${info.project.name}.png`),
          });
          await page.screenshot({
            path: join(SHOTS, `${slug}-360-${scheme}-${info.project.name}-full.png`),
            fullPage: true,
          });
        }
        if (s.w === 1280)
          await page.screenshot({ path: join(SHOTS, `${slug}-1280-${scheme}-${info.project.name}.png`) });
      });
    }

    test(`axe ${slug} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/${slug}`);
      await expect(page.getByTestId('tool-shell')).toBeVisible();
      const res = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      logMetric('heic-axe.ndjson', {
        slug,
        scheme,
        bad: bad.map((v) => v.id),
        minor: res.violations.map((v) => `${v.id}:${v.impact}`),
      });
      expect(bad.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')) }))).toEqual(
        [],
      );
    });
  }
}

test('navigation: header menu, mobile menu, footer, home convert row, search find heic', async ({
  page,
}) => {
  const links = async (sel: string) =>
    page.locator(`${sel} a[href^="/heic-to-"]`).evaluateAll((a) =>
      a.map((x) => x.getAttribute('href')),
    );
  // Static HTML (server-rendered, so crawlers see it).
  const html = await (await page.request.get('/')).text();
  expect(html).toContain('href="/heic-to-jpg"');
  expect(html).toContain('href="/heic-to-png"');

  await page.goto('/');
  // Mobile menu.
  await page.locator('header details[data-menu="mobile"] summary').click();
  const mobile = await links('header details[data-menu="mobile"]');
  logMetric('heic-nav.ndjson', { where: 'mobile-menu', mobile });
  expect(mobile).toEqual(expect.arrayContaining(['/heic-to-jpg', '/heic-to-png']));
  await page.keyboard.press('Escape');

  // Footer.
  const footer = await links('footer');
  logMetric('heic-nav.ndjson', { where: 'footer', footer });
  // Home convert row (main).
  const home = await links('main');
  logMetric('heic-nav.ndjson', { where: 'home-main', home });
  expect(home).toEqual(expect.arrayContaining(['/heic-to-jpg', '/heic-to-png']));

  // Desktop header mega menu.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const desk = await links('header');
  logMetric('heic-nav.ndjson', { where: 'desktop-header', desk });
  expect(desk).toEqual(expect.arrayContaining(['/heic-to-jpg', '/heic-to-png']));

  // Search.
  await page.getByRole('link', { name: 'Search tools' }).first().click();
  const box = page.getByRole('combobox', { name: 'Search tools' });
  await box.fill('heic');
  const opts = await page.getByRole('option').allInnerTexts();
  logMetric('heic-nav.ndjson', { where: 'search', opts });
  expect(opts.join(' ')).toMatch(/HEIC to JPG/);
  expect(opts.join(' ')).toMatch(/HEIC to PNG/);
});
