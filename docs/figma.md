# Img Master — Figma redesign brief

This is the brief for a UI/UX designer who will redesign the whole Img Master website in Figma. It explains what the product is, who uses it, every page and feature, how each screen works and moves, and what the Figma file must contain at hand-off.

Read this first, then use these as the detailed source of truth:

- `docs/PRODUCT.md`: pages, features and user flows
- `docs/DESIGN.md`: the current design system ("Ink Samurai") and microcopy
- `docs/SEO.md`: why each page has the text sections it has

---

## 1. The product in one minute

**Img Master** is a free website of image tools that run 100% inside the visitor's browser. Nothing is uploaded to a server.

**Tagline:** Shrink, convert and make icons on your phone. Free, instant, private.

What people do on it:

1. **Compress an image to an exact size** (20 KB, 50 KB, 100 KB, 200 KB, 500 KB, 1 MB, or a custom size), usually to pass an online form's file-size limit.
2. **Convert** between JPG, PNG and WebP.
3. **Make favicons** for a website from an image, text or an emoji, and convert PNG to ICO.

Visitors arrive from Google on a specific page ("compress image to 50kb", "webp to jpg"). Every one of those pages is a working tool, not a marketing page.

### Why people choose us

| Our edge | What the design must show |
|---|---|
| Exact size targets | Size chips are the first option the user sees. Results show the real final size. |
| Nothing is uploaded | A privacy line sits directly under the main button on every tool. |
| Built for phones | One column, big buttons, the tool is on the first screen. |
| No signup, no watermark, no limits | No sign-in UI, no paywall, no "pro" badges, no popups. |
| Removes hidden photo data (GPS etc.) | Mentioned in result notes and FAQs, never as a scare banner. |

---

## 2. Goals of the redesign

### Business goals

- Rank on Google for many specific tool keywords. Every tool page needs room for real text content below the tool (how-to, FAQs, related tools).
- Keep visitors coming back and using more than one tool (related tools, clear navigation).
- Leave clean, pre-reserved space for ads later, without hurting the tool experience.

### User goals

- "I need this photo under 50 KB for my form, right now." Land → pick photo → download in **under 15 seconds**.
- "This WebP won't open. Make it a JPG." One tap.
- "I need favicons for my site." See a live preview, download a ZIP, copy the HTML.

### Design goals

- Make the site feel **trustworthy, calm and crafted**, not like a generic ad-heavy converter site.
- Make the main action obvious to someone who reads English as a second language and is on a cheap Android phone.
- Give the brand a memorable character (the ink samurai, see section 6) without slowing anything down.

### How we measure success

| Measure | Target |
|---|---|
| Tool success rate | ≥ 97% of attempts give a file |
| Time from page load to first result | < 4 s median on a mid-range Android |
| Lighthouse mobile (every category) | ≥ 95 |
| Layout shift (CLS) | < 0.05 |
| Accessibility | WCAG 2.1 AA, zero serious axe issues |

---

## 3. Who we design for

| Persona | Situation | Device and context | What they need from the UI |
|---|---|---|---|
| **A. Student or job seeker** (Bangladesh, India, Pakistan) — **main persona** | Filling an admission or job form that caps photo and signature size | Low-end Android, 360px wide, slow 3G, English as a second language | One big button, the right size already chosen, almost no reading, a clear "Download" |
| **B. Everyday user** | A WebP image won't open, or a photo is too big to send | Any phone | One tap to JPG/PNG, done |
| **C. Developer or site owner** | Needs favicons, smaller site images, batches | Mostly desktop | Correct file sets, ZIP download, copy-paste HTML, drag and drop |

**Design every screen first at 360 × 640 for persona A.** Then scale up.

---

## 4. Rules the design must follow (non-negotiable)

1. **Tool first.** On every tool page, at 360 × 640, the H1, the main "Choose images" button and the privacy line are visible without scrolling.
2. **Mobile first.** Design at 360px first, then 768px, then 1280px.
3. **No upload language.** Never say "upload". Say "choose", "pick", "add".
4. **Honest copy.** No made-up user counts, ratings, reviews, "trusted by", or official exam/visa photo specs. Numbers shown are real results.
5. **No dark patterns.** No popups, countdowns, fake progress, newsletter modals or cookie walls beyond what law requires.
6. **Fast.** One web font only. No heavy hero images or video. Illustrations must be SVG or small sprites. Animation never delays a result or a download.
7. **Text lives in the page.** Every page's text sections (how-to, FAQs) are real HTML text, not images.
8. **Accessible.** Tap targets ≥ 48 × 48 px, inputs ≥ 16px text, AA contrast, color is never the only signal.
9. **Light theme only** (owner decision). No dark mode needed.

---

## 5. Sitemap and page inventory

```
/                               Home
├─ Compress
│  ├─ /compress-image           Hub + tool (pick a size OR pick a quality)
│  ├─ /compress-image-to-20kb
│  ├─ /compress-image-to-50kb
│  ├─ /compress-image-to-100kb
│  ├─ /compress-image-to-200kb
│  ├─ /compress-image-to-500kb
│  └─ /compress-image-to-1mb
├─ Convert
│  ├─ /image-converter          Hub + tool (any → JPG / PNG / WebP)
│  ├─ /webp-to-jpg   /webp-to-png
│  ├─ /png-to-webp   /jpg-to-webp
│  └─ /png-to-jpg    /jpg-to-png
├─ Favicon
│  ├─ /favicon-generator        Hub + tool (from an image)
│  ├─ /favicon-from-text
│  ├─ /favicon-from-emoji
│  └─ /png-to-ico
├─ /about  /privacy  /terms  /contact
└─ 404
```

Later (design system should allow these without a redesign): resize to pixels, crop (square / passport-style), signature tools, `/guides/...` articles, Bangla and Hindi versions (Bengali script must render well), installable PWA.

### Page templates to design

All 17 tool pages come from **4 templates**. Design the templates, then show 2–3 real pages as examples.

| Template | Used by | Unique part |
|---|---|---|
| **T1 Compress** | 6 size pages + `/compress-image` | Size chips, custom size input, quality mode on the hub |
| **T2 Convert** | 6 converter pages + `/image-converter` | "Convert to" selector on the hub, quality slider, background color for transparent → JPG |
| **T3 Favicon** | 3 favicon pages | Mode tabs (Image / Text / Emoji), controls, live preview, HTML snippet |
| **T4 PNG to ICO** | `/png-to-ico` | Simple: pick PNG → get .ico |
| **Home** | `/` | Hero, tool grid, how it works, FAQs |
| **Text page** | About, Privacy, Terms, Contact | Reading layout |
| **404** | Not found | Friendly message + tool grid |

---

## 6. Brand direction: "Ink Samurai"

The current brand, chosen by the owner on 2026-10-24. The redesign should **refine and elevate it**, not replace it. If you want to propose a different direction, show it as a separate option page in Figma; do not mix it into the main file.

**Idea:** ancient Japan meets modern utility. Warm paper, black ink, one crimson, a touch of gold, and one character: a sumi-e (ink brush) samurai who "cuts your image down to size".

### Current tokens (starting point)

| Token | Value | Use |
|---|---|---|
| `bg` (paper) | `#faf8f4` | Page background |
| `card` | `#ffffff` | Header, tool card, result cards |
| `surface` | `#f0ece4` | Section backgrounds, control tracks |
| `border` | `#e2ddd6` | Card borders |
| `border-strong` | `#8a8177` | Inputs, chips, switches |
| `ink` | `#1a1212` | Body text, samurai |
| `steel` | `#2d3748` | Headings, logo |
| `muted` | `#6b6560` | Subtitles, captions |
| `primary` (crimson) | `#c0392b` | Main buttons, links, red sun, slash, focus ring |
| `primary-hover` | `#a93226` | Hover / pressed |
| `gold` | `#c9a84c` | Selected chip border, small accents. **Never text** (fails contrast) |
| `gold-tint` | `#fbf4e2` | Selected chip / drag-over fill |
| `danger` | `#b42318` | Errors only |

- **Type:** Noto Serif (headings, logo) + system sans for body. Mobile scale: H1 24/30, H2 20/28, H3 17/24, body 15/24, small 14/20, caption 12/16. Desktop H1 28/36.
- **Shape:** cards 10px radius, buttons 6px, chips fully round.
- **Depth:** no shadows, no gradients. Borders only.
- **Grid:** 4px base. Gutter 16px mobile, 24px from 640px.
- **Logo:** crimson 画 seal + "Img Master" in serif.

### What the redesign may improve

- Stronger visual hierarchy on tool pages and results.
- A richer but still light home page hero.
- Better-looking result cards (before/after is the "win" moment).
- More polished favicon preview area.
- Consistent illustration language (brush marks, red sun, ink hills).
- Icons: a small custom set (≤ 15 icons), 1.75 stroke, 20/24px.

### What must not change

- Main button stays the strongest element on the page, in the primary color.
- Privacy line directly under the main button.
- No stock photos, no 3D, no glassmorphism, no heavy textures (they cost bytes).

---

## 7. Layout and breakpoints

| Frame | Width | Notes |
|---|---|---|
| Mobile S (primary) | **360 × 640** | Design here first. Tool card is full-bleed (no side border/radius). |
| Mobile L | 412 × 915 | Check spacing scales well. |
| Tablet | 768 × 1024 | Tool card becomes a bordered, rounded card. |
| Desktop | 1280 × 800 | Tool column max 680px; samurai stage in a sticky right column; home grid max 1024px. |

Breakpoints in code: base 360, `sm` 640, `md` 768, `lg` 1024. Use Figma auto layout so every frame resizes cleanly.

### Tool page anatomy (mobile, top to bottom)

```
┌──────────────────────────────────┐
│ [画] Img Master        🔈    ☰   │  Header, 52px, not sticky
├──────────────────────────────────┤
│ Compress Image to 50KB           │  H1
│ One short subtitle line          │  Subtitle, muted
├──────────────────────────────────┤
│          (red sun)               │  Samurai stage, ~126px tall
│        [ink samurai]             │
│      ~~~ground stroke~~~         │
│ Target (20KB)(50KB●)(100KB) →    │  Options ABOVE the picker
│ ▸ More options                   │
│ ┌──────────────────────────────┐ │
│ │        Choose images         │ │  Primary button, 56px, full width
│ └──────────────────────────────┘ │
│ 🔒 Your images never leave your  │  Privacy line
│    device                        │
│ JPG, PNG, WebP · up to 10 at once│  Hint
╞══════════════ fold (640px) ══════╡
│ Results (after processing)       │  Replaces the picker block in place
│ Breadcrumbs                      │
│ How to … (3 steps)               │  SEO content, real text
│ Content sections / table         │
│ FAQ (accordions)                 │
│ Related tools (4–6 cards)        │
│ [Ad slot, reserved, optional]    │
│ Footer                           │
└──────────────────────────────────┘
```

---

## 8. Features and how each one works

### 8.1 Shared on every tool

| Feature | Behavior the design must show |
|---|---|
| Auto-start | Picking files starts processing at once. There is **no separate "Compress" button**. |
| Batch | Up to 10 images. Results listed in order. "Download all (ZIP)" when more than one. |
| Desktop extras | Dashed drop zone, drag and drop, paste with Ctrl+V. Show the drag-over state. |
| Mobile extra | **Share** button (send straight to WhatsApp/Messenger). Only shown where the phone supports it. |
| File names | `photo-50kb.jpg`, `photo.webp` — show these on result cards. |
| Remembers options | Last chosen options come back next visit (no UI needed, but don't design a "save settings" button). |
| Very large photos | Scaled down first, with a short note on the result. |

### 8.2 Compress to size (T1) — the most important tool

- **Target size chips:** 20KB, 50KB, 100KB, 200KB, 500KB, 1MB, Custom. The page's own size is preselected. Chips scroll sideways on mobile with an edge fade.
- **Custom:** number input + KB/MB toggle.
- **More options** (collapsed by default): output format JPG / WebP, "Keep original dimensions" switch.
- Changing the target re-runs the job (for more than 5 files, show an "Apply" button instead).
- **Result:** thumbnail, file name, `2.4 MB → 48 KB (98% smaller)`, `1200 × 900 px`, note if it was resized, Download and Share.
- **Can't reach target:** a clear message plus buttons for the next size up or "allow smaller dimensions".
- **Hub `/compress-image`:** a mode switch: "Pick a size" or "Pick a quality" (slider 10–100, default 75), plus optional max width (1920 / 1280 / 800).

### 8.3 Convert (T2)

- Picking files converts immediately to the page's format.
- Quality slider (JPG/WebP only), default 90.
- Background color picker, shown **only** when a transparent image goes to JPG (default white).
- Hub `/image-converter` adds a "Convert to" segmented control: JPG / PNG / WebP.
- Transparent results sit on a checkerboard.

### 8.4 Favicon (T3, T4)

- **Mode tabs:** Image / Text / Emoji. Each page opens on its own mode.
- **Image mode:** center square crop with zoom slider, padding, background.
- **Text mode:** 1–3 letters, font weight, text color, background color, shape (square / rounded / circle), padding.
- **Emoji mode:** one emoji from the phone's keyboard, background color or transparent, shape.
- **Live preview:** browser-tab mock (light and dark), phone home-screen icon, real sizes 16 / 32 / 48 / 180 / 512.
- **Download:** one ZIP with all files. Below it, the HTML snippet in a code block with a **Copy code → Copied** button.
- **PNG to ICO (T4):** pick a PNG → get a multi-size .ico. Simple result card.

---

## 9. User flows to prototype in Figma

Build these as clickable prototypes at 360px. Flow 1 is the priority.

### Flow 1 — Compress to 50 KB (main flow)

1. Land on `/compress-image-to-50kb`. 50KB chip already selected.
2. Tap **Choose images** → phone gallery (show a simple system-picker placeholder).
3. Processing: samurai strikes, red slash crosses the card, progress text "Compressing photo 1 of 1…".
4. Result card scrolls into view and the "Results" heading gets focus.
5. Tap **Download (48 KB)** → toast "Saved".
6. Below: "Compress another" and related size links.

### Flow 2 — Batch convert WebP → JPG

Pick 4 files → progress "Converting 2 of 4…" → 4 result cards → **Download all (ZIP, 1.2 MB)**.

### Flow 3 — Favicon from text

Open `/favicon-from-text` → type "IM" → pick colors and shape → preview updates live, samurai cut animation on first edit → Download ZIP → Copy code → "Copied".

### Flow 4 — Error recovery

Pick a 12 MB photo with a 20 KB target → "We couldn't get this image under 20 KB and keep it readable." → tap "Try 50 KB" → success.

### Flow 5 — Navigation

Home → tap "Convert" chip → `/image-converter` → menu (hamburger) → `/favicon-generator`.

---

## 10. Every state to design

### Tool states (ToolShell)

| State | What the user sees | Samurai mood |
|---|---|---|
| **Idle** | Options + Choose images + privacy line | On guard, breathing |
| **Drag-over** (desktop) | Drop zone gold-tint fill, gold border | On guard |
| **Processing** | Picker replaced by results area with skeleton cards and progress text | Strikes; red slash on each cut |
| **Done** | Result cards, Download/Share, "Results" heading | Lowers sword, stands tall |
| **Partial** | Some cards success, some failed with suggestion buttons | Stands tall |
| **Error** | Error banner (icon + plain sentence + one action) | Drops to one knee |

### Result card states

Skeleton (processing) · Success · Success with note (resized / already small / big image) · Failed with suggestion buttons · Transparent image on checkerboard.

### Error messages (exact copy)

| Case | Text |
|---|---|
| Not an image | We can't open this file. Try a JPG, PNG or WebP image. |
| Too many files | You can add up to 10 images at once. We took the first 10. |
| Target unreachable | We couldn't get this image under {target} and keep it readable. Try {nextTarget}, or allow smaller dimensions. |
| Big image | This photo is very large, so we reduced its dimensions first to keep your phone fast. |
| WebP unsupported | Your browser can't save WebP files yet. Try Chrome or Firefox, or choose JPG. |
| Already small | Already under {target}. We saved a clean copy without hidden photo data. |

Full microcopy table: `docs/DESIGN.md` section 6. Tone: friendly, short, plain English, no exclamation marks except one "Done!".

### Component states

Every interactive component needs: default, hover (desktop), pressed, focus-visible (2px crimson ring, 2px offset), disabled, and loading where relevant.

---

## 11. Motion and animation

Motion should explain what is happening, never decorate for its own sake.

| Moment | Animation | Duration / easing | Rule |
|---|---|---|---|
| Processing | Samurai strike frames + 2px crimson **slash** across the tool card on each down-cut | Slash 220 ms, ease-out | Every run shows at least one full stroke. Never delays the result. |
| Result appears | Card fades in, size numbers can count up | Fade 150 ms | Card is scrolled into view. |
| "Done" moment | Small pop on the % badge | 300 ms, scale 0.5 → 1 | Once per run. |
| Favicon cut | Two crossing red slashes cut the source tile, tile breaks into ink shards, shards fly into the small icon, icon pops into the tab preview | ≤ 1.4 s total | Plays on new image or first edit. Never blocks Download. |
| Home hero | Back-view ronin rolls up his sleeves every few seconds; red sun; ink-wash hills | Loop with long pauses | Pauses when off-screen or tab hidden. |
| Menu | Slides down | ~200 ms | — |
| Toast | Fades in, auto-hides | 3 s | — |
| Tap feedback | Pressed color | < 100 ms | Every tap gets instant feedback. |

**Reduced motion:** when the user's phone asks for reduced motion, show one still samurai pose per state, no slash, no shards, no count-up. Design these still poses too.

**Sound (optional):** sword sounds, **off by default**. A speaker icon button in the header turns them on (start / success / error sounds). Design both icon states with labels "Sound on" / "Sound off".

In Figma: use Smart Animate for the processing → done transition and the favicon cut. Add a short motion spec note (duration, easing, trigger) next to each animated frame.

---

## 12. Components to build in the Figma library

Use variants and component properties. Names should match the code so hand-off is easy.

**Primitives (`ui/`)**
Button (primary, secondary, ghost, danger × lg 52px / md 48px × states) · IconButton 48×48 · Chip and ChipGroup (selected, unselected, focus) · Card · Badge (success, warning) · Switch · Slider (with value) · NumberInput with KB/MB toggle · Segmented control · Sheet (bottom sheet mobile, side panel desktop) · Toast · Icons set.

**Layout (`layout/`)**
SiteHeader (mobile, desktop, with active link brush underline) · Mobile menu (tools grouped by category + About/Privacy/Terms/Contact) · SiteFooter (2 lines on mobile) · Breadcrumbs · Container.

**Tool (`tool/`)**
FilePicker (mobile button + hint; desktop drop zone; drag-over; disabled) · TargetSizeChips · FormatSelect · QualitySlider · AdvancedOptions (collapsed/open) · PrivacyNote · ProgressBar ("Compressing photo 2 of 5…") · ResultCard (all states above) · ResultList · ShareButton · ErrorBanner · "Download all (ZIP)" bar.

**Favicon (`favicon/`)**
FaviconModeTabs · FaviconControls (per mode) · FaviconPreview (tab mock light/dark, home-screen icon, size row) · SnippetBlock (with Copy / Copied).

**Content (`content/`)**
PageIntro (H1 + subtitle) · HowToSteps (3 numbered steps) · RichText (paragraphs, list, table) · FaqList (accordion, native details style) · ToolCard and ToolGrid · RelatedTools · AdSlot (reserved box, 250px tall on mobile, labelled "Advertisement") · LastUpdated.

**Brand (`samurai/`)**
Samurai stage (126px mobile / 200px desktop) with moods: idle, working, success, error + reduced-motion stills · Red sun · Ground brush stroke · Slash · Ronin hero scene · 画 seal logo.

---

## 13. Home page

1. **Hero:** H1 + one subtitle, three category chips (Compress, Convert, Favicon) linking to the hubs, and the ronin scene (red sun, ink hills, rock, ronin). Scene below text on mobile, right of text on desktop.
2. **Tool grid by category:** bordered cards, serif tool name, one line description, small crimson arrow. Whole card is the link.
3. **How Img Master works:** three short points (pick, it runs on your phone, download).
4. **FAQs.**
5. Footer.

No testimonials, no user counts, no logos of "featured in".

## 14. Other pages

- **About / Privacy / Terms / Contact:** paper background, serif headings, reading width (max 680px), "Last updated" date. No samurai.
- **404:** compact still ronin scene, "This page doesn't exist", then the tool grid.

---

## 15. Accessibility checklist for the designer

- Contrast AA for all text (4.5:1 body, 3:1 large text and UI outlines). Gold is never used for text.
- Tap targets ≥ 48 × 48 with ≥ 8px gap.
- Inputs at 16px text or larger (stops iOS zoom).
- Visible focus ring on every interactive element.
- Success, warning and error use an icon **and** text, not color alone.
- Headings in order, one H1 per page.
- Annotate in Figma: live region announcement after results ("Done. 48 KB, 98% smaller"), focus moves to "Results" heading, menu and sheet focus order.
- Samurai and hero scene are decorative (hidden from screen readers).

---

## 16. Figma file structure

```
📄 00 Cover           — project name, version, date, status
📄 01 Brief & goals   — summary of this document, personas, success measures
📄 02 Foundations     — color styles/variables, type styles, spacing, radius, grid, icons
📄 03 Components      — full library with variants and states (section 12)
📄 04 Brand & motion  — samurai moods, still poses, slash, hero scene, motion specs
📄 05 Templates       — T1 Compress, T2 Convert, T3 Favicon, T4 ICO, Home, Text page, 404
📄 06 Pages           — real pages at 360 / 768 / 1280:
                         compress-image-to-50kb, compress-image (both modes),
                         webp-to-jpg, image-converter, favicon-from-text,
                         favicon-generator, png-to-ico, home, about, 404
📄 07 States          — idle, drag-over, processing, done, partial, error, batch of 10
📄 08 Prototypes      — flows 1–5 from section 9
📄 09 Hand-off        — redlines, spacing notes, motion notes, a11y annotations
📄 99 Explorations    — alternate directions (kept separate)
```

- Use **Figma variables** for colors and spacing with the token names from section 6 (`bg`, `card`, `primary`…), so they map 1:1 to `app/globals.css`.
- Use auto layout everywhere. No detached instances in final pages.
- Use real copy from `content/pages/*.ts`, not lorem ipsum. Long text sections can be shortened, but headings must be real.

---

## 17. Deliverables and acceptance

The design is ready for hand-off when:

- [ ] Foundations page has all color, type and spacing variables, named like the code tokens.
- [ ] Every component in section 12 exists with all variants and states.
- [ ] All templates designed at 360, 768 and 1280.
- [ ] At 360 × 640, the H1, Choose images button and privacy line are above the fold on every tool page.
- [ ] Every state in section 10 is designed, including errors and batch.
- [ ] Reduced-motion still poses are designed.
- [ ] Prototypes for flows 1–5 work end to end.
- [ ] Every text/background pair passes WCAG AA (checked with a contrast plugin).
- [ ] No invented numbers, ratings, reviews or official specs anywhere in the designs.
- [ ] Motion specs (trigger, duration, easing) noted beside every animation.
- [ ] Ad slot space is shown and reserved, but the design looks complete without ads.

---

## 18. Out of scope

Accounts and sign-in, any upload or cloud feature, video tools, social media downloaders, AI image generation, layer-based editors, dark mode, pricing pages.

## 19. Open questions for the owner

1. Keep the Ink Samurai brand exactly, or allow the designer to explore one alternate direction on the Explorations page?
2. Should the redesign include the later pages (resize, crop, guides, Bangla/Hindi) now, or only the live pages?
3. Ads: which positions are approved (currently below results and before the footer only)?
