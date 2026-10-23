# Img Master — Claude Code starter kit

This kit tells Claude Code exactly what to build, how, and in what order, using one lead session and four specialist subagents working in parallel.

## What's inside

```
img-master-kit/
├─ KICKOFF.md              ← the prompt you paste into Claude Code
├─ CLAUDE.md               ← project rules every agent loads automatically
├─ docs/
│  ├─ PRODUCT.md           ← audience, every page, features, user flows
│  ├─ DESIGN.md            ← mobile-first design system, layouts, components, copy
│  ├─ ENGINE.md            ← how the in-browser image engine works
│  ├─ SEO.md               ← how pages are built to rank, content rules
│  └─ GROWTH.md            ← how to get users and earn money (your plan)
└─ .claude/
   ├─ settings.json        ← lets agents run npm/test commands without asking each time
   └─ agents/
      ├─ ui-builder.md     ← design system + components
      ├─ image-engine.md   ← compression, conversion, favicons
      ├─ seo-content.md    ← page text, metadata, sitemap
      └─ qa-reviewer.md    ← tests, audits, benchmarks (reports only)
```

## How the agents split the work

| Agent | Owns | Runs in |
|---|---|---|
| Lead (your main session) | Routes, shared types, registry, config, integration, git | every phase |
| ui-builder | `components/`, `app/globals.css` | Phases 1, 4 |
| image-engine | `lib/image-engine/` | Phases 1, 4 |
| seo-content | `content/`, `lib/seo/`, sitemap, OG images | Phases 1, 4, 5 |
| qa-reviewer | `e2e/`, `reports/` | Phases 3, 4, 5 |

Each agent writes only in its own folders, so they can run at the same time without overwriting each other.

## Steps

1. **Pick and buy the domain** (check availability first). Put it in the settings block at the top of `KICKOFF.md`, along with your contact email.
2. **Create an empty project folder** (for example `img-master`) and copy everything from this kit into it, including the hidden `.claude` folder.
3. **Open Claude Code in that folder** and paste the part of `KICKOFF.md` below the line.
4. **Answer at each ⏸ checkpoint.** There are five. The most important is Phase 2, where you test the first page on your own phone.
5. **Before Phase 3**, put 5–10 real sample files in `e2e/fixtures/real/`: a few phone photos, a photo of a signature, a screenshot (PNG), a logo with a transparent background (PNG) and a WebP image. Real photos make the tests and the "Typical results" tables meaningful.
6. **After Phase 5**, follow the generated `DEPLOY.md` to go live on Cloudflare and submit the sitemap to Google Search Console the same day.

## Tips

- **Usage limits:** parallel subagents use your plan's limits faster. If you hit them, tell the lead "run one subagent at a time". The QA agent already runs on Sonnet to save usage; you can change `model:` in any agent file.
- **If an agent drifts**, stop it and point it back to the relevant doc section ("follow DESIGN.md §4.3").
- **Changing the brand or domain later** only means editing `lib/site-config.ts`.
- **Hosting:** use Cloudflare's free hosting. Vercel's free plan doesn't allow sites with ads.
