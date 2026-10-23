// Brand, URL, contact and feature flags. Owned by the lead.
// Changing the brand or domain later means editing only this file.

export type AnalyticsProvider = 'none' | 'cloudflare' | 'plausible' | 'umami';

function readAnalyticsProvider(): AnalyticsProvider {
  const v = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  return v === 'cloudflare' || v === 'plausible' || v === 'umami' ? v : 'none';
}

export const siteConfig = {
  name: 'Img Master',
  tagline: 'Shrink, convert and make icons on your phone. Free, instant, private.',

  /**
   * PLACEHOLDER: the real domain isn't chosen yet. Set it here (apex, https,
   * no trailing slash) before launch. Canonicals, sitemap and OG tags use it.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://img-master.example',

  contactEmail: 'softwaraltd@gmail.com',
  owner: {
    name: 'Md Moniruzzaman',
    company: 'Softwara',
    companyUrl: 'https://softwara.com',
  },
  credit: { label: 'Built by Softwara', url: 'https://softwara.com' },

  /** Max files per batch (PRODUCT.md §4.5). */
  maxFiles: 20,

  ads: {
    enabled: false,
    /** Allowed positions only (GROWTH.md §5). */
    positions: ['below-results', 'before-footer'] as const,
  },

  analytics: {
    /** Set NEXT_PUBLIC_ANALYTICS_PROVIDER at build time. Default 'none'. */
    provider: readAnalyticsProvider(),
    /** e.g. plausible.io or your Umami host; used by the privacy page and QA. */
    host: process.env.NEXT_PUBLIC_ANALYTICS_HOST ?? '',
    /** Umami website id or Cloudflare beacon token, when used. */
    siteId: process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID ?? '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
