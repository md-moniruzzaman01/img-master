// Section 5 (part): first-load JavaScript per page, gzipped, split into framework vs ours.
// Budget (CLAUDE.md rule 6): OUR first-load JS on a tool page <= 30 KB gzipped.
// "Ours" = every script except the Next.js/React framework chunks and the noModule polyfill.
import { expect, test } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { logMetric, ALL_PATHS, TOOL_SLUGS } from './helpers/tool';

test.skip(({ browserName }) => browserName !== 'chromium', 'one measurement is enough');

const BUDGET_BYTES = 30 * 1024;

// A chunk is "ours" when it contains one of our own UI strings; anything else
// (react-dom, Next router/runtime, turbopack runtime, polyfills) is framework.
const OURS = [
  /Choose images/,
  /aria-haspopup/,
  /All tools/,
  /Nothing is uploaded/,
  /compressToSize/,
  /transparency-flattened|Transparent areas/,
];

for (const path of ['/', ...TOOL_SLUGS.map((s) => `/${s}`)]) {
  test(`first-load JS: ${path}`, async ({ page }) => {
    const scripts: {
      url: string;
      raw: number;
      gz: number;
      gz9: number;
      ours: boolean;
      polyfill: boolean;
    }[] = [];
    page.on('response', async (res) => {
      const url = res.url();
      if (!/\.js(\?|$)/.test(url)) return;
      try {
        const body = await res.body();
        const text = body.toString('utf8');
        scripts.push({
          url: new URL(url).pathname.replace('/_next/static/chunks/', ''),
          raw: body.length,
          gz: gzipSync(body).length,
          gz9: gzipSync(body, { level: 9 }).length,
          ours: OURS.some((r) => r.test(text)),
          polyfill: false,
        });
      } catch {
        /* response disposed during navigation */
      }
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // The noModule polyfill is only fetched by legacy browsers; Chromium skips it, so add it from disk.
    const sum = (k: 'raw' | 'gz' | 'gz9', f: (s: (typeof scripts)[number]) => boolean) =>
      scripts.filter(f).reduce((a, s) => a + s[k], 0);
    const ours = sum('gz', (s) => s.ours);
    const total = sum('gz', () => true);
    logMetric('js-budget.ndjson', {
      path,
      totalGz: total,
      oursGz: ours,
      oursGz9: sum('gz9', (s) => s.ours),
      frameworkGz: total - ours,
      files: scripts.map((s) => `${s.url} ${s.gz}${s.ours ? ' OURS' : ''}`),
    });
    if (path !== '/')
      expect(ours, `our first-load JS ${ours} B gz vs budget ${BUDGET_BYTES}`).toBeLessThanOrEqual(
        BUDGET_BYTES,
      );
    void ALL_PATHS;
  });
}
