You are a senior QA engineer doing a final pre-deployment audit of this Next.js image tools website (Img Master / PicSlice). Go through EVERY item below. Fix any issue you find. Do NOT skip anything.

## ⚙️ CHANGE FIRST (before auditing)
- Set the batch file limit to **20** everywhere it appears (currently 10):
  - `site-config.ts` → update `maxFilesPerBatch` (or equivalent) to `20`
  - Any UI text that says "up to 10 files" → change to "up to 20 files"
  - Any validation that rejects >10 files → update to >20
  - `PRODUCT.md` reference to "10 files" if it exists in code comments
  - Drag-and-drop zone `multiple` and `max` attributes

---

## 1. CORE FUNCTIONALITY — test every tool

For each tool, verify:
- [ ] File picker opens and accepts JPG, PNG, WebP, GIF, BMP
- [ ] Drag and drop works (desktop) — accepts up to 20 files at once
- [ ] Paste with Ctrl+V works (desktop)
- [ ] Processing starts immediately on file select (no extra button needed)
- [ ] Result shows: before size → after size, % smaller, final dimensions
- [ ] Download button works and file is correctly named (`original-name-50kb.jpg` etc.)
- [ ] "Download all as ZIP" appears and works when >1 file processed
- [ ] Share button (Web Share API) appears on mobile where supported
- [ ] localStorage remembers last options per tool (inside try/catch — no crashes in private mode)

### Compress-to-size tools (20KB, 50KB, 100KB, 200KB, 500KB, 1MB):
- [ ] The page's preset target chip is pre-selected on load
- [ ] Changing the target chip re-runs compression immediately
- [ ] Output is under the target in BOTH decimal (1KB=1000B) and binary (1KB=1024B) terms
- [ ] "Custom" target input works (number + KB/MB toggle)
- [ ] "Keep original dimensions" switch works
- [ ] If target unreachable, shows clear error message with recovery option ("try 100KB instead →")
- [ ] Very large images (>16.7MP) are scaled down with a note in the result

### Converters (webp-to-jpg, webp-to-png, png-to-webp, jpg-to-webp, png-to-jpg, jpg-to-png):
- [ ] Conversion happens immediately on file select
- [ ] Quality slider (default 90) works for lossy outputs
- [ ] Transparent PNG→JPG shows background color picker (default white)
- [ ] `image-converter` hub: "Convert to" selector (JPG/PNG/WebP) works

### Favicon generator:
- [ ] Image mode: upload → crop with zoom slider → shape selector → download
- [ ] Text mode: 1–3 chars, font weight, text/bg color, shape, padding all work
- [ ] Emoji mode: emoji input, bg color/transparent, shape all work
- [ ] Live preview: browser tab mock (light + dark), phone home-screen icon, pixel size grid
- [ ] Download ZIP contains: favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png, site.webmanifest, README.txt
- [ ] HTML snippet is shown on page with working Copy button

---

## 2. ERROR STATES — verify all error messages display correctly

- [ ] Non-image file → shows error card with clear message
- [ ] File that can't be decoded → error with recovery suggestion
- [ ] Target size unreachable → specific error + "try next size" CTA
- [ ] Browser can't encode WebP → graceful fallback message
- [ ] Out of memory / very large image → shows warning note in result
- [ ] Too many files (>20) → error saying "maximum 20 files at once"
- [ ] Error state shows the slumped samurai mascot

---

## 3. UI / UX — visual and interaction checks

- [ ] Mobile-first: test at 360px viewport width — all tools usable with one column, big tap targets
- [ ] Desktop: test at 1280px — layout uses available space well
- [ ] Header navigation works on both mobile (hamburger) and desktop (mega nav)
- [ ] Mega nav hover shows all tools grouped by category (Compress / Convert / Favicon)
- [ ] Samurai mascot shows correct mood: idle (waiting), working (processing), success (done), error (failed), confused (404)
- [ ] Processing state shows progress bar with "Compressing…" text
- [ ] Success state shows "X MB → Y KB (Z% smaller)" with download button prominent
- [ ] No horizontal scroll on mobile
- [ ] No layout shift (CLS) during processing or result display
- [ ] Dark mode (if implemented): all colors correct
- [ ] Fonts load correctly: Lora Bold for headings, Inter for body/UI

---

## 4. SEO — check every page

For each live tool page, verify:
- [ ] `<title>` matches formula: `{Keyword} Online – Free, No Upload | Img Master` (≤60 chars)
- [ ] `<meta name="description">` is 120–155 chars, unique per page
- [ ] `<h1>` contains the primary keyword, appears above the tool
- [ ] Breadcrumb renders above H1 and links correctly
- [ ] Canonical URL is set, absolute, no trailing slash
- [ ] Open Graph tags: og:title, og:description, og:url, og:image all present
- [ ] Twitter card: `summary_large_image`
- [ ] `robots: index, follow` on all live pages, `noindex` on 404
- [ ] JSON-LD `WebApplication` structured data on tool pages (name, url, description, operatingSystem, offers.price: "0")
- [ ] JSON-LD `BreadcrumbList` on tool pages
- [ ] JSON-LD `FAQPage` matches visible FAQ content exactly
- [ ] JSON-LD `WebSite` + `Organization` on home page
- [ ] Sitemap (`/sitemap.xml`) includes all live tools, home, hubs, legal pages — no draft pages
- [ ] `robots.txt` → allow all, points to sitemap
- [ ] No duplicate title tags across pages
- [ ] Every tool page has 400–800 words of unique text below the tool
- [ ] Internal links: each tool links to its hub (breadcrumb) and 4–6 related tools
- [ ] Footer links to all category hubs and legal pages
- [ ] "Last updated {date}" shows on tool and legal pages

---

## 5. PERFORMANCE — Core Web Vitals targets (mobile, 4G)

Run Lighthouse mobile audit and verify:
- [ ] LCP < 2.0s
- [ ] CLS < 0.05
- [ ] INP < 200ms
- [ ] Lighthouse scores ≥ 95: Performance, Accessibility, Best Practices, SEO
- [ ] No hero images delaying LCP (H1 or file picker should be LCP element)
- [ ] Heavy image processing runs in a Web Worker (not blocking main thread)
- [ ] No unused JavaScript bundles loaded on tool pages
- [ ] Fonts preloaded or use `font-display: swap`

---

## 6. ACCESSIBILITY

- [ ] All interactive elements reachable by keyboard (Tab order logical)
- [ ] File drop zone has keyboard alternative (button)
- [ ] All images have `alt` text
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text (check primary red #c0392b on white)
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Error messages announced to screen readers (aria-live or role="alert")
- [ ] Progress bar has aria-valuenow, aria-valuemin, aria-valuemax
- [ ] No content relies on color alone to convey meaning

---

## 7. TRUST & LEGAL PAGES

- [ ] `/about` page: who runs the site, why it was built, how it works (browser-only, nothing uploaded), contact email (dev.moniruzzaman@gmail.com)
- [ ] `/privacy` page: no image uploads confirmed, analytics disclosure (if any), ads/cookies disclosure, contact info, "Last updated" date
- [ ] `/terms` page: short, plain English, "provided as is"
- [ ] `/contact` page: email link (no form needed)
- [ ] 404 page: samurai confused mood, helpful links to popular tools
- [ ] Privacy note appears near every upload zone: "Your images never leave your device"

---

## 8. TECHNICAL / BUILD

- [ ] `next build` completes with zero errors and zero warnings
- [ ] `output: 'export'` static build works (no server-side only APIs used)
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] All tool slugs in `lib/tools/registry.ts` with `status: 'live'` have a matching content file in `content/pages/{slug}.ts`
- [ ] `content/pages/index.ts` exports all content files
- [ ] Build fails if a live tool has no content (verify this guard exists)
- [ ] No `console.error` or unhandled promise rejections in browser console during normal use
- [ ] `localStorage` reads/writes are wrapped in try/catch (test in private/incognito)
- [ ] Web Share API calls are guarded with `navigator.canShare` check
- [ ] No hardcoded localhost URLs anywhere in production code
- [ ] `siteConfig.url` is set to the production domain (not localhost)
- [ ] All `hreflang`, `canonical`, sitemap, and OG URLs use the production domain

---

## 9. CROSS-BROWSER QUICK CHECK

- [ ] Chrome (latest) — all tools work
- [ ] Firefox (latest) — all tools work
- [ ] Safari (latest on iOS) — test HEIC input (Safari decodes it natively), Web Share API
- [ ] Samsung Internet (Android) — file picker and download work

---

## FINAL REPORT

After completing every check, output a table:

| Area | Status | Issues Found | Fixed |
|---|---|---|---|
| Batch limit (20 files) | | | |
| Core functionality | | | |
| Error states | | | |
| UI / UX | | | |
| SEO | | | |
| Performance | | | |
| Accessibility | | | |
| Trust pages | | | |
| Technical / Build | | | |
| Cross-browser | | | |

List every issue found with the file and line number. Mark each as FIXED or NEEDS MANUAL TEST.