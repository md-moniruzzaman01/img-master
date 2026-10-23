// CLS split into (a) the insertion shift right after the file-input change and (b) anything later.
// Chromium only. Reports numbers; (b) must stay under 0.01, (a) is reported (see mobile-ux.spec.ts for the strict total).
import { expect, test } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import { gotoTool, logMetric, pickAndWait } from './helpers/tool';

test.use({ viewport: { width: 360, height: 640 } });
test.beforeAll(ensureFixtures);

for (const slug of ['compress-image-to-50kb', 'compress-image', 'webp-to-jpg', 'image-converter']) {
  test(`CLS split (a) insertion vs (b) later (Chromium): /${slug}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift entries are Chromium-only');
    await page.addInitScript(() => {
      const w = window as unknown as { __t0: number; __shifts: { t: number; v: number }[] };
      w.__t0 = -1;
      w.__shifts = [];
      document.addEventListener('change', () => { if (w.__t0 < 0) w.__t0 = performance.now(); }, true);
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.__shifts.push({ t: e.startTime, v: (e as unknown as { value: number }).value });
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await gotoTool(page, slug);
    await page.waitForTimeout(800);
    await pickAndWait(page, [fixture('photo-2mp.jpg')]);
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const w = window as unknown as { __t0: number; __shifts: { t: number; v: number }[] };
      let pre = 0, a = 0, b = 0;
      for (const s of w.__shifts) {
        if (s.t < w.__t0) pre += s.v;
        else if (s.t < w.__t0 + 300) a += s.v;
        else b += s.v;
      }
      return { pre, a, b, t0: w.__t0, shifts: w.__shifts.map((s) => ({ dt: Math.round(s.t - w.__t0), v: +s.v.toFixed(4) })) };
    });
    logMetric('cls.ndjson', { slug, phase: 'split', ...r });
    console.log(`CLS /${slug}: load=${r.pre.toFixed(4)} (a)=${r.a.toFixed(4)} (b)=${r.b.toFixed(4)} ${JSON.stringify(r.shifts)}`);
    expect(r.pre).toBeLessThan(0.01);
    expect(r.b, '(b) shifts after the insertion').toBeLessThan(0.01);
  });
}
