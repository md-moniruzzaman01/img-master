# Img Master — integration contracts (Phase 1)

Owned by the lead. These are the names and props the routes in `app/` use. Types live in `lib/types.ts`; data helpers live in `lib/tools/index.ts`. Change requests go to the lead.

## 1. Data helpers (lead, `lib/tools`, `lib/engine.ts`, `lib/analytics.ts`)

| Helper | Returns |
|---|---|
| `getTool(slug)`, `getLiveTools()`, `getToolsByCategory(c)`, `getCategoryHub(c)` | `ToolDefinition`s |
| `getToolContent(slug)` | `ToolContent \| undefined` |
| `getToolCard(slug)`, `getToolCards(slugs)` | `ToolCardData` (live tools only) |
| `getNavGroups()` | `ToolNavGroup[]` (live categories with their tools) |
| `getSizeLinks()` | `{ label: '50KB', href, targetKB }[]` for the home size row |
| `getBreadcrumbs(slug)` | `Crumb[]`: Home › Category hub › shortName (hub page: Home › shortName) |
| `loadEngine()` (`@/lib/engine`) | `Promise<ImageEngine>`; lazy; mock until Phase 2 |
| `track(name, props)` (`@/lib/analytics`) | GROWTH.md §4 events; safe no-op by default |
| `siteConfig` (`@/lib/site-config`) | name, url, contactEmail, owner, credit, maxFiles, ads, analytics |

Components may import these helpers and `lib/types.ts`. They must not import `lib/image-engine/*` directly (use `loadEngine()`).

## 2. Components the routes render (ui-builder)

All server components unless marked (client). Named exports, one component per file, kebab-case file names. Import paths below are what the routes will use.

### Layout — `@/components/layout/...`

| Component | File | Props |
|---|---|---|
| `SiteHeader` | `site-header.tsx` | `{ groups: ToolNavGroup[] }` — includes skip link to `#main` and the Tools button that opens `ToolsSheet` (client) |
| `SiteFooter` | `site-footer.tsx` | `{ groups: ToolNavGroup[] }` — category lists (heading links to `hubHref` when set), About/Privacy/Terms/Contact, credit from `siteConfig.credit`, copyright year |
| `Breadcrumbs` | `breadcrumbs.tsx` | `{ items: Crumb[] }` |
| `Container` | `container.tsx` | `{ size: 'tool' \| 'text' \| 'wide'; className?: string; children }` — 640 / 680 / 1024px max widths with DESIGN.md gutters |

The root layout renders: `<SiteHeader/>`, `<main id="main">{children}</main>`, `<SiteFooter/>`.

### Tool — `@/components/tool/...`

| Component | File | Props |
|---|---|---|
| `ToolShell` (client) | `tool-shell.tsx` | `{ tool: ToolDefinition }` — the whole interactive island: FilePicker, options, PrivacyNote, ProgressBar, ResultList, StickyActionBar, ErrorBanner, AdvancedOptions, and `<AdSlot position="below-results"/>`. Picks behavior from `tool.kind` and `tool.preset`. Reads `siteConfig.maxFiles`. Calls `loadEngine()` and `track()`. |

ToolShell must render the FilePicker in its initial (server-rendered) HTML so the picker is visible without scrolling before hydration.

### Content — `@/components/content/...`

| Component | File | Props |
|---|---|---|
| `PageIntro` | `page-intro.tsx` | `{ h1: string; subtitle?: string }` — H1 + subtitle, tight spacing (tool first) |
| `HowToSteps` | `how-to-steps.tsx` | `{ steps: readonly string[]; heading?: string }` (default heading "How it works") |
| `RichText` | `rich-text.tsx` | `{ sections: RichSection[] }` — each section is an H2 block. Inline syntax: `**bold**`, `[text](/path)`, `[text](mailto:x)`, `[text](https://…)` (external links get `rel="noopener noreferrer"`) |
| `FaqList` | `faq-list.tsx` | `{ faqs: FaqItem[]; heading?: string }` (default "Frequently asked questions"); answers support the same inline syntax |
| `RelatedTools` | `related-tools.tsx` | `{ tools: ToolCardData[]; heading?: string }` (default "Related tools") |
| `ToolCard` | `tool-card.tsx` | `{ tool: ToolCardData }` |
| `ToolGrid` | `tool-grid.tsx` | `{ groups: ToolNavGroup[]; headingLevel?: 2 \| 3 }` |
| `LastUpdated` | `last-updated.tsx` | `{ date: string }` — "Last updated 23 October 2026" with `<time dateTime>` |
| `AdSlot` | `ad-slot.tsx` | `{ position: 'below-results' \| 'before-footer' }` — renders nothing while ads are off |
| `JsonLd` | `json-ld.tsx` | `{ data: object \| object[] }` — `<script type="application/ld+json">`, escapes `<` |

### Home — `@/components/home/...`

| Component | File | Props |
|---|---|---|
| `HomeHero` | `home-hero.tsx` | `{ h1: string; subtitle: string }` |
| `SizeLinks` | `size-links.tsx` | `{ heading: string; links: { label: string; href: string }[] }` — big chips that are links |
| `TrustStrip` | `trust-strip.tsx` | `{ items: string[] }` |

### Route composition (for reference)

- **Tool page:** `Container(tool)` → `Breadcrumbs` → `PageIntro` → `ToolShell` → `Container(text)` → `HowToSteps` → `RichText(sections)` → tips as `RichText([{ heading: 'Tips', paragraphs: [], list: tips }])` → `RelatedTools` → `FaqList` → `LastUpdated` → `AdSlot(before-footer)` → `JsonLd`.
- **Home:** `HomeHero` → `SizeLinks` → `ToolGrid` → `TrustStrip` → `RichText([howItWorks])` → `FaqList` → `JsonLd`.
- **Legal:** `Container(text)` → `PageIntro` → `LastUpdated` → `RichText`.
- **404:** `PageIntro` ("This page doesn't exist") → `ToolGrid`.

## 3. SEO modules (seo-content)

| Export | File | Signature |
|---|---|---|
| `buildRootMetadata` | `lib/seo/metadata.ts` | `() => Metadata` — `metadataBase`, default title template, `siteName`, base OG/Twitter, `formatDetection` off |
| `buildToolMetadata` | same | `(tool: ToolDefinition, content: ToolContent) => Metadata` |
| `buildPageMetadata` | same | `(p: { title: string; description: string; path: string; noindex?: boolean }) => Metadata` (home: `path: '/'`) |
| `homeJsonLd` | `lib/seo/jsonld.ts` | `() => object[]` — WebSite + Organization |
| `toolJsonLd` | same | `(tool: ToolDefinition, content: ToolContent) => object[]` — WebApplication + BreadcrumbList (from `getBreadcrumbs`) + FAQPage |
| `toolContent` | `content/pages/index.ts` | `Readonly<Partial<Record<string, ToolContent>>>` |
| `homeContent` | `content/home.ts` | `HomeContent` |
| `legalContent` | `content/legal/index.ts` | `Readonly<Record<LegalSlug, LegalContent>>` |

Titles in content are complete (they already end with " | Img Master"); metadata builders must not add the brand twice.

## 4. Engine (image-engine)

`lib/image-engine/index.ts` exports `imageEngine: ImageEngine`. The lead switches `lib/engine.ts` to it in Phase 2. Until favicons are built (Phase 4), `pngToIco` and `makeFavicons` reject with an `EngineError` (`ENCODE_UNSUPPORTED`, message "Not built yet").
