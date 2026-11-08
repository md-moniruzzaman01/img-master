# Img Master: Figma "Ink Samurai v2" redesign (build spec)

Date: 2026-10-25 · Status: approved by owner ("go", 2026-10-25) · Lead: main session

This spec turns the owner's Figma file into code. Where it disagrees with `docs/DESIGN.md`, **this spec wins** (DESIGN.md is updated after integration). Project rules in `CLAUDE.md` still win over both.

## 1. Sources

| What | Where |
|---|---|
| Screens (PNG, 1x, sliced top to bottom) | `docs/figma-export/` (git-ignored; open with the Read tool) |
| Desktop 1280 | `desktop-home-*`, `desktop-nav-menu-*`, `desktop-search-*`, `desktop-all-tools-*`, `desktop-compress-50kb-{ready,cutting,result,error}-*`, `desktop-image-compressor-*`, `desktop-webp-to-jpg-*` (convert with options), `desktop-webp-to-png-*` (convert without options), `desktop-image-converter-*`, `desktop-favicon-generator-*`, `desktop-about-*`, `desktop-404-*` |
| Mobile 360 (2x pixels, 720 wide) | `mobile-home-*`, `mobile-compress-50kb-ready-*`, `mobile-compress-50kb-result-*`, `mobile-menu-*` |
| Vector art from Figma ("Copy as SVG") | `docs/figma-export/svg/`: `hero-scene.svg` (sun, ring, cherry branch, pagoda, hills, samurai; 56 KB raw), `kamae.svg` (samurai alone, 3 KB), `sensei.svg` (the 5 status cards), `footer.svg` (mountain edge = its first two `<path>`s) |

There are no resize, png-to-ico, how-it-works, privacy/terms/contact, or text/emoji favicon frames. Build those from the shared patterns below.

## 2. What changes, in one paragraph

New tokens and fonts from the Figma variables; a new header (desktop nav with mega menus, search, sound, theme, CTA; mobile logo + search + full-screen menu); a dark footer with an ink mountain edge; a home page whose hero **contains the 50 KB tool**; tool pages with a samurai status panel; new result rows with a Compare slider; a Ctrl+K search palette; a dark theme; an "Every tool" page (`/tools`); a "How it works" page; Resize goes live. The traced sprite samurai is replaced by the Figma vector samurai.

## 3. Tokens (Figma variables, collection "Ink Samurai")

Light = Figma mode "Washi". Dark = "Sumi", designed by the lead (Figma has no dark mode). ui-builder must check every text/background pair for WCAG AA in both themes (script or test) and may adjust the **dark** values to pass; light values are fixed unless a pair fails AA.

| Figma name | Light | Dark (proposal) | Use |
|---|---|---|---|
| paper | `#F2ECE1` | `#15110E` | Page background |
| paper-2 | `#E8E0D0` | `#1E1814` | Alternate section band ("Convert" band, use-case band), segmented track |
| card | `#FBF8F2` | `#211B17` | Cards, tool card, inputs, header |
| ink | `#17120F` | `#F2ECE1` | Main text; desktop drop zone fill; dark bands; footer |
| ink-2 | `#4A4038` | `#CFC5B6` | Secondary text, icons |
| muted | `#6E6357` | `#A89C8C` | Captions, subtitles |
| line | `#D9CFBE` | `#3A312A` | Borders, dividers |
| shu | `#C3301C` | `#C3301C` | Crimson fills: primary buttons, sun, seal, focus ring |
| shu-deep | `#9E2512` | `#E0533C` | Hover/pressed; crimson **text** in dark mode |
| shu-soft | `#F7E0D8` | `#3A1D16` | Mobile drop zone fill, error banner |
| kin | `#9C7A35` | `#C9A24E` | Gold: footer column labels, tip label. Check AA before using as small text |
| matcha | `#4D6A35` | `#9CBF7E` | Success text, privacy line, "Under 50 KB" badge text |
| matcha-soft | `#E3EAD6` | `#1F2A18` | Success banner, badge fill |
| sakura | `#E7A3A0` | `#E7A3A0` | Petals in the hero art only |
| steel | `#E9E5DD` | `#2A231E` | Hills/pagoda wash in the hero art |
| white | `#FFFFFF` | `#FFFFFF` | Text on crimson |

Dark bands (values band, footer) stay ink-dark in **both** themes: use fixed `--band` (`#17120F` light / `#0E0B09` dark) and `--on-band` (`#F2ECE1`).

Crimson text (H1 accent, links like "Try a sample →") uses `shu` in light and `shu-deep` in dark through one semantic token (for example `--accent-text`). Buttons stay `shu` with white text in both.

Theme switching: `<html data-theme="light|dark">`. The lead adds a tiny inline script in `app/layout.tsx` `<head>` that sets it before paint from `localStorage[siteConfig.theme.storageKey]` (try/catch), else from `prefers-color-scheme`. `color-scheme` follows the theme. With JavaScript off, CSS falls back to `prefers-color-scheme`. `themeColor` metadata gets a light and a dark value.

## 4. Typography

From the Figma text layers:

- **Headings, logo, numbers in result rows:** Shippori Mincho B1, ExtraBold (800). Also 500/700 if a frame needs them.
- **Body, buttons, labels, inputs:** Zen Kaku Gothic New 400/500/700 (button labels are Bold 15).
- Both via `next/font/google`, `subsets: ['latin']`, `display: 'swap'`, self-hosted at build (no runtime request to Google). The lead wires them in `app/layout.tsx` as CSS variables `--font-mincho` and `--font-gothic`; ui-builder maps them in `globals.css`. Noto Serif is removed.
- **Kanji glyphs** (圧縮, 五十, 問 …, all from `lib/tools/glyphs.ts`): they need Japanese glyphs. ui-builder measures two options and picks the lighter one that still looks like the design, and reports the bytes per page: (a) a second `next/font` instance of Shippori Mincho B1 800 with `preload: false` and no `subsets` limit, so the browser fetches only the `unicode-range` slices it needs (only on elements with the `.kanji` class); (b) the system stack `"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif CJK JP", "Noto Serif JP", serif`. Glyphs are always `aria-hidden`.
- **Favicon "Brush" typeface:** a third `next/font` instance (Yuji Syuku, 400, `preload: false`), used only by the favicon Letters tab. Mincho and Gothic reuse the two site fonts. The UI calls `document.fonts.load()` before asking the engine to draw, and passes the family string in `FaviconSource.fontFamily`.
- Scale: measure from the PNGs (desktop files are 1:1 with the 1280 frame; mobile files are 2x). Approximate: home H1 72/76 desktop, 40/44 at 360; tool H1 56 desktop, 36 at 360; section H2 36 desktop, 22 at 360; body 15–17; captions 12–13. Inputs never below 16px.

## 5. Pages

### 5.1 Home (`app/page.tsx`, content `content/home.ts`)

Desktop (`desktop-home-*`), top to bottom:

1. **Hero**, two columns ≥ lg. Left: eyebrow ("■ FREE IMAGE TOOLS · 無料", crimson, tracked caps), H1 with crimson accent, subtitle, then the **hero tool card**: the real 50 KB compressor (`ToolShell` with `variant="hero"`): step label "1 Target size", size chips 20 KB…1 MB (switch target in place), the dark drop zone with crimson upload disc, "2 Drop images here", hint, "Choose images" button, privacy line (matcha) and "No image? Try a sample →". Under the card, a row of 3 trust items with small icons. Right: the **hero scene** (Figma vector) with the vertical motto 一刀両断 and a 侍 seal.
2. **Compress to an exact size** (圧縮): 6 size tiles (glyph numeral, size, one line, arrow), 3 columns.
3. **Convert between formats** (変換) on a `paper-2` band: 6 pair tiles ("WEBP → JPG" in Mincho caps, crimson target, one line), then "Any format to JPG, PNG or WebP →".
4. **See the cut before you trust it** (見): a working compare slider on an example illustration (bundled SVG/inline art, not a photo). Labels from content (`originalLabel`, `resultLabel`). **No invented numbers**: the Figma "2.4 MB / 48.6 KB / 98% lighter" chips are replaced by the content labels.
5. **Values band** (dark band): 3 items (無 精 速) from `homeContent.values`.
6. **Your site's family crest** (紋): Favicon generator, Resize image, PNG to ICO tiles.
7. **Questions people ask first** (問): FAQ accordion, first item open.
8. **CTA band** (crimson, faint 一刀 watermark in a darker circle): heading, text, white "Choose an image" button that opens the hero tool's picker and scrolls the hero tool into view. Dropping a file **anywhere on the home page** feeds the hero tool (page-wide drop target with a visible drop overlay).
9. Footer.

Mobile (`mobile-home-*`), with one **required deviation**: the Figma mobile home puts the hero art above the tool, which pushes the picker below 640px. Order at < lg is: eyebrow, H1, subtitle, **hero tool card** (chips + dashed `shu-soft` drop zone "Tap to choose photos" + privacy line), then a shorter hero scene, then the sections. At 360×640 the "Choose images"/tap target and privacy line must be fully visible. Mobile sections: Compress tiles 2 columns (glyph + size only); Convert as 3 rows + "All 7 converters →"; values band as a list; footer simplified (`mobile-home-04`).

### 5.2 Tool pages (`app/[slug]/page.tsx`)

Desktop (`desktop-compress-50kb-ready-*`):

- Breadcrumbs first (Home / Compress / 50 KB).
- Title row: large vertical page glyph (五十) left of the H1 (stacked kanji, crimson), H1 with crimson accent (`content.h1Accent`), subtitle.
- Two columns ≥ lg: **tool card** (left, about 2/3) and **samurai panel** (right: the Sensei card, plus a Tip card from `content.sideTip`).
- Tool card for compress-to-size: chips 20 KB…1 MB + Custom, "Output JPG ▾" on the right, the dark drop zone, then an options row: "Max width: Keep original ▾", "Pixel size: Keep exact ▾" (= `keepDimensions`), and a **static** line "Location data: removed" (canvas re-encoding always strips EXIF; the Figma "Strip location data: On ▾" dropdown would imply it can be turned off, which is not true). Privacy line at the bottom.
- Convert tool card (`desktop-webp-to-jpg-*`): format pair (FROM → TO, Mincho caps), "⇄ Swap to JPG → WebP" link (goes to the reverse page), quality slider (lossy targets only), "Fill transparent areas with" swatches (JPG target only), drop zone, privacy line. `desktop-webp-to-png-*` shows the no-options variant. `desktop-image-converter-*`: "ANY → JPG ▾" with output picker.
- Image compressor (`desktop-image-compressor-*`): segmented "Target size | Quality", then a KB/MB number input or a quality slider.
- Below the tool: use-case cards on a `paper-2` band (`content.useCases`, icon + title + line), "How we land under 50 KB" 3 numbered steps (技, `content.howTo` + `howToHeading`), `content.sections` (RichText), FAQ (問), "Other sizes" chips (compress pages) or related tools, footer.

Mobile (`mobile-compress-50kb-ready-*`): breadcrumbs, H1 (no big glyph), one-line subtitle, a **compact samurai status row** (round crop of the samurai on the red sun + state label + one line), chips (horizontal scroll), dashed `shu-soft` drop zone "Tap to choose photos" with "JPG, PNG, WebP · up to {maxFiles} photos", a "More options · JPG · keep pixel size ⌄" disclosure, privacy line, "No photo handy? Try a sample →", then the FAQ and content.

### 5.3 Tool states

| ToolShell state | Samurai panel | Tool card |
|---|---|---|
| idle | IDLE · "Ready when you are" · "Choose a size, then drop your image." (convert pages: READY · "Blade drawn" · "Release to start the cut.") | drop zone |
| drag-over | READY · "Blade drawn" · "Release to start the cut." (dotted ring around the sun) | drop zone highlighted |
| processing | CUTTING · "Measuring the cut…" · "Trying quality levels to land under 50 KB." (two crimson slash lines sweep) | `desktop-compress-50kb-cutting`: banner "Cutting 3 images…" with the 刃 seal and "1 of 3 done", a red diagonal slash across the card, rows with per-file progress and disabled buttons |
| done | DONE · "Clean cut" · "{n} images · {before} → {after}" (済 seal stamps on) | `desktop-compress-50kb-result`: matcha banner "Clean cut. 3 images ready." + totals + "Download all (ZIP)" (crimson); rows: thumbnail, name, ~~before~~ → **after** (Mincho), "✓ Under 50 KB" badge, "98% smaller · Quality 82% · 1200 × 1500" (real numbers from EngineResult), Compare + Download; footer: "Compress more images" (outline), "Need it even smaller? Try 20 KB →", privacy line |
| partial / error | ERROR · "That one resisted" · plain reason (sun turns ink-2 grey, red X) | `desktop-compress-50kb-error`: `shu-soft` banner "One file couldn't be cut." + reason + "Download 2 images (ZIP)"; the failed row shows a "Not an image" badge and "Remove" |

Mobile results (`mobile-compress-50kb-result-*`): banner, one card per file (thumb, name, before → after, quality line, Compare + Save buttons side by side), "Need it smaller? Try 20 KB →", then a full-width crimson "Download all (ZIP) · 143 KB" and "Compress more photos" link. After processing, scroll the banner into view (no sticky bar).

All copy keeps `siteConfig.maxFiles` (20).

### 5.4 Favicon generator (`desktop-favicon-generator-*`)

Two cards: controls (segmented Image | Letters | Emoji; Letters input with "2 / 3" counter; Typeface Brush/Mincho/Gothic; Colours: background swatches + letter swatches; Shape Square/Rounded/Circle tiles; Padding slider) and **Live preview** ("Updates as you type"; light and dark browser-tab strips; a home-screen tile; "Every size in the package" 16/32/48/180/192/512; "Download favicon package" + "Copy HTML"; the snippet block; the privacy line "Includes favicon.ico, PNGs at 6 sizes, site.webmanifest. Made on this device." — only if that matches what the engine really produces; otherwise state what it does produce). The favicon-from-text and favicon-from-emoji pages open the same layout on their tab. PNG to ICO uses the tool-page layout (5.2) with the ICO output.

### 5.5 Every tool (`/tools`, `desktop-all-tools-*`)

H1 "Every tool", subtitle with the real count (`getLiveToolCount()`), a filter input (client island; filters the cards in place; the full list is in the static HTML), then one section per category with glyph + count superscript and 4-column tool tiles.

### 5.6 How it works (`/how-it-works`)

No Figma frame. Info-page layout: H1, subtitle, the three steps (Read, Search, Shrink only if needed), `sections`, FAQ. Same styling as tool-page content sections.

### 5.7 About (`desktop-about-*`), 404 (`desktop-404-*`), legal

- About: hero (eyebrow ABOUT, H1 "One clean cut.", intro paragraphs, hero scene on the right), values band (義 誠 勇), a card "侍 Built by Softwara in Dhaka" with contact line, footer.
- 404: Sensei error card ("That one resisted", grey sun, X) left; "404 · 道なし", H1 "This path leads nowhere.", text, "Go to the home page" (crimson) + "See all tools" (outline), "Popular:" chips (50 KB, 100 KB, WebP to JPG, Favicon).
- Privacy, Terms, Contact: reading-width text pages with the new type and footer.

## 6. Global components

- **Header, desktop** (`desktop-home-01`): 刃 seal + "Img Master" (Mincho); nav: Compress ▾, Convert ▾, Resize, Favicon ▾, How it works; search button styled as a field "Search tools ⌘K" (shows "Ctrl K" on non-Mac); sound toggle; theme toggle; crimson "Compress an image" → `/compress-image-to-50kb`. Not sticky.
- **Mega menu** (`desktop-nav-menu-01`): "COMPRESS TO A SIZE" two columns of glyph rows (name + one line, "MOST USED" badge on 50 KB), "OTHER WAYS" column (Image compressor, Resize image, Batch tips → `/how-it-works`), and a dark promo card ("五十 Need 50 KB for a form?" → 50 KB page). Convert and Favicon menus follow the same pattern with their tools. Opens on click and keyboard (Enter/Space/ArrowDown), closes on Esc and outside click, links exist in static HTML.
- **Header, mobile** (`mobile-menu-*`): seal + name, search icon, menu icon. Menu = full-screen sheet: search input "Search {n} tools", chip groups (圧縮 COMPRESS: To 20 KB…To 1 MB; 変換 CONVERT: 3 pairs + More…; 紋 ICONS & SIZE: Favicon generator, PNG to ICO, Resize image), "Sound on" and "Dark mode" toggles, then How it works / About / Privacy. Must work without JS (links in HTML).
- **Search palette** (`desktop-search-01`): Ctrl/⌘+K or the header search opens a centred dialog: input, "TOOLS" results with glyph + name + line, ↑↓ to move, ↵ to open, Esc to close, footer hints. Index from `getSearchIndex()` passed as a prop. Load the palette code **only when opened** (dynamic import) so it does not count toward first-load JS. Focus trap, `role="dialog"`, results as a listbox with `aria-activedescendant`.
- **Compare** (result rows, "Compare" button): a dialog/sheet with a before/after slider (drag the handle, arrow keys move it, `role="slider"` with value text) showing the original file and the result (object URLs; revoke on close).
- **Footer** (`desktop-home-05`): ink mountain edge (paths from `footer.svg`), seal + name, one-line blurb, 4 columns (COMPRESS / CONVERT / MORE TOOLS / IMG MASTER, gold labels) from `getNavGroups()` plus How it works / About / Privacy, rule, "© {year} Img Master · Built by Softwara in Dhaka" and "一 刀 両 断". Mobile: name + 3 links (`mobile-home-04`).
- **Section heading**: crimson glyph + Mincho H2 + optional intro, as on every Figma page.
- **Samurai**: one inline SVG built from `kamae.svg` with colours mapped to tokens (no raw hex in components: use `currentColor`/CSS variables), drawn over the red sun. States are overlays (dotted ring, two slash lines, 済 seal, grey sun + X) with short CSS animations (breathing idle, slash sweep while cutting, seal stamp on done). Under `prefers-reduced-motion` show the still state. The hero scene is a separate component from `hero-scene.svg` (optimise: drop clip paths that do nothing, round coordinates, keep it ≤ 20 KB, inline or as a static file with fixed width/height so it never shifts layout). The old sprite samurai (`components/samurai/*` timeline, `public/samurai/*.svg`) is removed once nothing uses it.
- **Sound**: keep the existing optional sounds and toggle; restyle only.

## 7. Engine changes (image-engine)

1. `resize(file, ResizeOptions)` real implementation (worker + main-thread fallback), with tests. Resize goes live.
2. `CompressToSizeOptions.maxWidth`: scale down before the search.
3. Favicon text: draw with `fontFamily` when given (main-thread canvas when the worker can't see the font; the engine decides and documents it).
4. `lib/image-engine/sample.ts`: `makeSampleImage(): Promise<File>` draws a sample photo-like image on a canvas on the device (a landscape: sky gradient, sun, hills; about 1600×1067, JPG around 300–600 KB) so "Try a sample" works with no network request.
5. Mock engine (`mock.ts`) gains `resize`.

## 8. Content changes (seo-content)

- `content/home.ts` to the new `HomeContent` shape. Hero copy from Figma, with these honesty fixes: no "Most forms ask for 50 KB" (unverified); no "Results in about a second" unless `reports/data/compress-matrix.ndjson` shows it for typical phone photos (otherwise use a true line such as "Works in your browser"); no "98% lighter" style numbers that aren't measured.
- Every tool page: add `h1Accent`, `sideTip`, `useCases` (2–4, generic and true: "Job applications", "Exam & admission forms", "Government portals", "Email & chat" — no invented official limits), and shorter FAQs in the Figma voice. **Keep the SEO structure** from `docs/SEO.md`: primary keyword in title/H1/first paragraph, unique sections, 4–6 FAQs, related links. H1 can change case ("Compress image to 50 KB") if the primary keyword still matches.
- New: `content/pages/resize-image.ts`, `content/pages/how-it-works.ts` and `content/pages/tools-index.ts` (`InfoPageContent`), About to the extended `LegalContent` (eyebrow, intro, values).
- Sitemap and metadata builders: add `/tools` and `/how-it-works`, and resize once live.
- All counts come from code (`getLiveToolCount()`), never typed into copy.

## 9. Acceptance (whole redesign)

- At 360×640, on every tool page and on home: H1, the picker button / tap target and the privacy line are visible without scrolling.
- Both themes pass AA for every text pair; axe: zero serious/critical issues on home, a tool page, /tools and the open menu/search/compare dialogs.
- Lighthouse mobile ≥ 95 in every category on home and `/compress-image-to-50kb`; our first-load JS ≤ 30 KB gzipped on tool pages (search palette and compare loaded on demand).
- No network request carries image data; no runtime request to a third-party host (fonts included).
- All text in static HTML; menus work without JS.
- `lint`, `typecheck`, `test`, `build` pass; e2e suite updated and green on mobile Chromium + WebKit.
