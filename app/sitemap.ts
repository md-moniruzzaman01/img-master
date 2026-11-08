// sitemap.xml (docs/SEO.md §5). Owned by seo-content.
// Lists home, the info pages, every live tool and the legal pages. Drafts are never listed.
import type { MetadataRoute } from 'next';
import { homeContent } from '@/content/home';
import { legalContent } from '@/content/legal';
import { howItWorksContent } from '@/content/pages/how-it-works';
import { toolsIndexContent } from '@/content/pages/tools-index';
import { getLiveTools, getToolContent } from '@/lib/tools';
import { absoluteUrl } from '@/lib/seo/url';

// Required for `output: 'export'`: render this route once at build time.
export const dynamic = 'force-static';

/** Info pages and their canonical paths (routes are app/tools and app/how-it-works). */
const INFO_PAGES = [
  { path: '/tools', content: toolsIndexContent },
  { path: '/how-it-works', content: howItWorksContent },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl('/'),
    lastModified: homeContent.updatedAt,
  };

  const infoPages = INFO_PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: p.content.updatedAt,
  }));

  const toolPages = getLiveTools().flatMap((tool) => {
    const content = getToolContent(tool.slug);
    if (!content) return [];
    return [{ url: absoluteUrl(`/${tool.slug}`), lastModified: content.updatedAt }];
  });

  const legalPages = Object.values(legalContent).map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    lastModified: page.updatedAt,
  }));

  return [home, ...infoPages, ...toolPages, ...legalPages];
}
