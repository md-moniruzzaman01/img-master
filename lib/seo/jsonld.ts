// Structured data builders (docs/SEO.md §5). Owned by seo-content.
// Rules: no aggregateRating, no review, no HowTo. FAQPage text must match the
// visible FAQs, so answers are converted from the inline syntax to plain text.
import { homeContent } from '@/content/home';
import { siteConfig } from '@/lib/site-config';
import { getBreadcrumbs } from '@/lib/tools';
import type { ToolContent, ToolDefinition } from '@/lib/types';
import { absoluteUrl, toPlainText } from './url';

type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

/** Logo used by Organization and as the publisher logo (512×512 PNG). */
export const LOGO_PATH = '/og/logo.png';

function websiteId(): string {
  return `${absoluteUrl('/')}#website`;
}
function organizationId(): string {
  return `${absoluteUrl('/')}#organization`;
}

function organization(): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId(),
    name: siteConfig.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl(LOGO_PATH),
    email: siteConfig.contactEmail,
    founder: { '@type': 'Person', name: siteConfig.owner.name },
    parentOrganization: {
      '@type': 'Organization',
      name: siteConfig.owner.company,
      url: siteConfig.owner.companyUrl,
    },
  };
}

/** Home page: WebSite + Organization. */
export function homeJsonLd(): object[] {
  return [
    {
      '@context': CONTEXT,
      '@type': 'WebSite',
      '@id': websiteId(),
      name: siteConfig.name,
      url: absoluteUrl('/'),
      description: homeContent.description,
      inLanguage: 'en',
      publisher: { '@id': organizationId() },
    },
    organization(),
  ];
}

/** Tool page: WebApplication + BreadcrumbList (same crumbs as the page) + FAQPage. */
export function toolJsonLd(tool: ToolDefinition, content: ToolContent): object[] {
  const url = absoluteUrl(`/${tool.slug}`);
  const crumbs = getBreadcrumbs(tool.slug);

  const app: JsonLd = {
    '@context': CONTEXT,
    '@type': 'WebApplication',
    name: content.h1,
    url,
    description: content.description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements:
      'Requires JavaScript. Works in current versions of Chrome, Safari, Firefox and Edge.',
    isAccessibleForFree: true,
    inLanguage: 'en',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': organizationId() },
  };

  const breadcrumbs: JsonLd = {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.href ? absoluteUrl(c.href) : url,
    })),
  };

  const out: object[] = [app, breadcrumbs];

  if (content.faqs.length > 0) {
    out.push({
      '@context': CONTEXT,
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((f) => ({
        '@type': 'Question',
        name: toPlainText(f.q),
        acceptedAnswer: { '@type': 'Answer', text: toPlainText(f.a) },
      })),
    });
  }
  return out;
}
