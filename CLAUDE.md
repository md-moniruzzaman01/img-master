# Img Master — project rules

Img Master is a free, mobile-first website of image tools that run 100% in the visitor's browser. Nothing is uploaded. The site gets visitors from Google through many specific landing pages ("compress image to 50KB", "webp to jpg") that all share one image engine.

Read these before starting any task:

| File | What it covers | Who must read it |
|---|---|---|
| `docs/PRODUCT.md` | Audience, every page, features, user flows, roadmap | everyone |
| `docs/DESIGN.md` | Design system, layout, components, copy, accessibility | lead, ui-builder, qa-reviewer |
| `docs/ENGINE.md` | Image engine architecture, algorithms, worker protocol, tests | lead, image-engine, qa-reviewer |
| `docs/SEO.md` | How pages are built to rank, content rules, technical SEO | lead, seo-content, qa-reviewer |
| `docs/GROWTH.md` | How the site gets users and money (owner's plan) | lead, seo-content |

## Non-negotiables

1. **No image data ever leaves the device.** No upload endpoints, no server processing, no third-party image APIs.
2. **Mobile first.** Design, build and test at 360px wide before anything wider.
3. **Tool first.** On every tool page the file picker is visible without scrolling on a 360×640 screen.
4. **Static HTML.** Every page is statically generated, and its text content is in the HTML (not rendered only by client JavaScript).
5. **One source of truth for pages.** `lib/tools/registry.ts` (structure) plus `content/pages/*.ts` (text). Never hard-code a tool page.
6. **Performance budget.** First-load JavaScript on a tool page ≤ 90 KB gzipped (the worker and any lazy encoders don't count). Lighthouse mobile ≥ 95 in every category.
7. **No new dependency without asking the owner.**
   - Allowed runtime: `next`, `react`, `react-dom`, `fflate`.
   - Allowed dev: `typescript`, `tailwindcss` and its PostCSS plugin, `eslint` + Next config, `prettier`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`.
8. **Honest copy.** Never invent official requirements (exam, visa or job-portal photo specs), statistics, user counts, ratings or reviews. Numbers in content come from our own measured benchmarks.

## Stack

- Next.js (latest stable, App Router) with `output: 'export'` (fully static, output in `out/`), `trailingSlash: false`, `images.unoptimized: true`
- TypeScript in strict mode, Tailwind CSS (latest version)
- Web Workers + `OffscreenCanvas`, with a main-thread fallback
- Hosting: Cloudflare (Pages or Workers static assets, both free). **Not Vercel's free Hobby plan:** its terms forbid commercial use, including ads.

## Folder structure and ownership

Each path has one owner. A subagent writes only inside the paths it owns. If it needs a change elsewhere, it reports the request to the lead instead of editing.

| Path | Owner | Contents |
|---|---|---|
| `app/` (layouts, routes, `[slug]/page.tsx`, hubs, `not-found.tsx`) | lead | Page wiring and metadata calls |
| `lib/types.ts` | lead | Shared contracts (tool, content and engine types) |
| `lib/site-config.ts` | lead | Brand, URL, contact, feature flags |
| `lib/tools/` | lead | Registry and lookup helpers |
| `lib/analytics.ts` | lead | One `track()` function, provider behind an env flag |
| `next.config.*`, `package.json`, `tsconfig.json`, CI config | lead | Project config |
| `components/`, `app/globals.css`, `public/icons/` | ui-builder | Design system and all UI components |
| `lib/image-engine/` | image-engine | Engine, worker, encoders, unit tests |
| `content/`, `lib/seo/`, `app/sitemap.ts`, `app/robots.ts`, `app/[slug]/opengraph-image.tsx`, `public/og/` | seo-content | All page text, metadata builders, structured data, sitemap |
| `e2e/`, `reports/`, `lighthouserc.*` | qa-reviewer | End-to-end tests, fixtures, audit reports, benchmarks |

```
img-master/
├─ app/
│  ├─ layout.tsx            # html lang, header, footer, global metadata
│  ├─ page.tsx              # home
│  ├─ [slug]/page.tsx       # every tool page, from the registry
│  ├─ about/ privacy/ terms/ contact/
│  ├─ not-found.tsx
│  ├─ sitemap.ts  robots.ts
│  └─ globals.css
├─ components/
│  ├─ ui/        # Button, Chip, Card, IconButton, Badge, Sheet, Toast…
│  ├─ layout/    # SiteHeader, ToolsSheet, SiteFooter, Breadcrumbs, Container
│  ├─ tool/      # ToolShell, FilePicker, options, ResultCard, StickyActionBar…
│  ├─ favicon/   # FaviconPreview, SnippetBlock
│  └─ content/   # RichText, HowToSteps, FaqList, RelatedTools, ToolGrid, AdSlot
├─ content/
│  ├─ pages/     # one file per tool slug + index.ts
│  ├─ home.ts
│  └─ legal/     # about, privacy, terms, contact text
├─ lib/
│  ├─ types.ts  site-config.ts  analytics.ts
│  ├─ tools/     # registry.ts, index.ts (getTool, getLiveTools)
│  ├─ seo/       # metadata.ts, jsonld.ts
│  └─ image-engine/
├─ e2e/          # Playwright tests + fixtures
├─ reports/      # qa-*.md, benchmarks.json
└─ docs/
```

## Commands

- `npm run dev` — dev server
- `npm run build` — static export to `out/`
- `npm run start:static` — serve `out/` locally (for e2e and Lighthouse)
- `npm run lint` and `npm run typecheck`
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright (mobile Chromium + mobile WebKit)
- `npm run lhci` — Lighthouse CI against `out/`

Run `lint`, `typecheck`, `test` and `build` before reporting any task as done.

## Multi-agent workflow

The main session is the **lead**. It plans, writes shared contracts, delegates to subagents in `.claude/agents/`, integrates their work and talks to the owner.

- `ui-builder`: design system, components, page sections
- `image-engine`: everything in `lib/image-engine/`
- `seo-content`: all page text, metadata, structured data, sitemap, OG images
- `qa-reviewer`: audits, end-to-end tests and benchmarks. It reports problems and does not fix product code.

Rules:

1. Run independent subagents in parallel. Never let two subagents edit the same file.
2. Each delegation states the goal, the files the subagent owns, the contracts to follow and the acceptance criteria.
3. Contracts in `lib/types.ts` change only through the lead. A subagent proposes the change in its report; the lead decides, edits the file and tells the other subagents.
4. Subagents can't ask the owner questions. When blocked, they stop and report options with a recommendation.
5. After every phase the lead runs lint, typecheck, tests and build, then gives the owner a short summary (≤ 10 bullets).
6. Stop at every ⏸ checkpoint in `KICKOFF.md` and wait for the owner's reply.

## Conventions

- Server components by default. Add `'use client'` only on interactive leaves (the tool, menus, accordions that need state).
- Function components with named exports. Default exports only where Next.js requires them.
- Styling with Tailwind utilities and the tokens in `app/globals.css`. No raw hex colors in components.
- Files in kebab-case, components in PascalCase.
- Only the lead runs git. It commits after integrating each piece of work, with conventional messages (`feat:`, `fix:`, `content:`, `test:`, `chore:`). Subagents never run git commands.
- Copy is plain English with short sentences. Many visitors read English as a second language.
- Wrap every `localStorage` access in try/catch; the site must work without it.
