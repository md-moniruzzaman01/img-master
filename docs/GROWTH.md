# Img Master — getting users and earning money

This file is mostly the **owner's plan**. Agents build only the features listed in section 4.

## 1. Realistic timeline

| Period | What happens | Focus |
|---|---|---|
| Weeks 1–3 | Build and launch Phase 1 | Quality, speed, Search Console set up on day one |
| Months 1–3 | Google indexes pages; few search visitors | Direct traffic from communities and videos (section 2) |
| Months 3–6 | Long-tail searches start ranking | Weekly SEO routine (`SEO.md` §7), new pages from real data |
| Month 6+ | Traffic compounds if pages keep improving | Turn on ads once traffic justifies it (section 5) |

Don't count on income from this site in the first 3–6 months. It's a long-term asset next to client work.

## 2. Where the first users come from

Ranked by how well they fit our audience.

### 2.1 Answer people who are already asking

Students and job seekers regularly ask "how do I make my photo 50KB?" in Facebook groups (admission, job circular and exam groups in Bangladesh, India and Pakistan), on Quora and on Reddit.

- Answer the question fully first (steps that work on a phone). Add the link as the easiest way to do it.
- Don't paste the same message everywhere; group admins ban that and Google ignores it.
- Aim for 3–5 genuinely helpful answers a week.

### 2.2 Short how-to videos

"How to make a photo 50KB on your phone" is a common search on YouTube in this region. Short screen recordings (30–45 seconds, Bangla or English voice-over) on YouTube Shorts, Facebook Reels and TikTok:

- One video per tool or size: show the problem (form rejects the photo), open the page, done.
- Link in the description and pinned comment.
- Re-use the same recording across platforms.

### 2.3 Cyber cafés and form-filling shops

In Bangladesh many people pay a computer shop to fill online forms, and the shop resizes photos every day. A short WhatsApp message or a printed card with the link can turn a few shop owners into daily repeat users who also recommend it.

### 2.4 Developer audience (favicon and WebP tools)

- List Img Master on AlternativeTo as an alternative to TinyPNG, iLoveIMG and favicon generators.
- Write one honest technical post on dev.to or Hashnode: "How to compress an image to an exact KB size in the browser" (explain the binary search and worker setup). Developer posts earn real backlinks.
- Optional: publish the ICO writer or the target-size search as a small open-source package on GitHub that links back to the site.
- A "Show HN" or Product Hunt launch for the favicon tool once it's polished.

### 2.5 Repeat visits

People who need the tool once usually need it again. Make coming back easy: a memorable domain, the PWA install option (Phase 2), and remembered settings.

### 2.6 Local-language pages (Phase 3)

Bangla and Hindi searches for the same tasks have far less competition. Add them once the English pages rank, with properly reviewed translations.

## 3. What not to do

- No popups, email capture walls, fake download buttons or forced waits. They kill the user signal Google uses.
- No mass-generated pages, bought links, or link exchanges.
- No YouTube or Facebook video downloaders on this domain (terms violations, takedown risk, and they can get the whole domain rejected by ad networks).

## 4. Features agents build for growth

| Feature | Phase | Notes |
|---|---|---|
| Share result (Web Share API) | 1 | `ShareButton` in `DESIGN.md` |
| OG images per page | 1 | Nice previews when links are shared in groups and chats |
| "Built by Softwara" footer link | 1 | From `site-config`; brings agency leads from developer visitors |
| Analytics events | 1 | Through one `track()` in `lib/analytics.ts`, behind an env flag, no file names or image data. Events: `tool_start {tool, files}`, `tool_success {tool, target?, outcome}`, `tool_error {tool, code}`, `download {tool, kind: 'single' \| 'zip'}`, `share {tool}` |
| Remember last options | 1 | `localStorage` with try/catch |
| PWA (install + offline) | 2 | Hand-written service worker caching the app shell and engine; no plugin |
| "Share Img Master" link after a success | 2 | Small text link, never a popup |

**Analytics choice (owner decides):** Cloudflare Web Analytics is free and cookie-free but only counts page views. To see tool events (which tools succeed or fail), use a privacy-friendly tool that supports custom events, such as Plausible or Umami. Because everything goes through `track()`, switching providers is a one-file change.

## 5. Money

### Stage A: launch to steady traffic (no ads)

Focus on speed and rankings. Ads on a brand-new site earn very little and can slow the pages down.

### Stage B: Google AdSense

When the site has steady daily traffic and all legal pages are in place:

- Apply for AdSense with the domain. It needs original content, a privacy policy and working navigation, which we already have.
- Placements (already reserved in the layout): one slot below results, one before the footer. **Never** above the tool, between steps, inside the sticky bar, or as interstitials.
- Visitors from the EEA, UK and Switzerland must see a Google-certified consent banner (CMP) before ads use cookies. Google's own "Privacy & messaging" tool in AdSense is one option.
- Update the privacy policy to cover ads and cookies before turning ads on.
- Watch Core Web Vitals after enabling ads. If LCP or CLS gets worse, remove a slot.

### Stage C: agency leads

Developers and site owners using the favicon and WebP tools are potential clients for Softwara. The footer link and the About page carry that. Later, a short line on developer-focused pages ("Need image optimization built into your site? Softwara can help.") is fine; keep it quiet.

### Stage D: paid extras (only if demand appears)

Ideas to test much later: bulk processing of hundreds of images, a small paid API, or a desktop app. Don't build any of these until users ask.

## 6. Numbers to watch every week

| Metric | Where |
|---|---|
| Indexed pages, impressions, clicks, CTR, average position | Google Search Console |
| Visitors, top pages, countries | Analytics |
| Tool success rate, errors by code | Analytics events |
| Downloads per visit, shares | Analytics events |
| Lighthouse mobile scores | `npm run lhci` after each release |

## 7. Weekly rhythm (about 2 hours)

1. 30 min: Search Console review and one title/description fix (`SEO.md` §7).
2. 45 min: one new page or a substantial content improvement.
3. 30 min: 3–5 helpful community answers.
4. 15 min: record one short video.
