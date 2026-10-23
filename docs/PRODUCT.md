# Img Master — product spec

## 1. What we are building

**Img Master** is a set of free image tools that work on a phone in a few taps: shrink a photo to an exact size (20KB, 50KB, 100KB…), convert between JPG, PNG and WebP, and generate favicons.

**Tagline:** Shrink, convert and make icons on your phone. Free, instant, private.

### Why someone picks us over TinyPNG, iLoveIMG or Squoosh

| Our edge | Why it matters |
|---|---|
| **Exact size targets** ("under 50KB") | Online forms reject files over a limit. Most compressors only offer a vague quality slider. |
| **Nothing is uploaded** | Faster on slow mobile data, private, works offline later (PWA). |
| **Built for phones** | Big buttons, one column, the tool is the first thing you see. |
| **No signup, no watermark, no daily limits** | Removes every reason to leave. |
| **Removes hidden photo data** | Re-encoding drops EXIF metadata such as GPS location. True for every output, so we can say it. |

## 2. Who uses it

| Audience | Situation | What they need |
|---|---|---|
| **A. Students and job seekers** (Bangladesh, India, Pakistan first) | Filling online application, admission or job forms that cap photo and signature size. Usually on a low-end Android phone with slow data. | An exact size target, a JPG output, a face that stays readable, almost no reading. |
| **B. Everyday users** | Saved an image as WebP and it won't open or upload. Or a photo is too big to email or send. | One tap to JPG or PNG, done. |
| **C. Developers and site owners** | Need favicons, smaller site images, WebP versions, batches. | Correct file sets, ZIP download, copy-paste HTML. |

Audience A is the main traffic bet. Every design decision should work for a first-time visitor on a 360px Android phone over 3G.

## 3. Pages

All tool pages come from `lib/tools/registry.ts` plus a content file in `content/pages/`. "Phase" in these tables is the product phase (1 = launch, 2–3 = later), stored in the registry's `phase` field. Build order is in `KICKOFF.md`. A page stays `status: 'draft'` (not built, not in the sitemap) until it's built and passes QA; for example, the favicon tools are launch pages but go live in build Phase 4.

### 3.1 Compress to size (kind `compress-to-size`, default output JPG)

| Slug | Target | Primary keyword | Phase |
|---|---|---|---|
| `compress-image-to-20kb` | 20 KB | compress image to 20kb | 1 |
| `compress-image-to-50kb` | 50 KB | compress image to 50kb | 1 |
| `compress-image-to-100kb` | 100 KB | compress image to 100kb | 1 |
| `compress-image-to-200kb` | 200 KB | compress image to 200kb | 1 |
| `compress-image-to-500kb` | 500 KB | compress image to 500kb | 1 |
| `compress-image-to-1mb` | 1 MB (1000 KB) | compress image to 1mb | 1 |
| `compress-image-to-10kb`, `-30kb`, `-150kb`, `-300kb`, `-2mb` | — | — | 2, only if Search Console or keyword data shows demand |

### 3.2 Converters (kind `convert`)

| Slug | From → To | Phase |
|---|---|---|
| `webp-to-jpg` | WebP → JPG | 1 |
| `webp-to-png` | WebP → PNG | 1 |
| `png-to-webp` | PNG → WebP | 1 |
| `jpg-to-webp` | JPG → WebP | 1 |
| `png-to-jpg` | PNG → JPG | 1 |
| `jpg-to-png` | JPG → PNG | 1 |
| `heic-to-jpg` | HEIC → JPG | 2 (needs a decoder; ask the owner) |

### 3.3 General tools (hub pages that are also tools)

| Slug | Kind | What it does | Phase |
|---|---|---|---|
| `compress-image` | `compress` | Quality slider **or** a custom target size; links to every size page | 1 |
| `image-converter` | `convert` (`from: 'any'`) | Any supported input to JPG, PNG or WebP; links to every converter page | 1 |

### 3.4 Favicon tools (product phase 1, built in Phase 4 of `KICKOFF.md`)

| Slug | Kind | Source |
|---|---|---|
| `favicon-generator` | `favicon-image` | An uploaded image (also the favicon hub) |
| `favicon-from-text` | `favicon-text` | 1–3 letters, colors, shape |
| `favicon-from-emoji` | `favicon-emoji` | One emoji, background, shape |
| `png-to-ico` | `png-to-ico` | PNG to a multi-size `.ico` file |

### 3.5 Site pages

`/` (home), `/about`, `/privacy`, `/terms`, `/contact`, and a helpful 404 page.

### 3.6 Later (Phase 2–3, decided by data)

- **Resize to pixels** (`resize-image`, plus presets like `resize-image-to-600x600`)
- **Crop** (square or passport-style crop before compressing)
- **Signature tools** (resize a signature photo, white background clean-up)
- **Guides** (`/guides/...`), how-to articles that each lead to a tool
- **Use-case pages** for specific forms, only when the owner gives a verified official requirement with its source
- **Bangla and Hindi versions** (`/bn/...`, `/hi/...`) with `hreflang`
- **PWA**: installable, works offline after first visit

### Out of scope

Accounts, uploads or any server processing, video tools, social-media downloaders, AI image generation, editors with layers.

## 4. Features by tool

### 4.1 Compress to size

- Picking files starts processing immediately with the page's preset. No extra "Compress" button.
- Options (collapsed under the result on mobile so the first view stays simple):
  - Target size chips: 20KB, 50KB, 100KB, 200KB, 500KB, 1MB, plus "Custom" (number input with a KB/MB toggle). Changing the target re-runs the job.
  - Output format: JPG (default) or WebP.
  - "Keep original dimensions" switch (off by default; when on, only quality is lowered).
- Result shows: before → after size, % smaller, final dimensions, and a plain note if dimensions were reduced.
- If the target can't be reached without making the image unusable, say so and offer the next size up or "allow smaller dimensions".
- Every result has its size **under** the target in both decimal (1 KB = 1000 bytes) and binary (1 KB = 1024 bytes) terms, so any form accepts it. See `ENGINE.md`.

### 4.2 General compressor (`compress-image`)

- Mode switch: "Pick a size" (same as 4.1, with a custom target) or "Pick a quality" (slider 10–100, default 75).
- Optional max width (e.g. 1920, 1280, 800).

### 4.3 Converters

- Picking files converts immediately to the page's target format.
- Quality slider for lossy outputs (JPG, WebP), default 90.
- Background color for transparent images going to JPG (default white), shown only when the input has transparency.
- `image-converter` adds a "Convert to" selector (JPG, PNG, WebP).

### 4.4 Favicon tools

- Live preview: a browser-tab mock (light and dark), a phone home-screen icon, and the actual pixel sizes.
- Text mode: 1–3 characters, font weight, text color, background color, shape (square, rounded, circle), padding.
- Emoji mode: one emoji typed or pasted (use the device's emoji keyboard; no emoji library), background color or transparent, shape.
- Image mode: center square crop with a zoom slider, padding, background.
- Download: ZIP with `favicon.ico` (16, 32, 48), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180), `android-chrome-192x192.png`, `android-chrome-512x512.png`, `favicon.svg` (text and emoji modes only), `site.webmanifest`, and `README.txt` with the HTML snippet. The snippet is also shown on the page with a Copy button.

### 4.5 Shared behavior on every tool

- Batch: up to 20 files at once (configurable in `site-config.ts`). Results listed in order; "Download all (ZIP)" when there's more than one.
- Desktop extras: drag and drop, paste with Ctrl+V.
- Mobile extra: a Share button using the Web Share API with files, shown only where supported, so a user can send the result straight to WhatsApp or Messenger.
- File names: `original-name-50kb.jpg`, `original-name.webp`, etc.
- Remember the last options per tool in `localStorage` (inside try/catch).
- Inputs accepted in Phase 1: JPG, PNG, WebP, GIF (first frame), BMP, plus anything else the browser can decode (HEIC on Safari).
- Very large images (over 16.7 megapixels) are scaled down first to protect phone memory, with a note in the result.

## 5. User flows

### 5.1 Compress to size (the most important flow)

1. Visitor lands on `/compress-image-to-50kb` from Google.
2. Sees the H1 ("Compress Image to 50KB"), one subtitle line, a big **Choose images** button and the privacy line. The 50KB chip is already selected.
3. Taps **Choose images**, picks a photo from the gallery.
4. Processing starts right away. A progress bar shows "Compressing…".
5. Result card: thumbnail, "2.4 MB → 48 KB (98% smaller)", "1200 × 900 px". A sticky bar at the bottom shows **Download (48 KB)** and **Share**.
6. Taps Download. A small toast confirms "Saved". The page offers "Compress another" and related sizes.

Time from landing to download: under 15 seconds on a mid-range phone.

### 5.2 Converter

Pick → converts automatically → Download (or Download all as ZIP). Transparent PNG to JPG shows the background color option on the result card.

### 5.3 Favicon

Choose mode (image, text, emoji) → adjust with live preview → Download ZIP → copy the HTML snippet.

### 5.4 Errors (exact wording lives in `DESIGN.md`)

- Not an image or can't be decoded
- Target unreachable
- Browser can't encode WebP
- Out of memory or very large image
- Too many files

## 6. Success measures

- Tool success rate (successful outputs ÷ attempts) ≥ 97%
- Median time from page load to first result < 4 s on mid-range Android
- Downloads per visit, returning visitors
- Search impressions and clicks per page (Search Console)

See `GROWTH.md` for traffic and money goals.
