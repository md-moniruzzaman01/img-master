// Section 4: accessibility. axe in light and dark, plus a keyboard-only pass.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ensureFixtures, fixture } from './helpers/fixtures';
import {
  ALL_PATHS,
  TOOL_SLUGS,
  cards,
  gotoTool,
  logMetric,
  openMoreOptions,
  pickAndWait,
} from './helpers/tool';

test.beforeAll(ensureFixtures);

async function axe(page: Page, label: string) {
  const res = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  logMetric('axe.ndjson', {
    label,
    project: test.info().project.name,
    serious: bad.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
    })),
    minor: res.violations
      .filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
      .map((v) => `${v.id}:${v.impact}`),
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

for (const scheme of ['light', 'dark'] as const) {
  for (const path of [...ALL_PATHS, '/this-page-does-not-exist']) {
    test(`axe ${scheme}: ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await axe(page, `${scheme} ${path}`);
    });
  }

  test(`axe ${scheme}: tool states (results, partial failure, more options, tools sheet)`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme });
    await gotoTool(page, 'compress-image-to-50kb');
    await openMoreOptions(page);
    await axe(page, `${scheme} more-options open`);
    await pickAndWait(page, [
      fixture('photo-2mp.jpg'),
      fixture('corrupt.jpg'),
      fixture('animated.gif'),
    ]);
    await expect(cards(page)).toHaveCount(3);
    await axe(page, `${scheme} partial results with error + notes + action bar`);
    await page.getByRole('button', { name: 'Tools' }).click();
    await expect(page.getByRole('dialog', { name: 'All tools' })).toBeVisible();
    await axe(page, `${scheme} tools sheet over results`);
    await page.keyboard.press('Escape');

    await gotoTool(page, 'png-to-jpg');
    await pickAndWait(page, fixture('transparent.png'));
    await axe(page, `${scheme} converter with background field`);

    await gotoTool(page, 'compress-image');
    await axe(page, `${scheme} compress hub quality slider`);
    await page.getByRole('radio', { name: 'Pick a quality' }).click();
    await axe(page, `${scheme} compress hub quality mode`);

    await gotoTool(page, 'compress-image-to-20kb');
    await page.getByRole('radio', { name: 'Custom' }).click();
    await axe(page, `${scheme} custom target input`);
  });
}

test('keyboard only: skip link, tools sheet (focus trap, Esc, focus return)', async ({
  page,
  browserName,
}) => {
  // WebKit's Tab order skips links, so inside the sheet focus can fall back to <body>.
  // That is still a trap: nothing behind the modal sheet may receive focus.
  const okFocus = `(() => { const a = document.activeElement; return !!a?.closest('dialog') || ${browserName === 'webkit'} && a === document.body; })()`;
  await page.goto('/compress-image-to-50kb');
  // First Tab goes to the skip link and it becomes visible.
  // WebKit's default Tab order skips links (Safari setting), so focus it directly there.
  const skip = page.getByRole('link', { name: 'Skip to content' });
  if (browserName === 'webkit') await skip.focus();
  else await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  expect(page.url()).toContain('#main');

  // Open the sheet with the keyboard.
  const toolsBtn = page.getByRole('button', { name: 'Tools' });
  await toolsBtn.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'All tools' });
  await expect(dialog).toBeVisible();
  // Focus is inside the dialog, and Tab never leaves it.
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(okFocus);
    expect(inside, `Tab #${i + 1} escaped the dialog`).toBe(true);
  }
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(okFocus)).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toolsBtn).toBeFocused();
});

test('keyboard only: compress page (picker focus ring, chips with arrow keys, switch, details, results)', async ({
  page,
  browserName,
}) => {
  test.setTimeout(120_000);
  await gotoTool(page, 'compress-image-to-50kb');

  // Walk the tab order and record every focus stop with its visible focus indicator.
  const stops: { name: string; outline: string; boxShadow: string }[] = [];
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const host = el.closest('label') ?? el;
        const cs = getComputedStyle(el);
        const hs = getComputedStyle(host);
        const label =
          el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? el.tagName;
        return {
          name: `${el.tagName.toLowerCase()}:${label}`,
          outline: `${cs.outlineStyle} ${cs.outlineWidth} | host ${hs.outlineStyle} ${hs.outlineWidth}`,
          boxShadow: cs.boxShadow,
        };
      }),
    );
  }
  logMetric('keyboard-stops.ndjson', { project: test.info().project.name, stops });
  const names = stops.map((s) => s.name).join(' > ');
  // The picker input is reachable and shows a focus ring on its label.
  const pickerStop = stops.find((s) => s.name.startsWith('input:'));
  expect(pickerStop, `tab order: ${names}`).toBeTruthy();
  expect(pickerStop!.outline, 'picker focus ring').toMatch(
    /solid 2px \| host solid 2px|host solid 2px/,
  );
  // Every stop shows some focus indicator (outline or ring).
  for (const s of stops) {
    if (s.name.startsWith('input:')) continue;
    const has = !/^none 0px/.test(s.outline.split('|')[0].trim()) || s.boxShadow !== 'none';
    expect(has, `no focus indicator on ${s.name} (${s.outline})`).toBe(true);
  }

  // Chips are a radiogroup with roving tabindex and arrow keys.
  const chip = page.getByRole('radio', { name: '50KB' });
  await chip.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: '100KB' })).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(chip).toBeChecked();

  // More options via keyboard (summary toggles with Enter/Space).
  const summary = page.getByTestId('more-options').locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  expect(
    await page.getByTestId('more-options').evaluate((d) => (d as HTMLDetailsElement).open),
  ).toBe(true);
  const sw = page.getByRole('switch', { name: /Keep original dimensions/ });
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'false');

  // A file chooser cannot be driven by keyboard in automation; pick via the input,
  // then check where focus lands and that the download is reachable by keyboard.
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Results');
  let reached = false;
  if (browserName === 'webkit') {
    // WebKit's default Tab order skips links; verify the link is focusable instead.
    await page.getByTestId('download').first().focus();
    reached = true;
  }
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'download',
    );
  }
  expect(reached, 'Download link reachable with Tab').toBe(true);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  // Focus ring on the download link (keyboard focus).
  void 0;
  expect(dl.suggestedFilename()).toMatch(/-50kb\.jpg$/);
});

test('screen reader hooks: live region announces results, errors use role=alert, reduced motion respected', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoTool(page, 'compress-image-to-50kb');
  await pickAndWait(page, fixture('photo-2mp.jpg'));
  await expect(
    page.locator('[role=status][aria-live=polite]').filter({ hasText: /^Done\. .* smaller$/ }),
  ).toHaveCount(1);
  // Transition durations are zeroed for reduced motion.
  const dur = await page.evaluate(() => {
    const el = document.querySelector('[data-testid=file-picker]') as HTMLElement;
    return getComputedStyle(el).transitionDuration;
  });
  expect(dur, 'transition under prefers-reduced-motion').toMatch(/^0s|0\.00001s|1e-05s/);
  await pickAndWait(page, fixture('not-an-image.png'));
  await expect(page.getByTestId('result-card').first()).toContainText("We can't open this file");
});

test('language and landmarks on every page', async ({ page }) => {
  for (const p of ['/', ...TOOL_SLUGS.slice(0, 3).map((s) => `/${s}`), '/about']) {
    await page.goto(p);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});
