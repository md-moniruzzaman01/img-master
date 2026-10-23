// Absolute URL helpers. Owned by seo-content.
// Every canonical, sitemap entry and JSON-LD URL is built from siteConfig.url,
// so changing the domain later is a one-line edit in lib/site-config.ts.
import { siteConfig } from '@/lib/site-config';

/** The site origin without a trailing slash, e.g. "https://example.com". */
export function siteOrigin(): string {
  return siteConfig.url.replace(/\/+$/, '');
}

/**
 * Absolute canonical URL for a path. Never a trailing slash. The home page is
 * the bare origin ("https://example.com"), because that is the form Next.js
 * writes for the home canonical and og:url; the sitemap and JSON-LD use the
 * same form so every place agrees.
 */
export function absoluteUrl(path: string): string {
  const clean = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  return clean === '' ? siteOrigin() : `${siteOrigin()}${clean}`;
}

/** Turn the inline content syntax (**bold**, [text](url)) into plain text. */
export function toPlainText(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
