// robots.txt (docs/SEO.md §5). Owned by seo-content.
import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/url';

// Required for `output: 'export'`: render this route once at build time.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
