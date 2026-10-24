# Img Master — design system and components

Brand: **"Ink Samurai"** (owner redesign, 2026-10-24; spec `docs/superpowers/specs/2026-10-24-samurai-ink-redesign-design.md`). Ancient Japan meets modern utility: warm paper, ink black, one crimson, a touch of gold, and one character, a sumi-e ink samurai who cuts your image down to size.

## 1. Design principles

1. **Tool first.** The visitor came to do one job. The picker is the first thing they can use, and at 360×640 the H1, samurai, "Choose images" button and privacy line are all on the first screen.
2. **One thumb.** Every main action is reachable with one thumb on a 360px phone. After processing, the result card (with its Download button) is scrolled into view; there is no sticky bar.
3. **Honest numbers.** Always show real before/after sizes and dimensions. No fake progress, no fake counters.
4. **Calm craft, a little delight.** Paper, ink, one crimson, borders instead of shadows, no gradients, no stock photos, no popups, no countdowns. Decoration is allowed only where it carries meaning: the samurai (shows what the tool is doing), the red slash (shows work is happening), small ink brush marks (ground stroke, active nav underline) and the red sun.
5. **Fast feels good.** Instant feedback within 100 ms of any tap. The sword slash replaces spinners. Animation never delays a result or a download.

## 2. Tokens

CSS variables in `app/globals.css`, mapped into Tailwind's theme. Components use the Tailwind names (`bg-card`, `text-muted`), never raw hex.

### Color (light only)

| Token (Tailwind) | Value | Use |
|---|---|---|
| `bg` | `#faf8f4` | Paper: page background, footer |
| `card` | `#ffffff` | Header, tool card, result cards, tool cards, inputs |
| `surface` | `#f0ece4` | Section backgrounds, segmented-control track, progress track |
| `border` | `#e2ddd6` | Card, header and section borders |
| `border-strong` | `#8a8177` (3.6:1 on paper) | Input, chip, switch outlines; desktop drop zone |
| `text` / `ink` | `#1a1212` | Main text, samurai silhouettes, progress fill |
| `steel` | `#2d3748` | Headings, logo |
| `muted` | `#6b6560` (5.4:1 on paper) | Subtitles, captions, privacy line |
| `primary` | `#c0392b` | Crimson: primary buttons, links, red sun, slash, focus ring |
| `primary-hover` | `#a93226` | Hover/pressed |
| `on-primary` | `#ffffff` | Text on crimson |
| `gold` | `#c9a84c` | Selected chip border and small accents. **Never text** (≈2:1 on paper) |
| `gold-tint` | `#fbf4e2` | Selected chip / drag-over fill |
| `danger` | `#b42318` | Error text and borders only |

The favicon preview's mock browser tabs (`.pin-light`, `.pin-dark`) keep their own neutral colours. No dark mode (`color-scheme: light`). Every text/background pair meets WCAG AA.

### Typography

- Headings and logo: **Noto Serif** 400/700 via `next/font/google` (self-hosted at build, no runtime request to Google), utility `font-display`. `.type-h1/h2/h3` use it in `steel`.
- Body: system stack `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Bengali", Arial, sans-serif`.
- Scale (mobile → desktop ≥ 1024px): H1 24/30 → 28/36 bold; H2 20/28; H3 17/24; subtitle 15–16/24 muted; body 15/24; small 14/20; caption 12/16.
- Inputs never smaller than 16px. Result numbers use `tabular-nums`.

### Spacing, radius, elevation, motion

- 4px grid. Page gutter 16px (mobile), 24px (≥ 640px).
- Radius: cards 10px, buttons 6px, chips fully round.
- Elevation: none. No shadows, no CSS gradients. The hero's ink-wash hills are flat ink shapes with an SVG blur.
- Motion keyframes in `globals.css`: `im-slash` (220 ms), `im-pop` (300 ms, scale .5→1), `im-fade-in` (150 ms), `im-slide-down` (menu). Every animated element also carries `.im-anim`; under `prefers-reduced-motion: reduce` it gets `animation: none; transition: none`, the samurai shows one still pose per state, and the slash and favicon shards don't play.
- **Tailwind gotcha:** build class strings from complete literals (`cx()` in `components/ui/cx.ts`). A class token glued to a template expression (for example `opacity-0` immediately followed by `${…}`) is not extracted, so the rule is silently never generated.

### Layout widths and breakpoints

- Breakpoints: base 360px, `sm` 640px, `md` 768px, `lg` 1024px.
- Tool column and text column max 680px, home grid max 1024px, centred.
- Below `sm` the tool card is full-bleed (no side border or radius); from `sm` it is a bordered, rounded card.

### Touch and focus

- Tap targets ≥ 48 × 48 px with ≥ 8px between them.
- Focus ring: 2px solid crimson, 2px offset, on `:focus-visible` only.

### Icons

Inline SVG components in `components/ui/icons.tsx`, 20 or 24px, 1.75 stroke, `currentColor`. Only icons that carry meaning (check/alert, chevron, menu, close, speaker on/off). No icon library.

## 3. Page layouts

### 3.1 Tool page (mobile, 360px)

```
┌────────────────────────────────────┐
│ [画] Img Master          🔈   ☰    │  SiteHeader 52px, white, not sticky
├────────────────────────────────────┤
│ Compress Image to 50KB             │  H1, Noto Serif, steel
│ One subtitle sentence, muted       │
├────────────────────────────────────┤  tool card (full-bleed below sm)
│           ( red sun )              │  samurai stage, 126px (200px ≥ sm,
│           [ink samurai]            │   then in a sticky right column)
│        ~~~ground stroke~~~         │
│ Target (20KB)(50KB●)(100KB)…       │  options ABOVE the picker
│ ▸ More options                     │
│ ┌────────────────────────────────┐ │
│ │        Choose images           │ │  crimson, 56px, full width
│ └────────────────────────────────┘ │
│ 🔒 Your images never leave your    │  privacy line right under the button
│    device                          │
│ JPG, PNG, WebP · up to 10 at once  │  mobile hint (desktop: dashed drop zone)
├────────────────────────────────────┤
│ Breadcrumbs, related tools, how-to,│  SEO sections, unchanged text
│ page sections, FAQ, footer         │
└────────────────────────────────────┘
```

From the moment a run starts, the picker block is replaced in place by the results (the hidden file input stays mounted; "Compress another" reopens it). Options stay above, so changing the target still re-runs. This order keeps CLS < 0.05: swapping the last slot only moves content below the first screen.

Samurai moods (ToolShell state → stage): idle → on guard, breathing; processing → strikes, with a red slash across the card on each down-cut (every run shows at least one full stroke, results are never delayed); done/partial → lowers sword, stands tall; error → drops to one knee.

### 3.2 Home page

1. Hero: H1 and subtitle from `content/home.ts`, three gold-bordered category chips (Compress, Convert, Favicon) linking to the hubs, and the ronin scene: red sun, ink-wash hills, dark rock and the back-view ronin, who rolls up his sleeves every few seconds (paused off-screen and in hidden tabs). The scene is below the text on mobile, to the right on `lg`.
2. Tool grid by category: white bordered cards, serif name, one line, small crimson arrow, whole card is the link.
3. "How Img Master works" and FAQs.

### 3.3 Legal and info pages

Paper background, serif headings, reading width, "Last updated" date. No samurai.

### 3.4 404 page

The ronin scene (still, compact), "This page doesn't exist", and the tool grid.

### 3.5 Favicon pages

Same tool card and samurai stage. When the user picks a new image (image mode) or makes their first edit (text/emoji mode), the samurai cuts the source tile with two crossing red slashes, the tile breaks into ink shards that converge into the tiny icon, and the icon pops into the browser-tab preview (≤ 1.4 s, never blocks downloads). png-to-ico gets the normal samurai moods only.

## 4. Components

`'use client'` only where marked. Everything else is a server component.

### 4.1 Primitives (`components/ui/`)

| Component | Notes |
|---|---|
| `Button` | Variants `primary`, `secondary`, `ghost`, `danger`. Sizes `lg` (52px, full width on mobile), `md` (48px). Accepts `asChild`-style link rendering via an `href` prop. Shows a loading state with text, not only a spinner. |
| `IconButton` | 48 × 48, requires `aria-label`. |
| `Chip` / `ChipGroup` (client) | `role="radiogroup"` with roving tabindex; arrow keys move selection. Horizontal scroll with a fade at the edge on mobile. |
| `Card` | Surface + border + radius. |
| `Badge` | Small status labels (success, warning). |
| `Switch` (client) | Accessible toggle with label. |
| `Slider` (client) | Native `input[type=range]` styled; shows value. |
| `NumberInput` (client) | With unit toggle (KB/MB) for custom size. |
| `Sheet` (client) | Bottom sheet on mobile, side panel on desktop; focus trap, Esc closes, returns focus. |
| `Toast` (client) | `aria-live="polite"`, auto-hides after 3 s. |
| `VisuallyHidden` | For screen-reader-only text. |

### 4.2 Layout (`components/layout/`)

| Component | Notes |
|---|---|
| `SiteHeader` | White, 1px bottom border, ≤ 52px, not sticky. Logo left: crimson 画 seal (`BrandSeal`, decorative) + "Img Master" in Noto Serif bold, steel. Right: sound toggle, then the hamburger (mobile). Desktop active link gets a short crimson brush underline (`NavLink`, `aria-current`). Mobile: one hamburger opening a menu of all live tools + About/Privacy/Terms/Contact, links in the static HTML. Desktop: 4–5 text links (Compress, Convert, Favicon, About). Skip link to `#main`. |
| Mobile menu | All live tools grouped by category, from the registry; works without JS; keyboard accessible. |
| `SiteFooter` | Two lines max on mobile: "© {year} Img Master · Built by Softwara" and Privacy · Terms · Contact. No tool lists, tagline or social icons. |
| `Breadcrumbs` | Home › Category › Tool. Matches the BreadcrumbList JSON-LD. |
| `Container` | Width + gutters. |

### 4.3 Tool components (`components/tool/`)

| Component | Props / responsibility | States |
|---|---|---|
| `ToolShell` (client) | Takes a `ToolDefinition` (structure only). Owns the state machine: `idle → processing → done`, plus `error`. Calls the engine via `lib/image-engine` (the mock until integration). Renders the pieces below. | idle, processing (n of m), done, partial (some failed), error |
| `FilePicker` (client) | Hidden `<input type="file" accept="image/*" multiple>`, big crimson button, up to `siteConfig.maxFiles` (10) images. Desktop (≥ sm): dashed drop zone, drag/drop and paste; mobile: "up to 10 at once" hint under the privacy line. Validates count and type before passing files on. **Do not set `capture`** (users pick from the gallery). | default, drag-over, disabled while processing |
| `TargetSizeChips` (client) | Preset chips + Custom. | — |
| `FormatSelect` (client) | Segmented control JPG / PNG / WebP (only valid options per tool). | — |
| `QualitySlider` (client) | 10–100. | — |
| `AdvancedOptions` (client) | `<details>`-style disclosure: "Keep original dimensions", max width, background color. | collapsed (default), open |
| `PrivacyNote` | Lock icon + one line. | — |
| `ProgressBar` (client) | Determinate when the engine reports progress; text label "Compressing photo 2 of 5…". | — |
| `ResultCard` (client) | Thumbnail (object URL, revoked on unmount), file name, before → after, % smaller, dimensions, notes, per-file Download. Transparent images on a checkerboard. | processing (skeleton), success, warning note, failed (with suggestion buttons) |
| `ResultList` (client) | Ordered list of `ResultCard`s, heading "Results" that receives focus when done. | — |
| (removed) `StickyActionBar` | Replaced by the Download/Share buttons on each ResultCard and one "Download all (ZIP)" button for batches (owner redesign, 2026-10-24). | — |
| `ShareButton` (client) | Uses `navigator.canShare({ files })`; hidden when unsupported. | — |
| `ErrorBanner` (client) | Plain-language message + one action. | — |

**Test hooks for QA (required):** `ResultCard` root has `data-testid="result-card"` and `data-status`, `data-input-bytes`, `data-output-bytes`, `data-width`, `data-height`, `data-format`, `data-quality`, `data-ms` (processing time). `FilePicker` input has `data-testid="file-input"`. Download buttons have `data-testid="download"` / `"download-all"`.

### 4.4 Favicon components (`components/favicon/`)

| Component | Notes |
|---|---|
| `FaviconModeTabs` (client) | Image / Text / Emoji (each tool page opens on its own mode). |
| `FaviconControls` (client) | Mode-specific controls from `PRODUCT.md` 4.4. |
| `FaviconPreview` (client) | Browser tab mock (light and dark), home-screen icon, 16/32/48/180/512 previews. |
| `SnippetBlock` (client) | `<pre>` with the HTML snippet + Copy button ("Copied" feedback). |

### 4.5 Content components (`components/content/`)

| Component | Notes |
|---|---|
| `RichText` | Renders the content model: `paragraphs` (supports `**bold**` and `[text](/internal-path)` only), optional `list`, optional `table` (`caption`, `headers`, `rows`). No markdown library. |
| `HowToSteps` | Numbered 3-step list. |
| `FaqList` | Native `<details>/<summary>` (works without JS), one open at a time is not required. |
| `RelatedTools` | 4–6 `ToolCard`s from the content file's `related`. |
| `ToolCard` / `ToolGrid` | Bordered card, bold short name + one line, full card is the link. No icon, no shadow. |
| `AdSlot` | Renders nothing unless `site-config` ads are on. When on, reserves a fixed min-height (250px mobile) to prevent layout shift. Positions allowed: `below-results`, `before-footer`. |

### 4.6 Samurai (`components/samurai/`)

| File | Notes |
|---|---|
| `frames.ts` | `KENDO` (tool pages) and `RONIN` (hero, 404) frame sets: sprite URL (`?v=N`, bump when the sprite changes), frame sequences per mood, timing, still poses. Frame map in `scripts/samurai/README.md`. |
| `timeline.ts` | Pure scheduler (`startTimeline`, `request`, `tick`). A switch from working to success/error waits for the current stroke, so every run shows one full strike. |
| `samurai.tsx` (client) | `<svg>` with red sun, ground stroke and `<use href="sprite#kN">` with the ink filter (userSpaceOnUse region). Calls `request()` only when `state` changes. Pauses in hidden tabs; `animate={false}` or reduced motion → still pose. Fixed width/height so a missing sprite never shifts layout. |
| `samurai-stage.tsx` (client) | Fixed-height box (`height`, `heightSm`) plus the card-wide `Slash`. Test hooks: `data-testid="samurai-stage"`, `data-state` (shown mood). |
| `slash.tsx` (client) | 2px crimson line, `data-testid="slash"`, class `is-cutting` while running. |

Sprites (`public/samurai/kendo.svg`, `ronin.svg`) are traced from free Pixabay clips by the offline pipeline in `scripts/samurai/`. They are cached immutable (`public/_headers`), which matters because the samurai swaps `<use href>` every frame.

### 4.7 Sound (`components/sound/`)

Optional sword sounds, **off by default** (`siteConfig.soundEnabled: false`). `SoundToggle` is a 48×48 icon button in the header (`aria-pressed`, label "Sound on" / "Sound off"), with the preference in `localStorage` (try/catch). The AudioContext is created only inside the toggle's click. Sounds (`/sounds/{start,success,error}.mp3?v=N`, 5–8 KB each) are fetched only after the user turns sound on.

## 5. Interaction details

- **Auto-start:** picking files starts processing with the current options. Changing an option re-runs only after the user taps "Apply" for batches over 5 files; for 1–5 files re-run immediately.
- **Focus:** after processing, move focus to the "Results" heading and announce "Done. 48 KB, 98% smaller" via a polite live region.
- **Downloads:** create an `<a download>` from an object URL; revoke URLs when results are cleared. On iOS Safari the file may open in a new view; the toast says "Saved" only where download is confirmed, otherwise "Ready — use Share to save to Photos".
- **Leaving the page:** never block navigation.
- **Memory:** clear previous results when a new batch starts (after confirming only if there are undownloaded results).

## 6. Copy (microcopy)

| Key | Text |
|---|---|
| Picker button | Choose images |
| Picker hint (mobile) | JPG, PNG, WebP · up to {maxFiles} at once (10) |
| Picker hint (desktop) | or drop images here, or paste with Ctrl+V |
| Privacy note | 🔒 Your images never leave your device |
| Processing | Compressing photo {n} of {m}… / Converting {n} of {m}… |
| Success line | {before} → {after} ({percent}% smaller) |
| Already small | Already under {target}. We saved a clean copy without hidden photo data. |
| Resized note | Resized to {w} × {h} px to reach {target}. |
| Unreachable | We couldn't get this image under {target} and keep it readable. Try {nextTarget}, or allow smaller dimensions. |
| Not an image | We can't open this file. Try a JPG, PNG or WebP image. |
| Too many files | You can add up to {max} images at once. We took the first {max}. |
| Big image | This photo is very large, so we reduced its dimensions first to keep your phone fast. |
| WebP unsupported | Your browser can't save WebP files yet. Try Chrome or Firefox, or choose JPG. |
| Download | Download ({size}) |
| Download all | Download all (ZIP, {size}) |
| Share | Share |
| Again | Compress another / Convert another |
| Copy snippet | Copy code → Copied |

Tone: friendly, short, no exclamation marks except one "Done!" moment, no jargon ("quality 0.62" only inside advanced details).

## 7. Accessibility checklist

- `lang="en"` on `<html>`; one H1 per page; headings in order.
- All inputs labeled; chips are a radiogroup; switch and slider have visible labels and values.
- Live region for processing and results; errors use `role="alert"`.
- Everything works by keyboard; sheet traps focus and restores it.
- Color is never the only signal (icons + text for success, warning, error).
- Respects `prefers-reduced-motion` (samurai still poses, no slash, no shards). Light theme only (owner decision, 2026-10-24).
- Samurai, slash and hero scene are `aria-hidden`; the sound toggle has `aria-pressed` and a visible-state label.
- Passes axe with zero serious or critical issues.

## 8. Performance rules for UI

- No component library, no animation library. One web font only (Noto Serif via `next/font`, self-hosted).
- Samurai frames live in static sprite files, not in JavaScript, to protect the 30 KB first-load JS budget.
- The tool UI is one client island per page; content sections are server-rendered HTML.
- Thumbnails use small object URLs; never render full-resolution previews of 12MP photos (draw a downscaled preview, max 256px).
- Reserve space for anything that appears later (results area min-height when processing starts, ad slots) to keep CLS under 0.05.
