# Img Master: "Ink Samurai" redesign (design)

Date: 2026-10-24 · Status: draft for owner approval · Owner: Md Moniruzzaman

## 1. Intent and why

Img Master works, but it looks like every other image tool. The owner wants a site people **remember and come back to by name**: a calm, trustworthy brand built around one character, an ancient Japanese samurai who "cuts your image down to size" with his sword. Using the tool should feel like watching a master at work: quiet, precise, a little delightful. The tool itself must stay as fast, private and simple as it is today.

Brand feeling: **trustworthy craft, quiet confidence, a little delight.** Ancient Japan (sumi-e ink, red sun, paper) meets modern utility (clean, minimal, fast). No wasted movement.

## 2. Goals

1. A distinct visual identity: warm paper, ink black, crimson, a touch of gold, Noto Serif headings.
2. A samurai character in **sumi-e ink-silhouette style** whose motion is **traced from real video**, not hand-drawn puppets, and who reacts to what the user does (idle, working, success, error).
3. Processing feedback that feels like a sword cut (red slash), replacing spinners.
4. A memorable favicon moment: the samurai cuts the user's tile into ink shards that pull together into a tiny favicon.
5. Optional, off-by-default sword sounds.
6. Keep every existing promise: mobile first, tool first, static HTML, SEO text unchanged, privacy, performance budget.

## 3. Non-goals

- No change to any engine or function logic: `lib/image-engine/`, `lib/tools/registry.ts`, `lib/types.ts` are not touched. ToolShell/FaviconShell state logic stays; only what they render changes.
- No rewrite of page text in `content/` (SEO sections are restyled only).
- No new npm dependency. No animation library, no component library.
- No dark mode (still light only).
- No speech bubbles, no talking samurai, no mascot pop-ups.

## 4. Anti-goals (would be a failure even if it "works")

- Looks like AI slop or clip-art: stiff hand-drawn shapes, generic gradients, stock photos.
- The samurai pushes the "Choose images" button or privacy line below the fold at 360×640.
- Animation that delays the result, blocks the download, or loops forever when the user wants to leave.
- Any image data or user file leaving the device; any runtime call to an external host (fonts included).
- Lighthouse mobile drops below 95 in any category, or our first-load JS on a tool page goes over 30 KB gzipped.
- Using the owner's `ref/` artwork in the build (most of it is third-party stock art).

## 5. Constraints (from CLAUDE.md and docs, unchanged)

- Mobile first at 360px; tool first (H1, samurai, picker button and privacy line visible at 360×640).
- Static HTML; all text in HTML.
- Lighthouse mobile ≥ 95 every category (the owner's draft said 90; the project's hard gate of 95 stays). Own first-load JS ≤ 30 KB gz.
- `localStorage` always in try/catch. `prefers-reduced-motion` respected.
- WCAG AA contrast, 48px tap targets, focus rings, axe clean.
- File ownership rules (lead / ui-builder / seo-content / qa-reviewer) and commit conventions stay.

## 6. Decided by the owner

| Decision | Owner's choice |
|---|---|
| Character style | **A. Ink silhouette (sumi-e)** on a red sun, chosen over flat-vector and chibi |
| Motion | Must be realistic: traced from real footage, not hand-animated SVG ("those feel AI slop") |
| Source footage | Free assets from Pixabay / Unsplash are OK; owner approved the traced-video mockup ("look good") |
| Two figures | Home hero and 404: ronin (back view, straw hat) in mist. Tool and favicon pages: kendo swordsman. Two sprites. (Shown in the mockup, accepted with "look good") |
| Favicon moment | Cut tile → ink shards → tiny favicon pops into the tab preview ("go ahead and do it") |
| Palette, fonts, layouts, sound idea, SEO sections, "what not to do", acceptance criteria | From the owner's pasted spec (sections 1–12), with the adjustments in §13 |

## 7. Visual system

### 7.1 Tokens (replace the token block in `app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1a1212` | Main text, silhouettes |
| `--steel` | `#2d3748` | Headings, logo |
| `--crimson` | `#c0392b` | Primary buttons, links, red sun, slash, focus ring |
| `--crimson-hover` | `#a93226` | Hover/pressed |
| `--gold` | `#c9a84c` | Selected chip border, small accents only (never text on paper: fails contrast) |
| `--gold-tint` | `#fbf4e2` | Selected chip fill |
| `--paper` | `#faf8f4` | Page background |
| `--paper-dark` | `#f0ece4` | Section backgrounds, progress track |
| `--card` | `#ffffff` | Tool card, result card |
| `--border` | `#e2ddd6` | Card borders, dividers |
| `--border-strong` | ≥ 3:1 on paper (e.g. `#8f877d`) | Input / chip / switch outlines |
| `--muted` | `#6b6560` | Subtitles, captions, privacy line (check AA on paper; darken if needed) |
| `--danger` | `#b42318` | Error text only |

Keep the existing Tailwind theme mapping pattern (components use token names, never hex). The favicon preview's `.pin-light` / `.pin-dark` browser mocks stay. `themeColor` becomes `#faf8f4`.

### 7.2 Type

- Headings, logo: **Noto Serif** 400/700 via `next/font/google` (self-hosted at build, so no runtime request to Google). `display: swap`, Latin subset only.
- Body: existing system stack (keeps Bangla fallback).
- Sizes: keep the DESIGN.md scale; H1 24/30 mobile in Noto Serif bold, `--steel`.

### 7.3 Shape and surface

Radius 10px cards, 6px buttons, chips fully round. **No shadows, no gradients** (the hero's ink-wash hills are blurred SVG shapes in flat ink at low opacity, not CSS gradients). Borders separate things.

### 7.4 Ink texture

One shared SVG filter (`feTurbulence` + `feDisplacementMap`, scale ≈ 2) gives silhouettes and brush strokes slightly rough edges. Small decorative brush marks are allowed only where they carry meaning: the ground stroke under the samurai, the active-nav underline, the result "↓".

### 7.5 Logo

"Img Master" in Noto Serif bold, `--steel`, with a small crimson square seal (hanko) showing 画 ("picture") to its left. The seal is an inline SVG, decorative (`aria-hidden`), the text is the accessible name. *(Builder's/lead's call to drop if it reads poorly at 16px.)*

## 8. The samurai

### 8.1 Asset pipeline (one-time, offline)

1. Source clips (Pixabay Content License: free for commercial use, modification allowed, no attribution required):
   - Tool samurai: **"Kendo, Shinai, Teacher"**, Pixabay video 315583.
   - Hero ronin: Pixabay video 339449 (Pixabay's auto title is "Ninja, Warrior, Weapon"; the footage is a back-view swordsman in a straw hat and hakama, sword at the hip).
   Record both source URLs and the license note in `public/samurai/SOURCES.md`.
2. Extract frames → cut out the person with a human-segmentation model (rembg `u2net_human_seg`) → add the sword by colour (wooden shinai / dark scabbard) near the person → keep large components → black-on-white mask.
3. Crop all frames of one character to a **shared bounding box** (so the figure never jumps), scale to 200px tall (tool) / 260px (hero).
4. Trace each frame with potrace into one SVG path. ≈ 1.7 KB per frame.
5. Output one sprite file per character: `public/samurai/kendo.svg`, `public/samurai/ronin.svg`, each holding `<symbol id="f0">…` per frame plus the shared ink filter.

The pipeline script lives in `scripts/samurai/` (Python, run by hand; **not** part of `npm run build`, not an npm dependency) with a README listing the exact frames used. The prototype pipeline exists in the session scratchpad and is to be copied in, not rewritten.

### 8.2 Frame sets (tool samurai, from clip 315583 at 8 fps sampling)

| State | Frames (index in extracted sequence) | Playback |
|---|---|---|
| `idle` | 0, 2, 4, 6 ping-pong (on guard, weight shifts) | ~320 ms/frame, loops |
| `working` | 11–19 (raise, cut, recover) | ~95 ms/frame, loops while processing; red slash fires on the down-cut frame (15) |
| `success` | 19 → 38, 39, 40, 41 (lowers sword, stands tall), holds last | ~130 ms/frame, once |
| `error` | 0 → 77, 78 (drops to one knee), holds last | ~160 ms/frame, once |

Hero ronin (clip 339449): all 37 frames (every 2nd), played once ~85 ms/frame ("rolls up sleeves"), then rests on frame 0 for 5 s, repeats. Pauses when the tab is hidden or the hero is off-screen.

The builder may swap individual frames if a traced frame looks wrong at final size, but must keep these motions.

### 8.3 Component: `components/samurai/samurai.tsx` (client)

- Props: `state: 'idle' | 'working' | 'success' | 'error'`, `character?: 'kendo' | 'ronin'`, `size`.
- Renders `<svg aria-hidden="true"><circle (red sun)/><path (ground stroke)/><use href="/samurai/kendo.svg#fN" filter="url(#ink)"/></svg>`; a tiny `requestAnimationFrame`/interval swaps `N`. Frame data is **not** in JS (keeps JS budget); the sprite SVG is a cached static file.
- Fixed box size reserved in CSS before the sprite loads (no CLS). First paint shows the red sun and ground stroke; the figure appears when the sprite loads.
- `prefers-reduced-motion`: no frame cycling, no slash; each state shows one representative still (idle f0, working f15, success f41, error f78).
- Stops all timers when unmounted or the document is hidden.

### 8.4 Placement

- **Mobile (< 640px):** a fixed-height samurai stage (~150px) at the top of the tool card, centered. It never moves. Below it, the picker block (button, privacy line, chips, More options) is **replaced in place** by the results when processing finishes, as in the owner's "result card replaces tool area" sketch: the samurai stays at the top of the card, and the result card sits right under him. "Compress another" (existing link) brings the picker block back. The hidden `<input type="file">` stays mounted the whole time (e2e uses it). The existing results min-height reservation keeps CLS < 0.05. Must fit the fold rule.
- **Desktop (≥ 640px):** sits at the right side of the tool card, `position: sticky` within the tool container, larger (~200px), so the picker keeps the full left column.
- He never covers text or controls.

## 9. Tool page behaviour (ToolShell rendering only)

State mapping (from existing ToolShell state, no logic change):

| ToolShell | Samurai | Card |
|---|---|---|
| idle (no files) | idle | Picker, privacy line, options |
| processing | working | Red slash sweeps across the card on each cut; picker/options dim to 25%; existing ProgressBar and existing progress text ("Compressing photo n of m…") |
| done, all ok | success | Result cards fade in (150 ms) |
| partial | success | Failed cards show their existing messages |
| error / all failed | error | Error card: Noto Serif 18px title, existing message, crimson "Try again" |

- **Slash:** 2px crimson line, slight angle, scales left→right in ~220 ms then fades; fires in sync with the down-cut frame. Pure CSS animation triggered by a class.
- No spinner anywhere. Existing skeletons may stay inside result cards.
- Focus, live-region announcements, test hooks (`data-testid`, `data-*`) all stay exactly as today.
- Animation never delays results. **Every run shows at least one full strike with its slash:** results render the moment they're ready, while the samurai finishes the current stroke (slash included) on top and then moves to success. A fast job (≈ 200 ms) still gets one ~0.85 s stroke; the result card is already usable during it.

Restyle (not rewrite) every tool and UI component to the new tokens: Button (crimson primary, outlined secondary), chips (gold selected), FilePicker (crimson 56px button; desktop dashed drop zone in `--border-strong`), ResultCard ("↓" in crimson, bold tabular numbers), ErrorBanner, Switch, Slider, Sheet, Toast, ProgressBar (ink fill on paper-dark track).

## 10. Favicon moment (favicon-generator, -from-text, -from-emoji, png-to-ico)

FaviconShell rebuilds its preview live (150 ms debounce), so "made" happens on load and on every edit. The moment therefore has explicit triggers:

- **Image mode (favicon-generator):** each time the user picks a new file, on its first finished build.
- **Text and emoji modes:** the first finished build after the user's first edit on that page visit (not the default "A" built on load). Later edits update the preview normally, with no replay.
- **Download ZIP click** never replays it and never waits for it.
- **png-to-ico** is a batch tool (ToolShell-like, no tab mock): it gets the normal samurai states (idle / working / success / error) only, no cut-to-icon moment.

Outside the moment, favicon pages show the samurai stage (idle) at the top of the FaviconShell card, same as tool pages; the fold rule there is H1 + samurai + the first control (picker on favicon-generator, the text/emoji input on the other two).

Sequence:

1. The source preview tile (user's cropped image / text / emoji) is shown large in the samurai's card.
2. Samurai plays the working strike twice; two red slashes cross the tile (X).
3. The tile splits into 6–8 ink shards (CSS `clip-path` polygons on copies of the tile) that fly out a little, then pull inward and scale down into a 32px icon (~600 ms, transforms + opacity only).
4. The tiny icon "pops" (scale 0.5 → 1.0, 300 ms ease-out) into the browser-tab preview in FaviconPreview; samurai goes to success.
5. Total ≤ 1.4 s. Live preview while editing options does **not** replay it; only the generate/download-ready moment does. Reduced motion: skip to step 4 without motion.

Implemented in `components/favicon/` with CSS; no change to favicon engine calls.

## 11. Sound (optional, off by default)

- `lib/site-config.ts`: add `soundEnabled: false` (default for new visitors).
- Header: icon-only toggle button (speaker / speaker-off), 48×48, `aria-label="Sound on"/"Sound off"`, `aria-pressed`. Preference in `localStorage` (try/catch).
- Sounds loaded lazily with the Web Audio API on first use after the user turns sound on; never preloaded. Played at low volume (~0.35).
- Files copied (and trimmed/re-encoded to ≤ 50 KB each, mono, short) into `public/sounds/` from the owner's `ref/sword sound/` (all Pixabay sound effects):

| Moment | Source file | Trim |
|---|---|---|
| Processing start | `oxidvideos-sword-swing-sfx-407574.mp3` (36 KB) | as is or ≤ 0.6 s |
| Success | `freesound_community-draw-sword1-44724.mp3` (35 KB), a sheathe/"shing" instead of a generic ding | ≤ 0.8 s |
| Error | `freesound_community-sword-thud-47635.mp3` (166 KB) | trim to the first thud, ≤ 50 KB |

If a file can't be trimmed cleanly, use `dragon-studio-sword-clashhit-393837.mp3` (35 KB) for error. Record sources in `public/sounds/SOURCES.md`.

## 12. Page layouts

### 12.1 Header and footer

- Header 52px, white, 1px bottom border, not sticky. Left: seal + "Img Master" (Noto Serif). Right: sound toggle + hamburger (mobile) / text links Compress · Convert · Favicons · About (desktop), active link gets a short crimson brush underline.
- Mobile menu slides down under the header (not a full overlay), white, stacked links grouped as today, closes on outside tap and Esc; still works without JS (links in static HTML).
- Footer: "© 2026 Img Master · Built by Softwara" + Privacy · Terms · Contact. One line on mobile if it fits, two otherwise. No social icons.

### 12.2 Tool page (360px)

Header → H1 (Noto Serif 24px, steel) → one subtitle line (muted) → tool card [samurai (idle) → crimson "Choose images" 56px → privacy line → target chips → More options] → results replace in place → breadcrumbs → related tools → How-to → Why → FAQ (`<details>`) → footer. SEO sections restyled only; order and text unchanged.

### 12.3 Home page

- Hero (above the fold at 360px): H1 and subtitle from existing `content/home.ts` (text not rewritten), three category chips with gold border (Compress, Convert, Favicon) linking to the category groups/hubs, and the **ronin scene**: red sun, ink-wash hills, dark rock, ronin silhouette (≈ 300px tall) at the right/bottom. On desktop the scene sits to the right of the text.
- Below: tool grid (1 → 2 → 3 columns), cards with name, one line, small crimson arrow; no icons, no shadows. Then existing "How it works" and FAQ.

### 12.4 Other pages

- Legal pages: paper background, Noto Serif headings, reading width; no samurai.
- 404: the ronin, still, with "This page doesn't exist" and the tool grid.

## 13. My calls (lead), where the owner's spec conflicted with project rules or was silent

1. Lighthouse gate stays **95**, not 90.
2. Noto Serif via `next/font` (self-hosted), satisfying "no external fetch".
3. "No decorative hero images" is read as "no stock photos"; the ronin scene is the brand character drawn as inline/sprite SVG, which the owner asked for.
4. Progress text keeps the existing copy ("Compressing photo n of m…") for second-language readers; no new "cutting" wording.
5. Success sound is a sword sheathe, not a "ding".
6. Samurai frame data lives in static sprite SVGs, not JS, to protect the 30 KB JS budget.
7. `docs/DESIGN.md` gets rewritten to match this design (principles: decoration now allowed only as the samurai, ink marks and the slash; one web font allowed; motion rules).
8. `.superpowers/` added to `.gitignore`.
9. Owner's `ref/` folder stays out of git (it holds third-party art); only derived, Pixabay-sourced assets ship.

10. Fast jobs still show one full strike and slash, without delaying results (§9).
11. Mobile layout after processing: samurai stays at the top of the card, results replace the picker block in place (§8.4).
12. Favicon moment triggers: new file (image mode), first edit (text/emoji); png-to-ico gets normal states only (§10).
13. Where this spec and existing e2e tests disagree on small wording/layout, the current behaviour wins: footer stays two lines, desktop nav keeps "Favicon" (singular). qa-reviewer updates only tests that the redesign intentionally changes (e.g. picker block hidden after results, new colours).
14. 404 and footer copy unchanged.

## 14. Open questions for the owner

None open. The builder check raised seven points; all were settled by the conversation or as lead calls above (items 10–14).

## 15. Left to the builder

- Exact pixel sizes, spacing and timing within the ranges above.
- Which individual frames to drop or swap if a trace looks wrong at size.
- Shard polygon shapes and easing for the favicon moment.
- Hamburger/sound icon drawings (inline SVG, `currentColor`).
- How the slash is synced to the frame (class toggle on frame index is fine).

## 16. Acceptance criteria

1. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
2. At 360×640: H1, samurai, "Choose images" and privacy line visible without scrolling on every tool page; on home, H1, subtitle and category chips visible.
3. Samurai visibly changes between idle / working / success / error; the slash plays during processing; the favicon cut-to-icon moment plays on generate.
4. Reduced motion: no frame cycling, no slash, no shards; correct still poses.
5. Lighthouse mobile ≥ 95 in all categories on home and `/compress-image-to-50kb`; own first-load JS ≤ 30 KB gz; CLS < 0.05.
6. No new network requests to external hosts (verified in the e2e privacy check); sounds fetched only after the user turns sound on.
7. Existing e2e tests pass (test hooks unchanged); axe: zero serious/critical.
8. SEO text in built HTML is byte-identical in content to before (headings, paragraphs, FAQs).
9. Screenshots of `/compress-image-to-50kb` at 360px (idle and result), plus a list of every file created or changed.
