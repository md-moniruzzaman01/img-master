# Img Master — design system and components

## 1. Design principles

1. **Tool first.** The visitor came to do one job. The picker is the first interactive thing on the page.
2. **One thumb.** Every main action is reachable with one thumb on a 360px phone. After processing, the result card (with its Download button) is scrolled into view; there is no sticky bar.
3. **Honest numbers.** Always show real before/after sizes and dimensions. No fake progress, no fake counters.
4. **Calm and trustworthy.** White, one brand color, no shadows, no gradients, no decorative icons, no popups, no countdowns. Looks like ilovepdf/smallpdf: one task at a time. (Owner redesign, 2026-10-24.)
5. **Fast feels good.** Instant feedback within 100 ms of any tap; skeletons instead of spinners.

## 2. Tokens

Define tokens as CSS variables in `app/globals.css` and map them into Tailwind's theme. Components use the Tailwind names (`bg-surface`, `text-muted`), never raw hex.

### Color (light only)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page and card background |
| `--surface` | `#F5F5F5` | Section backgrounds, thumbnail boxes |
| `--border` | `#E0E0E0` | Card, header and section borders |
| `--border-strong` | darker gray (≥ 3:1) | Input and control outlines |
| `--text` | `#1A1A1A` | Main text |
| `--text-muted` | `#555555` | Subtitles, secondary text |
| `--primary` | `#1D4ED8` | The one brand color: primary buttons, links, selected states, focus ring |
| `--primary-hover` | `#1E40AF` | Hover/pressed |
| `--on-primary` | `#FFFFFF` | Text on primary |
| `--danger` | `#B42318` | Error text and borders only (the single exception to "one color") |

No other colors (neutral grays for control outlines, loading skeletons and the favicon preview's dark browser-tab mock are fine). Success and warning notes use the normal text colors plus an icon and words. No dark mode (`color-scheme: light`). Every text/background pair meets WCAG AA; if a check fails, adjust the token, not the component.

### Typography

- Font stack (no web fonts): `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Bengali", Arial, sans-serif`
- Scale (mobile → desktop ≥ 1024px):

| Style | Mobile | Desktop | Weight |
|---|---|---|---|
| H1 | 26/32 | 28/36 | 700 |
| H2 | 20/28 | 20/28 | 600 |
| H3 | 17/24 | 17/24 | 600 |
| Subtitle | 15–16/24, `#555`, one sentence | same | 400 |
| Body | 15/24 (1.6) | 15/24 | 400 |
| Small | 14/20 | 14/20 | 400 |
| Caption | 12/16 | 12/16 | 500 |

- Inputs are never smaller than 16px (prevents iOS zoom on focus).
- Numbers in results use `font-variant-numeric: tabular-nums`.

### Spacing, radius, elevation, motion

- 4px grid. Page side gutter 16px (mobile), 24px (≥ 640px).
- Card padding 16px (mobile), 20px (desktop). Section gap 32px (mobile), 48px (desktop).
- Radius: 8px for cards, buttons, inputs and the drop zone; chips fully rounded.
- Elevation: none. No shadows anywhere; separate things with 1px `#E0E0E0` borders. No gradients.
- Motion: 150 ms ease-out for state changes. Respect `prefers-reduced-motion` (no transitions). No decorative animation.

### Layout widths and breakpoints

- Breakpoints: base 360px, `sm` 640px, `md` 768px, `lg` 1024px.
- Tool column and text column both max 680px (same left edge), home grid max width 1024px, all centered.
- Every page stays one column up to `lg`. The home tool grid goes 1 → 2 → 3 columns.

### Touch and focus

- Tap targets at least 48 × 48 px with at least 8px between them.
- Focus ring: 2px solid `--focus` with 2px offset, visible on keyboard focus only (`:focus-visible`).

### Icons

Inline SVG components in `components/ui/icons.tsx`, 20 or 24px, 1.75 stroke, `currentColor`. Only icons that carry meaning (check/alert next to status text, chevron on disclosures, menu, close). No icons on buttons or tool cards, no decorative icons. No icon library.

## 3. Page layouts

### 3.1 Tool page (mobile, 360px)

```
┌────────────────────────────────────┐
│ Img Master                      ☰  │  SiteHeader ≤ 52px, text logo, not sticky
├────────────────────────────────────┤
│ Compress Image to 50KB             │  H1 (static HTML)
│ Get a clear JPG under 50KB in      │  Subtitle, one sentence, gray
│ seconds, right on your phone.      │
│ ┌────────────────────────────────┐ │
│ │        Choose images           │ │  FilePicker: full-width solid blue
│ └────────────────────────────────┘ │  button, ≥ 52px, no icon
│ 🔒 Your images never leave your    │  PrivacyNote, directly under the
│    device                          │  button (above the fold at 360×640)
│ Target  (20KB)(50KB●)(100KB)(200…→ │  Options come after the privacy line
│ ▸ More options                     │
│                                    │  Tool column fills the first screen
│                                    │  (min-height, so results never shift)
├────────────────────────────────────┤  ↓ replaced in place after picking
│ Results                            │
│ ┌────────────────────────────────┐ │  ResultCard: white, 1px border, 8px
│ │ [80×80] photo-50kb.jpg         │ │  radius, no shadow
│ │ 2.4 MB → 48 KB  98% smaller    │ │
│ │ 1200 × 900 px                  │ │
│ │ [     Download (48 KB)       ] │ │  full-width blue
│ │ [           Share            ] │ │  secondary gray (if supported)
│ └────────────────────────────────┘ │
│ Compress another                   │
├────────────────────────────────────┤
│ Home › Compress › To 50KB          │  Breadcrumbs (small, gray)
│ Related tools (bordered cards)     │  RelatedTools, after the result
│ How to compress an image to 50KB   │  HowToSteps (H2 from content)
│ Page-unique sections               │  RichText
│ FAQ (details/summary, no JS)       │  FaqList
│ © 2026 Img Master · Built by …     │  SiteFooter, two lines
└────────────────────────────────────┘
```

Batches show one full-width "Download all (ZIP, {size})" button with the results, plus a Download on each card. On desktop the picker is a dashed-border drop zone with "or drop images here, or paste with Ctrl+V".

### 3.2 Home page

1. H1 "Free Image Tools. No Upload. No Signup." and one subtitle sentence. No background, gradient or illustration.
2. Tool grid grouped by category (H2 per category: Compress, Convert, Favicon). `ToolCard` = bordered, 8px radius, bold name, one line, whole card is the link, no icon, no shadow. 1 → 2 → 3 columns.
3. "How Img Master works" text and 4 FAQs below.

### 3.3 Legal and info pages

Plain reading layout: H1, "Last updated" date, text at max 680px.

### 3.4 404 page

"This page doesn't exist" plus the tool grid, so the visit isn't lost.

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
| `SiteHeader` | White, 1px bottom border, ≤ 52px, not sticky. Text logo "Img Master" (bold, no icon) left. Mobile: one hamburger opening a menu of all live tools + About/Privacy/Terms/Contact, links in the static HTML. Desktop: 4–5 text links (Compress, Convert, Favicon, About). Skip link to `#main`. |
| Mobile menu | All live tools grouped by category, from the registry; works without JS; keyboard accessible. |
| `SiteFooter` | Two lines max on mobile: "© {year} Img Master · Built by Softwara" and Privacy · Terms · Contact. No tool lists, tagline or social icons. |
| `Breadcrumbs` | Home › Category › Tool. Matches the BreadcrumbList JSON-LD. |
| `Container` | Width + gutters. |

### 4.3 Tool components (`components/tool/`)

| Component | Props / responsibility | States |
|---|---|---|
| `ToolShell` (client) | Takes a `ToolDefinition` (structure only). Owns the state machine: `idle → processing → done`, plus `error`. Calls the engine via `lib/image-engine` (the mock until integration). Renders the pieces below. | idle, processing (n of m), done, partial (some failed), error |
| `FilePicker` (client) | Hidden `<input type="file" accept="image/*" multiple>`, big button, drag/drop and paste on desktop. Validates count and type before passing files on. **Do not set `capture`** (users pick from the gallery). | default, drag-over, disabled while processing |
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
| Picker hint (mobile) | JPG, PNG, WebP · up to 20 at once |
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
- Respects `prefers-reduced-motion`. Light theme only (owner decision, 2026-10-24).
- Passes axe with zero serious or critical issues.

## 8. Performance rules for UI

- No component library, no animation library, no web fonts.
- The tool UI is one client island per page; content sections are server-rendered HTML.
- Thumbnails use small object URLs; never render full-resolution previews of 12MP photos (draw a downscaled preview, max 256px).
- Reserve space for anything that appears later (results area min-height when processing starts, ad slots) to keep CLS under 0.05.
