# Img Master — SEO and content

## 1. How this kind of site ranks (and how long it takes)

Google ranks a tool page when it is the best answer to one specific search. For us that comes down to six things:

| Lever | What we do |
|---|---|
| **Intent match** | One URL per search intent ("compress image to 50kb"), with the exact phrase in the title, H1 and URL, and a tool that does exactly that job on page load. |
| **The tool works instantly** | Visitors who get their file and leave satisfied are the strongest signal we can send. No popups, no signup, no waiting. |
| **Page experience** | Fast on mobile (Core Web Vitals), no layout shift, readable without zooming. |
| **Helpful, original text** | Real explanations, measured numbers from our own engine, honest tips. Not spun filler. |
| **Site structure** | Hubs link to every tool, every tool links to related tools, breadcrumbs everywhere, clean sitemap. |
| **Trust and links** | Clear About and Privacy pages, a real person or company behind the site, and links earned from communities and developer posts (`GROWTH.md`). |

**Expect 3–6 months** before steady search traffic on a new domain. Long, specific searches ("compress image to 20kb for online form") rank first; broad ones ("image compressor") come much later, if at all.

## 2. Keyword-to-page rules

1. **One intent, one page.** Variants of the same intent ("reduce photo size to 50kb", "50kb photo", "convert image to 50kb") go on the same page as secondary keywords, in the subtitle, text and FAQs. Never make two pages that compete for the same search.
2. **Only make pages people search for.** A new size page (e.g. 30KB) needs evidence: Search Console impressions, Google autocomplete, or a keyword tool. No mass-generated pages.
3. **Each page must be genuinely different.** Different preset, different page-specific sections, different measured data, different FAQs. Google's spam policies target doorway pages and scaled low-value content; twenty near-identical pages can hurt the whole site.
   - Shared text between any two sibling pages (excluding header, footer and tool UI) must stay under 30%. QA measures this.
4. **Write for the person, then check the keyword.** The primary keyword appears in: title, H1, URL, first sentence of the subtitle or intro, one H2, and naturally in the text. No stuffing.

## 3. Content model

The lead copies these types into `lib/types.ts`. `seo-content` writes one `ToolContent` per slug in `content/pages/{slug}.ts`, exported through `content/pages/index.ts`. The build fails if a `live` tool has no content.

```ts
export type ToolKind =
  | 'compress-to-size' | 'compress' | 'convert'
  | 'favicon-image' | 'favicon-text' | 'favicon-emoji' | 'png-to-ico';
export type ToolCategory = 'compress' | 'convert' | 'favicon';

// Structure (lib/tools/registry.ts, owned by the lead)
export interface ToolDefinition {
  slug: string;
  kind: ToolKind;
  category: ToolCategory;
  status: 'live' | 'draft';
  phase: 1 | 2 | 3;
  preset: {
    targetKB?: number;                    // compress-to-size
    from?: ImageFormat | 'any';           // convert
    to?: ImageFormat;                     // convert, compress-to-size output
    quality?: number;                     // 0–1
  };
}

// Text (content/pages/{slug}.ts, owned by seo-content)
export interface RichSection {
  heading: string;                        // becomes an H2
  paragraphs: string[];                   // supports **bold** and [text](/internal-path)
  list?: string[];
  table?: { caption: string; headers: string[]; rows: string[][] };
}

export interface ToolContent {
  primaryKeyword: string;
  secondaryKeywords: string[];            // 3–8 real variants
  shortName: string;                      // menus and cards, ≤ 18 chars ("To 50KB")
  cardDescription: string;                // ≤ 70 chars
  title: string;                          // ≤ 60 chars including " | Img Master"
  description: string;                    // 120–155 chars
  h1: string;
  subtitle: string;                       // ≤ 100 chars, shown above the tool
  howTo: [string, string, string];
  sections: RichSection[];                // 2–4 page-unique sections
  tips?: string[];
  faqs: { q: string; a: string }[];       // 4–6
  related: string[];                      // 4–6 slugs, must exist
  updatedAt: string;                      // ISO date
}
```

## 4. Page anatomy and formulas

| Element | Rule | Example (`compress-image-to-50kb`) |
|---|---|---|
| URL | `/` + lowercase keyword with hyphens, no trailing slash | `/compress-image-to-50kb` |
| Title | `{Primary keyword, title case} Online – Free, No Upload \| Img Master`, ≤ 60 chars. Shorten the middle part if needed, never the keyword. | Compress Image to 50KB Online – Free, No Upload \| Img Master |
| Meta description | 120–155 chars: result + speed + privacy + free. Unique per page. | Reduce any photo to under 50KB in seconds. Works on your phone, keeps faces clear, and your image never leaves your device. Free, no signup. |
| H1 | The primary keyword, plain | Compress Image to 50KB |
| Subtitle | One sentence with the benefit and one secondary keyword | Get a clear JPG under 50KB for online forms in seconds, right on your phone. |
| Above the tool | Only breadcrumbs, H1 and subtitle | |
| Below the tool | How it works (3 steps) → 2–4 unique sections → tips → related tools → FAQs | |
| Length | 400–800 words of useful text below the tool | |

### Page-unique section ideas

Pick the ones that genuinely fit each page. Don't force all of them.

- **Compress-to-size pages:** what this size is typically used for (stated generally: "many online forms limit photos to 50KB"; never name a specific exam's rule unless the owner supplies a verified source), what dimensions you can expect at this size (from `reports/benchmarks.json`), how to keep a face or signature readable, what to do if a form says the file is still too big (KB vs KiB), JPG vs WebP at this size.
- **Converter pages:** why this format exists, when to use each, what happens to transparency, quality settings explained, browser and app support in plain words, batch conversion.
- **Favicon pages:** which files a site needs and why, where to put them, how to check a favicon in the browser, common mistakes (cache, wrong path).
- **Hubs:** a table of all sizes or formats with links, how to choose.

### "Typical results" tables (our unfair advantage)

`qa-reviewer` produces `reports/benchmarks.json` by running real sample photos through each tool. `seo-content` turns that into a small table per size page, for example:

| Starting photo | Result | Dimensions |
|---|---|---|
| 12 MP phone photo (3.1 MB) | 48 KB | 1180 × 885 |
| Scanned signature (420 KB) | 31 KB | 900 × 300 |

Caption: "Measured with Img Master on {date} using sample photos." These numbers are real, unique to our site and useful. Never invent them; if benchmarks aren't ready, leave the table out and add a `// TODO(benchmarks)` comment.

### FAQs

- 4–6 questions a real person asks, phrased the way they'd type them ("Will my photo lose quality?", "Why does the form still say the file is too big?").
- Answers 2–4 sentences, specific, no fluff.
- `seo-content` may look at public search results (Google autocomplete, "People also ask", forum threads) to understand what people ask. **Never copy text from other sites.**

### Writing style

- Plain English, short sentences, second person ("you").
- Many readers use English as a second language: avoid idioms and slang.
- No claims we can't back up: no "best", "#1", "trusted by millions", no fake reviews or ratings.
- Mention privacy (stays on your device) once in the subtitle or intro and once lower down, not in every paragraph.

## 5. Technical SEO checklist

### Metadata (`lib/seo/metadata.ts`)

- `metadataBase` from `siteConfig.url`.
- `buildToolMetadata(tool, content)` returns title, description, canonical (absolute, no trailing slash), Open Graph (title, description, url, image, `type: 'website'`, `siteName`), Twitter card `summary_large_image`.
- Home and legal pages use the same helper with their own text.
- `robots`: index, follow everywhere except the 404 and any dev-only page.

### Structured data (`lib/seo/jsonld.ts`), output as `<script type="application/ld+json">`

| Page | Types |
|---|---|
| Home | `WebSite` (name, url), `Organization` (name, url, logo; `sameAs` only for real profiles) |
| Tool pages | `WebApplication` (name, url, description, `applicationCategory: 'MultimediaApplication'`, `operatingSystem: 'Any'`, `browserRequirements`, `offers: { price: '0', priceCurrency: 'USD' }`), `BreadcrumbList` |
| Tool pages (optional) | `FAQPage` matching the visible FAQs exactly. Google shows FAQ rich results only for a narrow set of authoritative sites, so don't expect stars or dropdowns in results; keep it only because it's harmless and accurate. |

- No `aggregateRating` or `review` markup (we have no real reviews).
- No `HowTo` markup (Google no longer shows HowTo rich results).
- QA validates every JSON-LD block parses and matches visible content.

### Crawling and indexing

- `app/sitemap.ts`: every `live` tool, home, hubs, legal pages; `lastModified` from `updatedAt`. No drafts, no dev pages.
- `app/robots.ts`: allow all, point to the sitemap.
- One canonical host: pick apex (`https://{domain}`) and redirect `www` to it in Cloudflare.
- No query-string variants indexed (options live in state, not URLs).
- Every internal link uses the canonical path (no trailing slash).
- Helpful 404 with links to tools.

### Internal links

- Home → every hub and every live tool.
- Hub (`compress-image`, `image-converter`, `favicon-generator`) → every tool in its category, in a table or grid with descriptive anchor text.
- Every tool → its hub (breadcrumb), 4–6 related tools, and 1–2 contextual links inside the text ("Need it even smaller? Try [Compress to 20KB](/compress-image-to-20kb).").
- Footer → category hubs and legal pages.
- Anchor text describes the target ("Compress image to 100KB"), never "click here".

### Open Graph images

Try Next's built-in `ImageResponse` from `next/og` in `app/[slug]/opengraph-image.tsx` with `generateStaticParams`. If the static export can't produce it, fall back to one static 1200×630 image per category in `public/og/`. Design: brand color background, white H1 text, small logo. No dependency additions either way.

### Core Web Vitals targets (mobile, 4G)

- LCP < 2.0 s (the LCP element is the H1 or picker; no hero images)
- CLS < 0.05 (reserve space for results and ads)
- INP < 200 ms (heavy work in the worker)
- Lighthouse mobile ≥ 95 for Performance, Accessibility, Best Practices, SEO

### Later

- `hreflang` when Bangla/Hindi pages exist (`/bn/...`, `/hi/...`), each translated by a person or carefully reviewed, never raw machine output.

## 6. Trust pages (E-E-A-T)

- **About:** who runs Img Master (owner name and company from `site-config`), why it exists, how it works (in the browser, nothing uploaded), contact email.
- **Privacy:** matches reality: no image uploads, which analytics (if any) and what it collects, ads and cookies when ads are turned on, how to contact.
- **Terms:** short, plain, "provided as is".
- **Contact:** an email link (no form, there's no backend).
- Show "Last updated {date}" on tool and legal pages.

## 7. After launch: the weekly SEO routine

1. **Search Console → Performance → Queries.** Sort by impressions.
   - High impressions, low CTR → rewrite that page's title and description (test one change at a time, wait 2–3 weeks).
   - Position 8–20 → improve the page: add a better section, answer the FAQ people are clearly asking, add a contextual link from a stronger page.
   - A query with real impressions and no matching page (e.g. "compress image to 30kb") → add a page through the registry, following section 2.
2. **Pages → Not indexed** → fix the reason (usually thin or duplicate content).
3. Add one new page or one substantial improvement per week. Steady beats bursts.
4. Re-run QA after every content batch (duplicate titles, similarity, broken links).
