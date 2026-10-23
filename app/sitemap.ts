// sitemap.xml (docs/SEO.md §5). Owned by seo-content.
// Lists home, every live tool and the legal pages. Drafts are never listed.
import type { MetadataRoute } from 'next';
import { homeContent } from '@/content/home';
import { legalContent } from '@/content/legal';
import { getLiveTools, getToolContent } from '@/lib/tools';
import { absoluteUrl } from '@/lib/seo/url';

// Required for `output: 'export'`: render this route once at build time.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl('/'),
    lastModified: homeContent.updatedAt,
  };

  const toolPages = getLiveTools().flatMap((tool) => {
    const content = getToolContent(tool.slug);
    if (!content) return [];
    return [{ url: absoluteUrl(`/${tool.slug}`), lastModified: content.updatedAt }];
  });

  const legalPages = Object.values(legalContent).map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    lastModified: page.updatedAt,
  }));

  return [home, ...toolPages, ...legalPages];
}
