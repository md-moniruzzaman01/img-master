# Deploy Img Master to Cloudflare

Img Master is a fully static site. `npm run build` writes every page to `out/`, and Cloudflare serves those files. There is no server code, no database and no secrets.

The setup uses **Cloudflare Workers static assets**, configured in `wrangler.jsonc`:

- `assets.directory: ./out` serves the build output.
- `not_found_handling: 404-page` sends unknown URLs to `out/404.html` with a 404 status.
- `html_handling: auto-trailing-slash` serves `/about` from `about.html` and redirects `/about/` to `/about`. This matches `trailingSlash: false` in `next.config.ts`.
- `public/_headers` is copied to `out/_headers` and applied by Cloudflare (CSP, caching, OG image content type).

Static asset requests on Workers are free.

---

## 0. Before the first deploy

1. **Choose the domain** and add it to Cloudflare (Websites → Add a site). Use Cloudflare's nameservers at your registrar. Wait until the zone shows **Active**.
2. **Decide on the canonical host.** We use the apex (`https://yourdomain.com`), and `www` redirects to it (SEO.md §148).
3. **Check that the build passes locally:**

   ```sh
   npm ci
   npm run lint && npm run typecheck && npm run test
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com npm run build
   npm run test:e2e
   npm run lhci
   ```

   Then check that `out/sitemap.xml` and `out/robots.txt` use your real domain and not `img-master.example`.

> **`NEXT_PUBLIC_SITE_URL` is required.** Without it, canonical links, the sitemap, `robots.txt`, Open Graph tags and JSON-LD all point to the placeholder `https://img-master.example`. It is read at **build** time, so set it wherever the build runs. You can also change the fallback in `lib/site-config.ts` once the domain is final.

---

## 1. Deploy

Pick **one** option. Option A is recommended because every push to `main` deploys automatically.

### Option A: Git integration (Workers Builds)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**. Connect GitHub and pick `md-moniruzzaman01/img-master`.
2. Build settings:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` |

3. **Build variables** (Settings → Build → Variables and secrets):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (apex, https, no trailing slash) |
   | `NODE_VERSION` | `22` (the project needs Node ≥ 20.9) |

4. Save and deploy. The first build gives you a `*.workers.dev` preview URL. Open it on your phone and test a tool before you attach the domain.

Builds for other branches give preview URLs, which is useful for testing a branch on a real phone.

### Option B: Manual deploy from your computer

```sh
NEXT_PUBLIC_SITE_URL=https://yourdomain.com npm run build
npx wrangler login        # once, opens the browser
npx wrangler deploy       # uploads out/ using wrangler.jsonc
```

`npx` downloads Wrangler temporarily. It is not a project dependency. Adding it to `package.json` needs the owner's approval (CLAUDE.md rule 7).

In PowerShell, set the variable like this instead:
`$env:NEXT_PUBLIC_SITE_URL="https://yourdomain.com"; npm run build`

---

## 2. Custom domain, `www` redirect and HTTPS

1. **Attach the apex:** Workers & Pages → `img-master` → **Settings → Domains & Routes → Add → Custom domain** → `yourdomain.com`. Cloudflare creates the DNS record and the certificate.
2. **Redirect `www` to the apex:**
   - DNS → add record: type `AAAA`, name `www`, content `100::`, **Proxied** (orange cloud). This placeholder lets Cloudflare catch the request.
   - Rules → **Redirect Rules** → Create from template **"Redirect from WWW to root"**. Use a 301 and keep the query string.
3. **HTTPS:** SSL/TLS → Edge Certificates:
   - **Always Use HTTPS:** On
   - **Minimum TLS version:** 1.2
   - **HSTS:** enable it with `max-age` of 6 months to start. Leave **preload off** until the site has run without problems for a while, because preload is hard to undo. HSTS is set here, not in `_headers` (SECURITY.md).
4. Turn off anything that rewrites pages, because it can break the CSP or the HTML: **Rocket Loader off**. The Speed → Optimization settings for HTML/JS changes should stay off, since Next already minifies.

---

## 3. Check the live site

Run these after every first deploy to a new domain (replace the domain):

```sh
# Pages and redirects
curl -sI https://yourdomain.com/                    # 200
curl -sI https://yourdomain.com/compress-image      # 200
curl -sI https://yourdomain.com/compress-image/     # 307/308 to /compress-image
curl -sI https://www.yourdomain.com/                # 301 to https://yourdomain.com/
curl -sI http://yourdomain.com/                     # redirect to https
curl -sI https://yourdomain.com/no-such-page        # 404

# Headers from public/_headers
curl -sI https://yourdomain.com/ | grep -iE "content-security-policy|x-frame-options|strict-transport"
curl -sI https://yourdomain.com/compress-image/opengraph-image | grep -i content-type   # image/png

# Real domain everywhere
curl -s https://yourdomain.com/robots.txt
curl -s https://yourdomain.com/sitemap.xml | grep -c "<loc>https://yourdomain.com"     # 26
curl -s https://yourdomain.com/ | grep -c "img-master.example"                        # 0
```

Then, on your phone:

- Compress a real 3 MB photo on `/compress-image-to-50kb`. The result must be under 50,000 bytes and look acceptable (KICKOFF.md, definition of done).
- On a computer, open DevTools → Network, run each tool once and confirm **no request carries image data**.
- Run PageSpeed Insights (mobile) on `/` and `/compress-image`. The target is ≥ 95 in every category.

---

## 4. Search engines (on launch day)

### Google Search Console

1. Go to <https://search.google.com/search-console> → **Add property** → **Domain** → `yourdomain.com`.
2. Google shows a `TXT` record. Add it in Cloudflare DNS (type `TXT`, name `@`), then click **Verify**. Cloudflare may also offer to add it automatically.
3. **Sitemaps** → submit `https://yourdomain.com/sitemap.xml`.
4. **URL inspection** → request indexing for `/` and the main tool pages (`/compress-image`, `/compress-image-to-50kb`, `/image-converter`, `/favicon-generator`).

### Bing Webmaster Tools

1. Go to <https://www.bing.com/webmasters> → **Import from Google Search Console**. This copies the verified site and sitemap. You can also add the site and verify it with a DNS record.
2. Check that the sitemap is listed under **Sitemaps**.

---

## 5. Analytics (optional)

Analytics is **off** by default (`NEXT_PUBLIC_ANALYTICS_PROVIDER` unset = `none`). The CSP blocks every third-party script and connection. That is what guarantees no image data can leave the device, so every analytics change must also change the CSP.

### Cloudflare Web Analytics (page views only, free, no cookies)

Nothing in the code needs to change.

1. Dashboard → **Analytics & Logs → Web Analytics** → add the site and choose **automatic setup**. Cloudflare injects its beacon into proxied pages.
2. Allow the beacon in `public/_headers` (add to the existing CSP line):
   - `script-src` → add `https://static.cloudflareinsights.com`
   - `connect-src` → add `https://cloudflareinsights.com`
3. Set the build variable `NEXT_PUBLIC_ANALYTICS_PROVIDER=cloudflare` so the privacy page and QA know about it.
4. Update the privacy page text (`content/legal/`) to say that page views are counted without cookies.
5. Rebuild, deploy, and confirm the beacon loads without CSP errors in the browser console.

### Plausible or Umami (page views + tool events)

> **Not ready yet.** `lib/analytics.ts` sends events to `window.plausible` / `window.umami`, but no component loads their script, so setting the variable alone records nothing. Loading the script needs a code change in `app/layout.tsx`, plus a CSP update and a privacy page update. Ask the lead to add it before you choose one of these.

---

## 6. Ads (later)

Ads stay off (`ads.enabled: false` in `lib/site-config.ts`) until traffic is steady (GROWTH.md, Stage A). Turning them on needs CSP changes for the ad network and a privacy page update. Plan that as its own task.

---

## 7. Updating and rolling back

- **Update:** push to `main` (Option A) or run `npm run build && npx wrangler deploy` (Option B). Run lint, typecheck, tests and the build first.
- **Roll back:** Workers & Pages → `img-master` → **Deployments** → pick the previous version → **Rollback**, or `npx wrangler rollback`.
- **Cache:** hashed files in `/_next/static/*`, `/samurai/*` and `/sounds/*` are cached for a year. HTML is not, so a new deploy shows up right away. When a samurai sprite or sound file changes, bump its `?v=N` (see the comment in `public/_headers`).
