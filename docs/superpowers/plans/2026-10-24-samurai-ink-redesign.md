# Ink Samurai Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin Img Master as the "Ink Samurai" brand (paper, ink, crimson, Noto Serif) with a video-traced ink samurai who reacts to tool state, a sword-slash loading effect, a favicon cut-to-icon moment and optional sword sounds, without touching any engine or function logic.

**Architecture:** Samurai frames are traced offline into two static SVG sprite files (`<symbol>` per frame); a small client component flips `<use href>` between frames, driven by pure, unit-tested timeline/state helpers. ToolShell and FaviconShell keep their logic and only render the samurai stage, slash and new layout. Tokens keep their existing semantic names (so components barely change) with new values plus a few new tokens.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, Tailwind 4, TypeScript strict, Vitest (node env), Playwright. Offline asset pipeline: Python 3.14 venv (opencv-python-headless, rembg, potracer, imageio-ffmpeg), not part of the npm build.

**Spec:** `docs/superpowers/specs/2026-10-24-samurai-ink-redesign-design.md` (read it with this plan).

## Global Constraints

- Do not modify `lib/image-engine/**`, `lib/tools/registry.ts`, `lib/types.ts`, or any engine call / state logic in ToolShell and FaviconShell. Rendering only.
- No new npm dependency (runtime or dev). Python tools live only in the scratch venv and `scripts/samurai/` docs.
- Page text in `content/**` is not rewritten. Microcopy in `components/tool/copy.ts` stays (progress text remains "Compressing photo n of m…").
- Mobile first at 360px. At 360×640: H1, samurai stage, "Choose images" button and privacy line visible on every tool page.
- Lighthouse mobile ≥ 95 every category; own first-load JS on a tool page ≤ 30 KB gzipped (`e2e/js-budget.spec.ts`); CLS < 0.05.
- No runtime request to any external host. Noto Serif via `next/font/google` (self-hosted at build). Sounds fetched only after the user turns sound on.
- No shadows, no CSS gradients, no stock photos, no spinner, no speech bubbles.
- `prefers-reduced-motion: reduce` → no frame cycling, no slash, no shards; one still pose per state.
- Every `localStorage` access in try/catch.
- Components use Tailwind token names, never raw hex (SVG fills in sprite files and the hero scene may use `currentColor` or CSS variables).
- Existing test hooks stay: `data-testid` (`tool-shell`, `file-picker`, `file-input`, `result-card`, `download`, `download-all`, `favicon-shell`, `download-zip`, `download-ico`, `results-placeholder`, `privacy-note`) and all `data-*` attributes on ResultCard / shells.
- File ownership (CLAUDE.md): lead → `app/**` wiring, `lib/site-config.ts`, `docs/**`, `scripts/samurai/**`, `public/samurai/**`, `public/sounds/**`; ui-builder → `components/**`, `app/globals.css`; qa-reviewer → `e2e/**`, `reports/**`. Only the lead runs git; "Commit" steps are run by the lead after reviewing the task.
- Header ≤ 52px, not sticky. Footer stays two lines; desktop nav stays `Compress, Convert, Favicon, About`.

## Review Focus

1. **Picking again while the success or error pose is still playing.** The samurai restarts cleanly at `working`, with no stuck frame and no doubled timers. Test: Task 3, `timeline restarts on new working request`.
2. **The sprite fails to load (offline, 404 or blocked).** The page still works, the stage keeps its size (no CLS), and only the red sun and ground stroke show. Test: Task 4, e2e `samurai sprite 404 keeps layout`.
3. **The tab is hidden or the page is left mid-animation.** Timers stop, nothing throws after unmount, and the hero loop pauses off-screen. Test: Task 3, `stops when stopped`, plus a Task 4 unmount check in e2e.
4. **Typing fast in the text or emoji favicon tool.** The cut moment plays once per page visit (first edit), never per keystroke, and never delays the download. Test: Task 7, `cutReducer` cases.
5. **Turning sound on, with browser autoplay rules.** The first sound plays only after the user taps the toggle. With sound off, no sound file is requested. A failed decode is silent and never throws. Test: Task 8, e2e `no sound requests while off` and unit `getSoundPref default/false on storage error`.

---

## File Structure

```
scripts/samurai/            README.md, ext.py, seg.py, ink.py, trace.py, sprite.py   (lead; offline)
public/samurai/             kendo.svg, ronin.svg, SOURCES.md                          (lead)
public/sounds/              start.mp3, success.mp3, error.mp3, SOURCES.md              (lead)
components/samurai/
  frames.ts                 frame sets + sprite metadata (pure data)
  timeline.ts               pure frame/state scheduler
  samurai.tsx               client component: <svg><use href=sprite#fN>
  samurai-stage.tsx         fixed-size stage wrapper (sun, ground stroke, slot) + slash
  slash.tsx                 the red slash line (CSS animation)
  ink-defs.tsx              shared <filter id="ink"> SVG defs
  __tests__/timeline.test.ts
components/sound/
  sound.ts                  prefs + lazy Web Audio playback
  sound-toggle.tsx          header icon button (client)
  __tests__/sound.test.ts
components/favicon/
  cut-moment.ts             pure cutReducer
  cut-moment.tsx            shards → icon animation (client)
  __tests__/cut-moment.test.ts
components/home/
  hero-scene.tsx            ronin scene (sun, ink hills, rock, ronin samurai)
  home-hero.tsx             (modify) layout with scene + category chips
components/layout/
  brand-seal.tsx            画 seal SVG
  site-header.tsx, menu-disclosure.tsx, site-footer.tsx   (modify)
app/globals.css             tokens, Tailwind theme, keyframes, reduced-motion
app/layout.tsx              Noto Serif font, themeColor
lib/site-config.ts          soundEnabled: false
docs/DESIGN.md              rewritten for the new system
```

---

### Task 1: Samurai asset pipeline and sprites (lead)

**Files:**
- Create: `scripts/samurai/README.md`, `scripts/samurai/{ext,seg,ink,trace,sprite}.py` (copied from the scratchpad prototype: `ext.py`, `seg.py`, `ink.py`, `trace.py` with the `~c` fix; new `sprite.py`)
- Create: `public/samurai/kendo.svg`, `public/samurai/ronin.svg`, `public/samurai/SOURCES.md`
- Test: `components/samurai/__tests__/sprites.test.ts`

**Interfaces:**
- Produces: `kendo.svg` with `<symbol id="k0">…<symbol id="k18">`, one shared `viewBox="0 0 271 200"`, in this order (source frame index from clip 315583 extracted at step 3): `0,2,4,6,11,12,13,14,15,16,17,18,19,38,39,40,41,77,78`. `ronin.svg` with `<symbol id="r0">…<symbol id="r36">`, `viewBox="0 0 165 260"`, source frames `0,2,…,72` of clip 339449 (step 2). Each symbol holds a single `<path fill="currentColor">`. No filter inside the sprite.

- [ ] **Step 1: Write the failing test** `sprites.test.ts` (reads files with `node:fs`):
  - `kendo sprite has symbols k0..k18 with viewBox 0 0 271 200` (counts `id="k\d+"` = 19, and that every symbol has `viewBox="0 0 271 200"`)
  - `ronin sprite has symbols r0..r36 with viewBox 0 0 165 260` (count 37)
  - `sprites are small`: `kendo.svg` ≤ 40_000 bytes, `ronin.svg` ≤ 75_000 bytes
  - `sprites use currentColor and contain no filter, script or external href`
- [ ] **Step 2: Run** `npx vitest run components/samurai/__tests__/sprites.test.ts` → FAIL (files missing). (`vitest.config.ts` already includes `components/**/__tests__/**/*.test.ts`.)
- [ ] **Step 3: Copy the prototype scripts into `scripts/samurai/` and add `sprite.py`**: `sprite.py <json> <prefix> <out.svg>` writes `<svg xmlns="http://www.w3.org/2000/svg">` with one `<symbol id="{prefix}{i}" viewBox="0 0 {w} {h}"><path fill="currentColor" d="…"/></symbol>` per path from the trace JSON. README lists: venv setup (`opencv-python-headless potracer rembg[cpu] numpy pillow imageio-ffmpeg`), `NUMBA_DISABLE_JIT=1`, the exact commands and frame lists above, and the Pixabay source URLs.
- [ ] **Step 4: Generate** from the scratchpad (`tr/all.json` → `kendo.svg` prefix `k`; `tr/hero.json` → `ronin.svg` prefix `r`). Write `SOURCES.md`: Pixabay video 315583 `https://pixabay.com/videos/kendo-shinai-teacher-japanese-315583/`, video 339449 `https://pixabay.com/videos/ninja-warrior-weapon-samurai-339449/`, "Pixabay Content License: free commercial use, modification allowed, no attribution required. Traced silhouettes derived from these clips."
- [ ] **Step 5: Run** the test → PASS.
- [ ] **Step 6: Commit** `feat: traced ink samurai sprites and offline pipeline`.

---

### Task 2: Tokens, font and base styles (ui-builder: globals.css; lead: layout.tsx, site-config)

**Files:**
- Modify: `app/globals.css` (token block, theme mapping, base, keyframes)
- Modify: `app/layout.tsx` (Noto Serif, `themeColor: '#faf8f4'`, body class)
- Modify: `lib/site-config.ts` (add `soundEnabled: false`)

**Interfaces:**
- Produces CSS variables (existing names kept, new values): `--bg: #faf8f4` (paper, page), `--surface: #f0ece4` (paper-dark), `--border: #e2ddd6`, `--border-strong` (≥ 3:1 on `#faf8f4`, start `#8f877d`, verify), `--text: #1a1212`, `--text-muted: #6b6560` (darken if < 4.5:1 on `#faf8f4`), `--primary: #c0392b`, `--primary-hover: #a93226`, `--on-primary: #ffffff`, `--danger: #b42318`, `--focus: #c0392b`. New: `--card: #ffffff`, `--steel: #2d3748`, `--gold: #c9a84c`, `--gold-tint: #fbf4e2`, `--ink: #1a1212`. Tailwind colors: `card`, `steel`, `gold`, `gold-tint`, `ink` added to `@theme inline`.
- Produces font: `--font-display` set by `next/font` variable `--font-noto-serif`; utility class `font-display`; `.type-h1/.type-h2/.type-h3` use `font-display`.
- Produces keyframes (used by later tasks): `@keyframes im-slash` (scaleX 0→1 then fade, 220ms), `@keyframes im-pop` (scale .5→1, 300ms ease-out), `@keyframes im-fade-in` (opacity 0→1, 150ms). All wrapped so `@media (prefers-reduced-motion: reduce)` sets `animation: none !important; transition: none !important` for `.im-anim` elements.
- `siteConfig.soundEnabled: false`.

- [ ] **Step 1: Update tokens and theme mapping** in `globals.css` as above; keep `.pin-light` / `.pin-dark` unchanged.
- [ ] **Step 2: Load Noto Serif** in `layout.tsx`: `Noto_Serif({ subsets: ['latin'], weight: ['400','700'], display: 'swap', variable: '--font-noto-serif' })`, class on `<html>`.
- [ ] **Step 3: Add `soundEnabled: false`** to `siteConfig` with a one-line comment.
- [ ] **Step 4: Verify** `npm run typecheck && npm run build`, then `grep -r "fonts.googleapis\|fonts.gstatic" out/ | wc -l` → `0`.
- [ ] **Step 5: Commit** `feat: ink paper tokens and Noto Serif headings`.

---

### Task 3: Samurai frames and timeline (ui-builder)

**Files:**
- Create: `components/samurai/frames.ts`, `components/samurai/timeline.ts`
- Test: `components/samurai/__tests__/timeline.test.ts`

**Interfaces:**
- Produces (`frames.ts`):
  ```ts
  export type SamuraiState = 'idle' | 'working' | 'success' | 'error';
  export type FrameSet = {
    sprite: string; prefix: string; w: number; h: number;
    seq: Record<SamuraiState, number[]>;
    ms: Record<SamuraiState, number>;
    loop: Record<SamuraiState, boolean>;
    still: Record<SamuraiState, number>;
    cutFrame: number | null;
  };
  export const KENDO: FrameSet; // sprite '/samurai/kendo.svg', prefix 'k', 271×200,
  //  seq idle [0,1,2,3,2,1], working [4,5,6,7,8,9,10,11,12], success [13,14,15,16], error [0,17,18]
  //  ms idle 320, working 95, success 130, error 160; loop idle/working true, success/error false
  //  still idle 0, working 8, success 16, error 18; cutFrame 8
  export const RONIN: FrameSet; // '/samurai/ronin.svg', 'r', 165×260, every state uses seq 0..36,
  //  ms 85, loop false, still 0, cutFrame null (hero replays via restDelayMs)
  export const RONIN_REST_MS = 5000;
  ```
- Produces (`timeline.ts`), pure, no timers:
  ```ts
  export type Timeline = { set: FrameSet; shown: SamuraiState; requested: SamuraiState; i: number; done: boolean };
  export function startTimeline(set: FrameSet, state: SamuraiState): Timeline;
  export function request(t: Timeline, state: SamuraiState): Timeline;
  export function tick(t: Timeline): { t: Timeline; frame: number; cut: boolean };
  export function currentFrame(t: Timeline): number;
  ```
  Rules: `request` to `working` always restarts at `i=0` (from any state). `request` from `working` to `success`/`error` does **not** switch immediately: `shown` stays `working` until the current stroke reaches the end of `seq.working`, then the next `tick` switches to the requested state at `i=0`. Any other `request` switches immediately at `i=0`. Non-looping sequences hold the last frame with `done=true`. `cut` is true on the tick whose frame equals `cutFrame` while shown is `working`.

- [ ] **Step 1: Write failing tests** in `timeline.test.ts`:
  - `idle ping-pongs and loops`: 7 ticks from `startTimeline(KENDO,'idle')` yield frames `[1,2,3,2,1,0,1]`
  - `working emits cut on frame 8 once per stroke`: 18 ticks → `cut` true exactly twice
  - `success waits for the current stroke to finish`: start working, tick 2, `request(success)`; next ticks still return working frames until frame 12, then the next tick has `shown === 'success'` and frame `13`, then `14,15,16`, then stays `16` with `done`
  - `fast job still gets one full stroke incl. cut`: start working, immediately `request(success)`; collecting ticks until shown==='success' includes a `cut:true`
  - `error holds kneeling frame`: `startTimeline(KENDO,'error')` ticks → `17,18,18,18`
  - `timeline restarts on new working request` (Review Focus 1): during success frame 14, `request(working)` → next frame is `5` (i=1 of working) and shown `working`
  - `request same state is a no-op` (idle→idle keeps `i`)
- [ ] **Step 2: Run** `npx vitest run components/samurai/__tests__/timeline.test.ts` → FAIL.
- [ ] **Step 3: Implement** `frames.ts` and `timeline.ts`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: samurai frame sets and pure timeline`.

---

### Task 4: Samurai component, stage and slash (ui-builder)

**Files:**
- Create: `components/samurai/ink-defs.tsx`, `samurai.tsx`, `samurai-stage.tsx`, `slash.tsx`
- Test: behaviour is covered by Task 3 unit tests and Task 11 e2e; this task verifies with lint/typecheck, then visually through Task 5.

**Interfaces:**
- Consumes: `KENDO`, `RONIN`, `startTimeline/request/tick/currentFrame` (Task 3); keyframe `im-slash` (Task 2).
- Produces:
  ```tsx
  export function InkDefs({ id }: { id: string }): JSX.Element; // <defs><filter id={id}> feTurbulence(fractalNoise, baseFrequency .9, numOctaves 2, seed 7) + feDisplacementMap scale 2.2
  export function Samurai(props: { state: SamuraiState; set?: FrameSet; height: number; onCut?: () => void; className?: string }): JSX.Element;
  export function SamuraiStage(props: { state: SamuraiState; set?: FrameSet; height?: number /*default 150*/; className?: string; children?: React.ReactNode }): JSX.Element;
  export function Slash(props: { fireKey: number }): JSX.Element; // replays animation whenever fireKey changes
  ```
- `Samurai`: `'use client'`; `<svg aria-hidden="true" focusable="false" viewBox="0 0 w h" width={round(height*w/h)} height={height} className="text-ink">` containing `InkDefs` (id from `useId`), red sun `<circle cx={w*.62} cy={h*.36} r={h*.27} className="fill-primary" opacity=".9">` (kendo only; ronin gets its sun from the hero scene), ground stroke path, and `<use href={`${sprite}#${prefix}${frame}`} filter={`url(#${id})`} />`. Drives `tick` with `setInterval(set.ms[shown])` (re-armed when `shown` changes); calls `onCut` when `tick().cut`. Stops on unmount and while `document.visibilityState === 'hidden'`. Under `matchMedia('(prefers-reduced-motion: reduce)')` it renders `set.still[state]` and starts no timer. Width/height attributes fixed, so a missing sprite changes nothing in layout.
- `SamuraiStage`: fixed-height box (`style={{height}}`), centered on mobile; renders `Samurai` with `onCut` bumping a counter passed to `Slash` as `fireKey`; positions `Slash` absolutely across the **nearest positioned ancestor** (the tool card), so the card must be `relative overflow-hidden` (Task 5).
- Test hooks: `SamuraiStage` root has `data-testid="samurai-stage"` and `data-state={state}` (the shown state); `Slash` root has `data-testid="slash"` and gets class `is-cutting` while its animation runs.
- `Slash`: `<div aria-hidden className="im-anim pointer-events-none absolute -left-[10%] top-[44%] h-0.5 w-[120%] origin-left -rotate-[8deg] scale-x-0 bg-primary">`; on `fireKey` change toggles a class that runs `im-slash`. Renders nothing animated under reduced motion.

- [ ] **Step 1: Implement** the four files per the interfaces.
- [ ] **Step 2: Verify** `npm run lint && npm run typecheck`.
- [ ] **Step 3: Commit** `feat: samurai component, stage and slash`.

---

### Task 5: ToolShell layout with the samurai (ui-builder)

**Files:**
- Modify: `components/tool/tool-shell.tsx` (render only), `components/tool/file-picker.tsx` (styling only), `components/tool/results-placeholder.tsx` (comment only if needed)

**Interfaces:**
- Consumes: `SamuraiStage` (Task 4), ToolShell's existing `state` (`idle|processing|done|partial|error`), `running`, `items`.
- Mapping (pure, inline): `processing→'working'`, `done|partial→'success'`, `error→'error'`, else `'idle'`. On each new run start, the stage receives `'working'` again (timeline restarts).

- [ ] **Step 1: Wrap the tool area in a card**: `<div className="relative overflow-hidden rounded-card border border-border bg-card p-4 sm:p-5 sm:grid sm:grid-cols-[1fr_auto] sm:gap-5">` with `SamuraiStage` first in DOM (mobile: on top, 150px; `sm`: right column, `sm:sticky sm:top-4 sm:self-start`, height 200). Everything else keeps its current order inside the left column.
- [ ] **Step 2: Picker block replaced by results on mobile and desktop alike**: when `m > 0 && !running`, wrap `FilePicker` in a container with `hidden` (the `<input data-testid="file-input">` stays mounted); options (`primary`, `AdvancedOptions`) stay visible **below** the results so changing the target still re-runs (keeps product behaviour, PRODUCT.md §4.1). While `running`, picker and options get `opacity-25 transition-opacity` and remain in place. The existing "Compress another" ghost button keeps opening the file dialog directly (unchanged); the picker block reappears automatically while the next run is in progress and hides again when it finishes. **Deviation from spec §8.4, lead call:** the spec listed the chips and More options as part of the replaced block; they stay visible below the results instead, because hiding them would remove the existing "change target re-runs" function.
- [ ] **Step 3: Results fade in** with `im-anim animate-[im-fade-in_150ms_ease-out]` on `ResultList` wrapper.
- [ ] **Step 4: Verify** `npm run lint && npm run typecheck && npm run build`; `npm run test:e2e -- tools.spec.ts mobile-ux.spec.ts cls-split.spec.ts` → existing tests pass except ones asserting the picker stays visible after results (list them for qa in the task report, don't edit e2e).
- [ ] **Step 5: Commit** `feat: samurai stage and slash in ToolShell`.

---

### Task 6: Restyle primitives, tool, content and layout components (ui-builder)

**Files:**
- Modify: `components/ui/{button-styles.ts,chip-group.tsx,card.tsx,badge.tsx,switch.tsx,slider.tsx,number-input.tsx,sheet.tsx,toast.tsx,icons.tsx}`
- Modify: `components/tool/{file-picker,privacy-note,progress-bar,result-card,result-list,error-banner,target-size-chips,format-select,advanced-options,share-button}.tsx`
- Modify: `components/content/{faq-list,how-to-steps,related-tools,tool-card,tool-grid,rich-text,page-intro,last-updated}.tsx`, `components/layout/{breadcrumbs,container}.tsx`, `app/_legal/legal-page.tsx` (classes only)
- Create: `components/layout/brand-seal.tsx`; Modify: `components/layout/{site-header,menu-disclosure,site-footer}.tsx`

**Interfaces:**
- `BrandSeal({ size = 18 })`: inline SVG, `aria-hidden`, crimson rounded square (`fill-primary`, radius 3) with 画 in white serif.
- Visual rules (spec §7, §9, §12.1): primary button crimson (`bg-primary text-on-primary`, hover `bg-primary-hover`), picker button 56px tall, full width, no icon; secondary button `bg-card border border-border-strong`; selected chip `border-gold bg-gold-tint font-semibold`, unselected `border-border-strong bg-card`; ProgressBar track `bg-surface`, fill `bg-ink`; ResultCard: bold `tabular-nums` sizes, the "↓"/percent in `text-primary`, card `bg-card`; ErrorBanner/failed card title in `font-display text-lg`; FAQ `<details>` with `border-b border-border`, summary in `font-display`; ToolCard: name `font-display`, one line, small crimson "→" (aria-hidden), `bg-card border`, no shadow; links `text-primary underline`.
- Header: `BrandSeal` + "Img Master" in `font-display font-bold text-steel`; slot for `SoundToggle` (Task 8) left of the menu button; desktop active link gets a 2px crimson brush underline (inline SVG, aria-hidden). Mobile menu panel slides down under the header (`im-anim` translate/opacity 150ms), `bg-card`; existing `<details>` behaviour, Esc and outside-tap close stay.
- Footer: unchanged text and two-line structure; colours from tokens.

- [ ] **Step 1: Restyle** per rules; no text or structure changes beyond the header seal/slot.
- [ ] **Step 2: Verify** `npm run lint && npm run typecheck && npm run build`; `npm run test:e2e -- a11y.spec.ts redesign.spec.ts` → a11y passes; record which `redesign.spec.ts` colour assertions now fail (expected; qa updates them in Task 11).
- [ ] **Step 3: Commit** `feat: restyle components to ink paper theme`.

---

### Task 7: Favicon samurai and cut-to-icon moment (ui-builder)

**Files:**
- Create: `components/favicon/cut-moment.ts`, `components/favicon/cut-moment.tsx`
- Modify: `components/favicon/favicon-shell.tsx` (render + event wiring only), `components/favicon/favicon-preview.tsx` (pop class on the tab icon), `components/favicon/png-to-ico-tool.tsx` (add `SamuraiStage` with its state)
- Test: `components/favicon/__tests__/cut-moment.test.ts`

**Interfaces:**
- ```ts
  export type CutState = { mode: 'image' | 'text' | 'emoji'; armed: boolean; edited: boolean; plays: number };
  export type CutEvent = { type: 'file' } | { type: 'edit' } | { type: 'built' } | { type: 'mode'; mode: CutState['mode'] };
  export function initialCut(mode: CutState['mode']): CutState; // armed false, edited false, plays 0
  export function cutReducer(s: CutState, e: CutEvent): CutState;
  ```
  Rules: `file` (image mode) → `armed=true`. `edit` in text/emoji → if `!edited` then `edited=true, armed=true`; later edits change nothing. `built` → if `armed` then `plays+1, armed=false`. `mode` → `initialCut(newMode)` but keeps `plays`.
- `CutMoment({ playKey, tile, onDone })`: client; when `playKey` increments, overlays the stage with 8 copies of `tile` (ReactNode: the current 512 preview `<img>`), each `clip-path: polygon(...)` shard; timeline ≤ 1.4 s: two slashes (reuse `Slash` with fireKey bumps at 0 and 250 ms), shards fly out ~12px (300 ms) then converge and scale to 32px at the tab-icon position (600 ms), then `onDone()`. Transforms/opacity only, `aria-hidden`. Reduced motion: calls `onDone()` immediately, renders nothing.
- FaviconShell: `SamuraiStage` at the top of the shell card (state: `busy→working`, `failure→error`, `cut playing→working`, after `onDone→success`, else `idle`); dispatch `file` in `pickFile`, `edit` in `change` (text/emoji), `built` when a new `pkg` arrives, `mode` in `setMode`. Download handlers untouched (never wait for the moment). After `onDone`, FaviconPreview tab icon gets `im-anim animate-[im-pop_300ms_ease-out]` keyed by `plays`.
- png-to-ico: `SamuraiStage` mapped from its own existing state like Task 5; no cut moment.

- [ ] **Step 1: Write failing tests** `cut-moment.test.ts`:
  - `image: file then built plays once`: plays 1; another `built` without `file` → still 1
  - `text: load build does not play`: `built` before any `edit` → plays 0
  - `text: first edit then built plays once; later edits never replay` (Review Focus 4): edit, built, edit, edit, built → plays 1
  - `emoji behaves like text`
  - `mode switch resets arming but keeps plays`
- [ ] **Step 2: Run** `npx vitest run components/favicon/__tests__/cut-moment.test.ts` → FAIL.
- [ ] **Step 3: Implement** `cut-moment.ts`, then `cut-moment.tsx` and shell wiring.
- [ ] **Step 4: Run** unit tests → PASS; `npm run test:e2e -- favicon-ux.spec.ts favicon-output.spec.ts favicon-safety.spec.ts` → PASS (report any layout-only failures for qa).
- [ ] **Step 5: Commit** `feat: favicon samurai and cut-to-icon moment`.

---

### Task 8: Optional sword sounds (lead: files; ui-builder: code)

**Files:**
- Create: `public/sounds/{start,success,error}.mp3`, `public/sounds/SOURCES.md` (lead)
- Create: `components/sound/sound.ts`, `components/sound/sound-toggle.tsx`
- Modify: `components/layout/site-header.tsx` (mount `SoundToggle`), `components/tool/tool-shell.tsx`, `components/favicon/favicon-shell.tsx`, `components/favicon/png-to-ico-tool.tsx` (one `playSound` call at run start / success / error)
- Test: `components/sound/__tests__/sound.test.ts`

**Interfaces:**
- ```ts
  export type SoundName = 'start' | 'success' | 'error';
  export const SOUND_KEY = 'im-sound';
  export function getSoundPref(storage?: Pick<Storage,'getItem'> | null): boolean; // default siteConfig.soundEnabled; '1' → true, '0' → false; throws → default
  export function setSoundPref(on: boolean, storage?: Pick<Storage,'setItem'> | null): void; // never throws
  export function playSound(name: SoundName): void; // no-op unless pref on; lazily creates one AudioContext, fetches `/sounds/${name}.mp3` once, decodes, plays at gain 0.35; all errors swallowed
  ```
- `SoundToggle`: `'use client'` 48×48 icon button, `aria-pressed`, `aria-label` "Sound on"/"Sound off", speaker icons from `icons.tsx` (add `SpeakerIcon`, `SpeakerOffIcon`); toggling on resumes/creates the AudioContext inside the click (autoplay rule) and plays nothing.
- Sound files (lead), using the scratch venv's `imageio-ffmpeg` binary, mono, 64 kbps, ≤ 50 KB each:
  - `start.mp3` ← `ref/sword sound/oxidvideos-sword-swing-sfx-407574.mp3`, first 0.6 s
  - `success.mp3` ← `ref/sword sound/freesound_community-draw-sword1-44724.mp3`, first 0.8 s
  - `error.mp3` ← `ref/sword sound/freesound_community-sword-thud-47635.mp3`, first thud (≤ 0.7 s); fallback `dragon-studio-sword-clashhit-393837.mp3`
  - `SOURCES.md`: original file names, "Pixabay sound effects, Pixabay Content License".

- [ ] **Step 1: Write failing tests** `sound.test.ts`:
  - `getSoundPref default is false` (empty storage)
  - `getSoundPref reads '1' and '0'`
  - `getSoundPref returns default when storage throws` (Review Focus 5)
  - `setSoundPref never throws when storage throws`
  - `playSound is a no-op when pref is off` (stub `globalThis.fetch` and assert not called)
- [ ] **Step 2: Run** `npx vitest run components/sound/__tests__/sound.test.ts` → FAIL.
- [ ] **Step 3: Lead creates the three sound files** and checks `ls -l public/sounds/*.mp3` all ≤ 51200 bytes.
- [ ] **Step 4: Implement** `sound.ts`, `sound-toggle.tsx`, header mount and the three `playSound` call sites.
- [ ] **Step 5: Run** unit tests → PASS; `npm run build`.
- [ ] **Step 6: Commit** `feat: optional sword sounds, off by default`.

---

### Task 9: Home hero, tool grid and 404 (ui-builder: components; lead: app pages)

**Files:**
- Create: `components/home/hero-scene.tsx`
- Modify: `components/home/home-hero.tsx`, `app/page.tsx` (pass category links), `app/not-found.tsx` (add still ronin)

**Interfaces:**
- `HeroScene({ animate = true })`: `aria-hidden` SVG, `viewBox="0 0 360 588"`, `preserveAspectRatio="xMidYMax slice"`: red sun (`fill-primary`, cx 262 cy 330 r 62), two ink-wash hills (flat `fill-ink` at opacity .10 / .18 with a `feGaussianBlur stdDeviation=6` filter, no gradients), dark rock (`fill-ink` opacity .85), and `<Samurai set={RONIN} state="idle" height={300} />` positioned over the sun. Ronin plays seq once then rests `RONIN_REST_MS` and repeats; pauses via `IntersectionObserver` when off-screen and when the tab is hidden. `animate={false}` → still frame 0 (404 page).
- `HomeHero({ h1, subtitle, categories: { label: string; href: string }[] })`: text block (H1 `font-display` 28–30px, subtitle muted) + category chips (gold border, 48px tall links) + `HeroScene` below text on mobile (scene height ~300px so H1/subtitle/chips stay above the fold), to the right on `lg`. Category hrefs: `/compress-image`, `/image-converter`, `/favicon-generator` (existing hubs).
- 404: `HeroScene animate={false}` above the existing copy and tool grid, at reduced height (~220px).

- [ ] **Step 1: Implement** the components and page wiring (H1/subtitle still from `content/home.ts`).
- [ ] **Step 2: Verify** `npm run build`; `npm run test:e2e -- seo.spec.ts mobile-ux.spec.ts js-budget.spec.ts` → PASS.
- [ ] **Step 3: Commit** `feat: ronin hero scene on home and 404`.

---

### Task 10: DESIGN.md rewrite (lead)

**Files:**
- Modify: `docs/DESIGN.md`

- [ ] **Step 1: Rewrite** §1 principles (calm and trustworthy, now with one character; decoration only as samurai, ink marks and slash), §2 tokens/type/motion (new values, Noto Serif via next/font, keyframes, reduced motion), §3 layouts (samurai stage, results replace picker block, hero scene), §4 new components (`components/samurai/*`, `components/sound/*`, favicon cut moment, brand seal), §8 performance rules (one web font allowed, sprites as static files). Keep §6 microcopy and §7 accessibility, adding sound toggle labels.
- [ ] **Step 2: Commit** `docs: design system for the ink samurai redesign`.

---

### Task 11: QA: e2e updates, new checks, audits (qa-reviewer)

**Files:**
- Modify: `e2e/redesign.spec.ts` (allowed colours → new palette incl. `#faf8f4`, `#ffffff` cards, crimson, gold, ink; still no shadows/gradients), any spec asserting the picker stays visible after results (from Task 5's report)
- Create: `e2e/samurai.spec.ts`
- Create: `reports/qa-samurai-redesign.md`, screenshots in `reports/`

**Interfaces:**
- Consumes: `data-testid="samurai-stage"` + `data-state`, `data-testid="slash"` + class `is-cutting` (Task 4).

- [ ] **Step 1: Write e2e tests** in `samurai.spec.ts` (mobile Chromium + WebKit):
  - `fold at 360x640`: on every live tool page, `samurai-stage`, `file-picker` button and `privacy-note` bottoms ≤ 640
  - `states`: `/compress-image-to-50kb` stage `data-state` goes `idle → working → success` after `setInputFiles(fixture)`; with a non-image fixture → `error`
  - `slash plays at least once per run` even for a tiny fixture (assert `slash` had class `is-cutting` at least once, via a MutationObserver installed before `setInputFiles`)
  - `reduced motion`: `page.emulateMedia({ reducedMotion: 'reduce' })` → the `<use>` href does not change over 1 s in idle; no slash animation class
  - `samurai sprite 404 keeps layout` (Review Focus 2): `page.route('**/samurai/kendo.svg', r => r.abort())` → stage box height unchanged, picker still works
  - `favicon text: cut plays after first edit only`: type one char → a cut-moment overlay appears once; type 3 more → no new overlay
  - `no sound requests while off` (Review Focus 5): no request to `/sounds/` during a full compress run; after toggling sound on and running, `/sounds/start.mp3` is requested
  - `no external hosts`: every request URL is same-origin (extends privacy.spec)
- [ ] **Step 2: Update** `redesign.spec.ts` colour/background assertions and the picker-visibility assertions only where the redesign intentionally changed them.
- [ ] **Step 3: Run** `npm run build && npm run test:e2e` → all PASS; `npm run lhci` → ≥ 95 in every category for `/` and `/compress-image-to-50kb`; js-budget ≤ 30 KB.
- [ ] **Step 4: Screenshots** at 360px of `/compress-image-to-50kb` idle and result state, home hero, favicon-from-text after the cut; write `reports/qa-samurai-redesign.md` with results and any issues by severity.
- [ ] **Step 5: Lead commits** `test: e2e for samurai redesign and updated design checks`.

---

### Task 12: Final integration check (lead)

- [ ] **Step 1: Run** `npm run lint && npm run typecheck && npm run test && npm run build` → all pass.
- [ ] **Step 2: Diff guard**: `git diff main --stat -- lib/image-engine lib/tools/registry.ts lib/types.ts content` → empty.
- [ ] **Step 3: SEO text guard**: build `main` and this branch, compare extracted `main` text (headings, paragraphs, FAQ) of every built page in `out/` → identical.
- [ ] **Step 4: Report to owner** (≤ 10 bullets): what changed, screenshots, Lighthouse numbers, list of every file created or changed (`git diff main --name-only`).
