# Img Master — security notes

Owned by the lead. Last review: 2026-10-23 (whole codebase; static site, no backend).

## What protects the "no upload" promise

1. **No network code in the engine or UI.** No `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon` in `lib/`, `components/` or `app/`. The only outgoing calls are analytics through `track()` (off by default).
2. **Content Security Policy** in `public/_headers` with `connect-src 'self'`, `form-action 'none'`. Even a compromised script can't send data to another host: the browser blocks it. Verified in Chromium and WebKit: an off-site `fetch` POST and `sendBeacon` are both refused.
3. **No third-party scripts.** `script-src 'self' 'unsafe-inline'` (inline is required by Next's static export, which has no nonces).

## Headers (`public/_headers`, applied by Cloudflare and by `scripts/serve-static.mjs`)

| Header | Value / reason |
|---|---|
| Content-Security-Policy | `default-src 'self'`; scripts and styles self + inline; `img-src 'self' data: blob:` (thumbnails); `worker-src 'self' blob:` (Next starts the worker from a blob URL); `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`; `frame-ancestors 'none'` |
| X-Frame-Options | `DENY` (older browsers; CSP covers newer ones) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, payment, usb off |

HSTS is set in Cloudflare (SSL/TLS → Edge Certificates → HSTS) at deploy time, not in `_headers`.

**When analytics is turned on**, add its script host to `script-src` and its event endpoint to `connect-src` in `public/_headers`, otherwise the CSP blocks it. Update the privacy page at the same time.

## Reviewed and OK

- **XSS:** content is static and authored in the repo. `JsonLd` escapes `<`. `InlineText` only renders links to `/path`, `mailto:`, `http(s)://` (external links get `rel="noopener noreferrer"`); any other scheme renders as plain text.
- **File names / ZIP:** output names keep only letters, numbers, `-` and `_` (max 60 chars), so ZIP entries can't contain `/`, `\` or `..` (no zip-slip).
- **Image bombs:** dimensions are read from the file header and capped at `maxPixels` before full decode; unknown formats get one decode attempt and are then capped.
- **SVG input:** decoded only through `createImageBitmap`; thumbnails render via `<img>`, where SVG scripts never run.
- **localStorage:** options are parsed in try/catch and every value is validated against an allow-list before use.
- **Worker messages:** dedicated worker; only the page that created it can message it.
- **Local server (`scripts/serve-static.mjs`):** blocks path traversal; malformed URLs return 404 instead of crashing. Dev and QA use only.

## Dependencies

- Runtime (`next`, `react`, `react-dom`, `fflate`): `npm audit --omit=dev` → 0 vulnerabilities.
- Dev only (not shipped): 19 advisories (16 high), all in `@lhci/cli`'s puppeteer/proxy chain and `eslint-config-next`'s glob matcher. They run only on the developer's machine or CI. Re-check with `npm audit` before launch and when updating tools. Review what `npm audit fix --force` would change before running it, since it can install breaking major versions.

## Accepted risks

- `'unsafe-inline'` in `script-src` (Next static export). Mitigated by having no user-generated content and no third-party scripts.
- No `Cross-Origin-Opener-Policy`: with `same-origin` (or `same-origin-allow-popups`) Lighthouse aborts with `NO_NAVSTART` (QA-01, 2026-10-23). The site opens no popups and embeds nothing cross-origin, so the protection it would add is small.
