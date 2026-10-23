// Shared assertions for favicon packages (used by several spec files).
import { expect, type Page } from '@playwright/test';
import { expectedZipNames, parseIco, pixelStats, pngHeader, utf8 } from './favicon';

export async function checkSvg(page: Page, svg: Buffer, expectText?: string) {
  const src = utf8(svg);
  const r = await page.evaluate(
    ({ src }) => {
      const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
      const err = doc.querySelector('parsererror');
      const attrs: string[] = [];
      doc.querySelectorAll('*').forEach((el) => {
        for (const a of Array.from(el.attributes)) {
          if (/^on/i.test(a.name) || /javascript:/i.test(a.value))
            attrs.push(`${el.tagName}@${a.name}`);
        }
      });
      return {
        parseError: err?.textContent ?? null,
        root: doc.documentElement.localName,
        scripts: doc.querySelectorAll('script, foreignObject, iframe, object, embed').length,
        badAttrs: attrs,
        textContent: doc.querySelector('text')?.textContent ?? null,
        ns: doc.documentElement.namespaceURI,
      };
    },
    { src },
  );
  expect(r.parseError, 'SVG well-formed').toBeNull();
  expect(r.root).toBe('svg');
  expect(r.ns).toBe('http://www.w3.org/2000/svg');
  expect(r.scripts, 'no script/foreignObject').toBe(0);
  expect(r.badAttrs).toEqual([]);
  if (expectText !== undefined) expect(r.textContent).toBe(expectText);
  return r;
}

/** Everything the ZIP promises (PRODUCT.md section 4.4), checked against bytes. */
export async function checkPackage(
  page: Page,
  files: Record<string, Buffer>,
  mode: 'image' | 'text' | 'emoji',
) {
  expect(Object.keys(files).sort(), 'ZIP file list').toEqual([...expectedZipNames(mode)].sort());

  const ico = parseIco(files['favicon.ico']);
  expect(ico.reserved).toBe(0);
  expect(ico.type).toBe(1);
  expect(ico.count).toBe(3);
  expect(ico.entries.map((e) => e.w)).toEqual([16, 32, 48]);
  expect(ico.entries.map((e) => e.h)).toEqual([16, 32, 48]);
  let expectOffset = 6 + 3 * 16;
  for (const e of ico.entries) {
    expect(e.planes, 'planes').toBe(1);
    expect(e.bpp, 'bpp').toBe(32);
    expect(e.offset, 'offset follows previous image').toBe(expectOffset);
    expect(e.pngSig, `embedded ${e.w}px is a PNG`).toBe(true);
    expect([e.pngW, e.pngH]).toEqual([e.w, e.h]);
    expectOffset += e.size;
  }
  expect(expectOffset, 'no trailing bytes').toBe(files['favicon.ico'].length);

  const want: Record<string, number> = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512,
  };
  for (const [name, px] of Object.entries(want)) {
    const h = pngHeader(files[name]);
    expect(h.sig, `${name} signature`).toBe(true);
    expect(h.ihdr).toBe('IHDR');
    expect([h.width, h.height], name).toEqual([px, px]);
    const st = await pixelStats(page, files[name]);
    expect([st.width, st.height]).toEqual([px, px]);
  }

  const manifest = JSON.parse(utf8(files['site.webmanifest'])) as {
    name: string;
    icons: { src: string; sizes: string; type: string }[];
  };
  expect(manifest.icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512']);
  for (const i of manifest.icons) {
    expect(i.type).toBe('image/png');
    expect(files[i.src.replace(/^\//, '')], `manifest src ${i.src} exists in ZIP`).toBeTruthy();
  }

  const shown = (await page.getByTestId('snippet').innerText()).trim();
  const readme = utf8(files['README.txt']);
  for (const line of shown.split('\n')) expect(readme).toContain(line.trim());
  expect(shown).toContain('rel="manifest"');
  expect(shown.includes('favicon.svg'), 'snippet mentions svg only for text/emoji').toBe(
    mode !== 'image',
  );
  for (const m of shown.matchAll(/href="\/([^"]+)"/g))
    expect(files[m[1]], `snippet href ${m[1]} in ZIP`).toBeTruthy();

  if (mode !== 'image') await checkSvg(page, files['favicon.svg']);
}
