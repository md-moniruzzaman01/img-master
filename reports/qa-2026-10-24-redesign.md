# QA report: redesign (commit ecf9481), 2026-10-24

## 1. Summary

Tests were updated to the new design (see section 5) and run in mobile Chromium and mobile WebKit against the current `out/`. Full run: 688 tests, 607 passed, 54 skipped (browser-specific), 27 failed. After fixing stale test assumptions, a re-run of every affected test passed (44/44). The only remaining red items are the known placeholder site URL (`seo.spec.ts` "site URL is a real domain", Chromium and WebKit) and the Lighthouse performance assertion.

| Area | Result |
|---|---|
| Privacy (no uploads, no off-origin requests) | PASS |
| Tools work (compress, convert, batch, ZIP, favicon) | PASS |
| Mobile UX at 360x640 (fold, tap targets, no h-scroll, header 52px, menu, footer, privacy line, picker 52px full width) | PASS |
| Accessibility (axe, light only, keyboard menu pass) | PASS, zero serious/critical |
| Redesign rules (flat cards, allowed colours, single-result Download in view) | PASS (see QA-17 on greys) |
| SEO and content | PASS except placeholder site URL (QA-14, known, pre-launch) |
| Performance (Lighthouse >= 95 each category) | FAIL on performance only (0.86 to 0.94); other three categories 1.00 on every run |
| JS budget (ours <= 30 KB gz) | PASS, 23.1 KB |

Verdict: ship-ready on function, accessibility, SEO and privacy. Not meeting the Lighthouse performance >= 95 target on this host (unchanged in kind from QA-02; scores improved by about 0.03 to 0.05 since the last report).

## 2. Issues (IDs continue from QA-13)

| ID | Severity | Area | Page | What happens | Expected | Reproduce | Owner |
|---|---|---|---|---|---|---|---|
| QA-14 | Medium (pre-launch) | SEO | site-wide | `siteConfig.url` is still `https://img-master.example`. Canonicals, sitemap and OG use it. | Real domain. | `seo.spec.ts` "site URL is a real domain" | lead |
| QA-15 | Medium | Performance | all 7 audited pages | Lighthouse mobile performance 0.86 to 0.94 (median per page: 0.94, 0.93, 0.90, 0.92, 0.91, 0.90, 0.90), target 0.95. LCP 2.35 to 2.73 s, TBT 228 to 331 ms, CLS 0. Static HTML, 23 KB our JS, 133 KB framework. Framework JS dominates TBT. Unconfirmed on Cloudflare. | >= 0.95 | `npm run lhci` | lead |
| QA-16 | Low | Design (desktop 1280) | tool page after result | Results column is 640px wide and starts at x=320, but breadcrumbs, Related tools and content start at x=300 and are 680 wide. Left edges do not line up. | One left edge. | Pick a file on `/compress-image-to-50kb` at 1280 | ui-builder |
| QA-17 | Low | Design | tool pages | Brief lists only #FFFFFF/#F5F5F5/blues as backgrounds, but the switch knob uses `#8A8A8A` and skeleton bars and favicon preview rows use `#E0E0E0` (both are tokens). The favicon preview also uses `#2B2B2B`/`#1A1A1A` on purpose (mock dark tab). Treated as allowed; update DESIGN.md or confirm. | Doc matches code. | `redesign.spec.ts` colour scan | lead |
| QA-18 | Low | Design (360) | all tool pages | Empty reserved results area leaves about 220px of blank space between the options and Breadcrumbs/Related tools before a file is picked, so the page looks unfinished and Related tools starts far down. This is the intended anti-layout-shift reservation. | Optional: smaller reservation or a light hint. | `/compress-image-to-50kb` at 360 | ui-builder |
| QA-19 | Low | Design (360) | `/favicon-generator` | Empty-state text "Choose an image to see your icon." is drawn over the placeholder tiles (Home screen, Real sizes) and overlaps them; the preview is faded and the Download ZIP button under it is only partly above the fold. | Text on a clean area. | `/favicon-generator` at 360 | ui-builder |
| QA-20 | Low | Design | tool pages | The privacy line uses a colour emoji lock, the only coloured glyph on a strictly blue/grey site. | Optional: monochrome SVG icon. | any tool page | ui-builder |
| QA-21 | Low | Test flake | WebKit `/favicon-from-emoji` | `emoji mode: pasting two emoji` failed once in the full parallel run (`toHaveValue`), passed 6/6 alone. Likely `fill` before hydration under load. | Stable. | full WebKit run | qa (test) |
| QA-22 | Low | Menu | mobile | The open menu is full-height and scrolls; Favicon tools and info pages are below the fold with no scroll hint. Works (tested), just less discoverable. | Optional hint. | open menu at 360x640 | ui-builder |

Redesign grade: clean, consistent and on-brand at 360 and 1280 (white, one blue, flat bordered cards, big blue picker). Nothing broken or cramped. Items above are polish only.

### Verified in the new design
- Header height <= 52px and not sticky on all 26 pages; menu is a native `<details>` with `summary[aria-label=Menu]`, 22 links (18 tools and 4 info pages) in server HTML, opens, Esc closes and returns focus, closes on link tap and outside tap, opening it does not move the page; keyboard Tab reaches all 22 links (Chromium).
- Desktop 1280: no menu button; links Compress, Convert, Favicon, About, all 48px tall and resolving.
- Footer: exactly the copyright line and Privacy, Terms, Contact (no tool list, no About) on four sampled pages; and in server HTML of all tool pages.
- Privacy line on all 18 tool pages, bottom edge <= 248px (limit 640), directly after the picker button as the next visible element; picker 328px wide (full width) and 52px tall.
- Cards: computed `box-shadow: none` everywhere on sampled pages; backgrounds only allowed colours; red only in error UI.
- Single result: one card Download in the viewport (fully) at 360x640 after processing, downloads the right file name; no batch button; 2 results give 2 Downloads plus one Download all; no fixed/sticky elements except the pointer-less toast.

## 3. Metrics

Lighthouse (`npm run lhci`, 3 runs, mobile preset). Accessibility, Best Practices, SEO: 1.00 on all 21 runs. Medians of LCP, FCP, TBT, CLS, with benchmarkIndex:

| Page | Performance (3 runs) | LCP | FCP | TBT | CLS | benchmarkIndex |
|---|---|---|---|---|---|---|
| `/` | 0.94 / 0.92 / 0.94 | 2352 ms | 846 ms | 237 ms | 0 | 1141 / 1133 / 1136 |
| `/compress-image` | 0.93 / 0.93 / 0.94 | 2436 ms | 958 ms | 228 ms | 0 | 1130 / 1109 / 1132 |
| `/compress-image-to-50kb` | 0.92 / 0.90 / 0.89 | 2536 ms | 929 ms | 305 ms | 0 | 1131 / 1148 / 1131 |
| `/image-converter` | 0.92 / 0.91 / 0.92 | 2357 ms | 917 ms | 278 ms | 0 | 1116 / 1118 / 1106 |
| `/webp-to-jpg` | 0.94 / 0.91 / 0.91 | 2385 ms | 914 ms | 301 ms | 0 | 1109 / 1149 / 1125 |
| `/favicon-generator` | 0.86 / 0.90 / 0.90 | 2731 ms | 1094 ms | 275 ms | 0 | 1083 / 1134 / 1119 |
| `/png-to-ico` | 0.90 / 0.90 / 0.92 | 2364 ms | 908 ms | 331 ms | 0 | 1101 / 1132 / 1112 |

First-load JS, gzipped (Chromium): our code 23.1 KB on every page (budget 30 KB, PASS; was 23.5 KB). Framework 133.1 KB (138.1 KB on the text and emoji favicon pages). Lazy engine chunks: 0 (most pages), 2.6 KB (`/favicon-generator`), 12.4 KB (text and emoji pages). Total fetched 156.2 KB, 158.7 KB, 173.6 KB.

## 4. What I could not test

- Real iOS Safari and Android Chrome (WebKit here is Playwright WebKit on Windows, main-thread engine path).
- Lighthouse on Cloudflare or PageSpeed Insights.
- Real photos (`e2e/fixtures/real/` is empty) and throttled benchmarks (not requested).
- "Outside tap" was tested with a mouse click on the header bar (the open panel covers the whole page at 360x640), not a real touch.
- Screenshots reviewed: 360 home, tool page (empty, with result), menu, favicon page; 1280 tool page with result. Other pages only through automated checks.

## 5. Test files changed

- `e2e/a11y.spec.ts`: dark loop removed; menu step replaces Tools sheet; keyboard test now covers skip link and menu (open, Tab reaches 22 links, Esc, focus return).
- `e2e/favicon-ux.spec.ts`: removed breadcrumbs-above-H1 and sticky-bar tests (replaced by "no sticky bar, downloads/snippet/footer reachable"); menu replaces Tools sheet/footer lists; dark loop removed; mode tabs now expected after privacy line; Download ZIP Tab path updated; closed `<details>` content skipped in tap-target scan.
- `e2e/favicon-output.spec.ts`: `download-zip` is now always present and disabled when empty (was count 0).
- `e2e/mobile-ux.spec.ts`: action-bar tests replaced with per-card Download, `download-all` and no fixed/sticky checks; Tools sheet test replaced by menu test; closed-details skip.
- `e2e/seo.spec.ts`: footer has exactly Privacy/Terms/Contact, About and all tools in the header menu; new privacy text.
- `e2e/js-budget.spec.ts`: OURS patterns updated.
- `e2e/redesign.spec.ts`: new (header, menu, footer, picker and privacy order, flat/colours, single result, home H1).
