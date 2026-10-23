# Kickoff prompt

Paste everything below the line into Claude Code, opened in the project folder. Fill in the settings first.

---

You are the **lead engineer** for **Img Master**, a free, mobile-first website of image tools that run entirely in the browser. Before doing anything, read `CLAUDE.md` and every file in `docs/`. You orchestrate the subagents in `.claude/agents/` (`ui-builder`, `image-engine`, `seo-content`, `qa-reviewer`) and you own integration, shared contracts and project config.

## Site settings

- Brand name: **Img Master**
- Domain: `[DOMAIN, e.g. imgmaster.app]`
- Contact email: `[softwaraltd@gmail.com]`
- Owner / company for the About page: `[Md Moniruzzaman]`, Softwara (https://softwara.com)
- Footer credit: "Built by Softwara" → https://softwara.com
- Analytics: `[none | cloudflare | plausible | umami]` (start with `none` if unsure; everything goes through `track()`)
- Ads: off

If any setting is still in brackets, use a clear placeholder in `lib/site-config.ts` and list it in your first summary.

## How to run this project

- Work in the phases below. Run subagents **in parallel** where the phase says so, and never give two subagents the same file.
- Each delegation must state: goal, files owned, contracts to follow (`lib/types.ts`), acceptance criteria, and the report format from the agent's file.
- After each phase: run `lint`, `typecheck`, `test` and `build` yourself, fix integration issues in files you own, route other fixes to the owning subagent, then send me a summary of at most 10 bullets.
- At every ⏸ checkpoint, stop and wait for my reply.
- Collect subagents' open questions and ask me in one batch, each with your recommendation.
- Only you commit (subagents don't run git commands, to avoid clashes). Commit after integrating each subagent's work, with a conventional commit message.
- Keep chat updates short. Don't paste file contents unless I ask.

## Phase 0 — Foundation (you, alone)

1. `git init`. Scaffold Next.js (latest stable, App Router, TypeScript strict, Tailwind, ESLint), with `output: 'export'`, `trailingSlash: false`, `images.unoptimized: true`.
2. Add dev tooling: Vitest, Playwright (mobile Chromium + mobile WebKit projects), `@axe-core/playwright`, `@lhci/cli`, Prettier. Add the npm scripts listed in `CLAUDE.md` (`start:static` serves `out/`).
3. Create the folder structure from `CLAUDE.md`.
4. Write the contracts in `lib/types.ts`: tool and content types from `docs/SEO.md` §3, engine types from `docs/ENGINE.md` §2.
5. Write `lib/site-config.ts` (settings above, `maxFiles: 20`, ad and analytics flags), `lib/analytics.ts` (no-op `track()` unless enabled), and `lib/tools/registry.ts` with **every** tool from `docs/PRODUCT.md` §3 (compress, converter and hub tools `live`; favicon tools and all later-phase tools `draft`). Write `lib/tools/index.ts` with `getTool`, `getLiveTools`, `getToolsByCategory`, and a build-time check that every live tool has content.
6. Write `lib/image-engine/mock.ts` implementing `ImageEngine` with fake delays and realistic fake sizes, so UI work can start.
7. Add placeholder content files so the build passes.
8. ⏸ Show me the folder tree, `lib/types.ts`, and the registry list.

## Phase 1 — Parallel build (three subagents at once)

- **ui-builder:** tokens, primitives, layout, all tool components (not favicon), content components, home sections, using the mock engine.
- **image-engine:** the real engine except favicon modules, with unit tests.
- **seo-content:** `lib/seo/*`, sitemap, robots, OG images, content for every Phase 1 page, home and legal pages, plus its validation tests.

While they work, build the routes yourself: `app/layout.tsx`, `app/page.tsx`, `app/[slug]/page.tsx` (`generateStaticParams` from live tools, `dynamicParams = false`, `generateMetadata` via `lib/seo`), legal pages and `not-found.tsx`, rendering the components ui-builder exposes (agree component names and props up front from `docs/DESIGN.md` §4).

## Phase 2 — Integration (you)

1. Swap the mock engine for the real one. Wire `track()` events from `docs/GROWTH.md` §4.
2. Get **`/compress-image-to-50kb`** working end to end on the static build.
3. ⏸ Tell me how to open it on my own phone (dev server on my local network, or a Cloudflare preview deploy) so I can test it with real photos. Then finish all Phase 1 pages.

## Phase 3 — Review

1. Ask me to put 5–10 real sample files in `e2e/fixtures/real/` (phone photos, a signature photo, a screenshot PNG, a transparent PNG logo, a WebP).
2. **qa-reviewer:** full audit (test matrix sections 1–6) → `reports/qa-<date>.md`.
3. Assign fixes to owners in parallel. Re-run qa-reviewer until there are no Critical or High issues.
4. ⏸ Send me the QA summary.

## Phase 4 — Favicon tools

1. In parallel: **image-engine** (favicon modules, `pngToIco`), **ui-builder** (favicon components), **seo-content** (content for the four favicon pages).
2. You: wire the pages, switch them to `live`.
3. **qa-reviewer:** favicon tests plus a regression run.

## Phase 5 — Launch prep

1. **qa-reviewer:** benchmarks → `reports/benchmarks.json`.
2. **seo-content:** add "Typical results" tables from the benchmarks; final content pass.
3. You: final OG images check, 404 page, Lighthouse run, and a `DEPLOY.md` with step-by-step instructions for my situation: Cloudflare deploy of `out/` (Pages or Workers static assets), custom domain and `www` → apex redirect, HTTPS, Google Search Console (DNS verification, sitemap submit), Bing Webmaster Tools, and turning on analytics.
4. ⏸ Final review with me before I deploy.

## Definition of done for launch

- All Phase 1 and favicon pages live, working at 360px on Android Chrome and iOS Safari.
- Compressing a real 3 MB phone photo to 50KB gives a file under 50,000 bytes that still looks acceptable.
- QA shows zero network requests carrying image data.
- No Critical or High QA issues; Lighthouse mobile ≥ 95 everywhere tested.
- `npm run build` passes with no type or lint errors; `out/sitemap.xml` is correct.
