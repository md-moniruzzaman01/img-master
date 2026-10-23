// Privacy policy (SEO.md §6). Owned by seo-content.
// The analytics and ads sections are built from lib/site-config.ts, so this
// page always describes how the site is actually configured at build time.
import { siteConfig, type AnalyticsProvider } from '@/lib/site-config';
import type { LegalContent, RichSection } from '@/lib/types';

const { name, contactEmail } = siteConfig;
const email = `[${contactEmail}](mailto:${contactEmail})`;

const providerNames: Record<Exclude<AnalyticsProvider, 'none'>, string> = {
  cloudflare: 'Cloudflare Web Analytics',
  plausible: 'Plausible Analytics',
  umami: 'Umami',
};

export function analyticsParagraphs(provider: AnalyticsProvider): string[] {
  if (provider === 'none') {
    return [
      `${name} does not use any analytics service at the moment. We do not track your visits.`,
    ];
  }
  if (provider === 'cloudflare') {
    return [
      `We use ${providerNames.cloudflare} to count page views. It does not use cookies. It gives us totals, such as how many people opened a page, and never receives your images or file names.`,
    ];
  }
  return [
    `We use ${providerNames[provider]} to count page views and a few tool events, such as when a tool finishes or shows an error. It does not use cookies.`,
    'These events contain only details such as the tool name, the number of files, the target size and whether it worked. They never contain your images, file names or anything you type.',
  ];
}

export function adsParagraphs(adsEnabled: boolean): string[] {
  if (!adsEnabled) {
    return [
      `There are no ads on ${name} at the moment, and ${name} itself does not set any cookies. If ads are added later, this page will be updated first to explain what the ad provider collects and how to opt out.`,
    ];
  }
  return [
    `${name} shows ads to cover its costs. The ad provider may use cookies or similar technology to show ads and measure them. Where the law requires it, you will be asked for consent first.`,
    'Ads never have access to your images, because your images never leave your device.',
  ];
}

const sections: RichSection[] = [
  {
    heading: 'The short version',
    paragraphs: [
      `Your images never leave your device. ${name} processes them in your browser, and we never receive, see or store them.`,
    ],
  },
  {
    heading: 'Your images',
    paragraphs: [
      'When you choose an image, your browser reads it and processes it on your phone or computer. It is not uploaded to us or to any other service.',
      'When you close or reload the page, the images and results are cleared from it. Files you downloaded stay on your device until you delete them. New files are saved without hidden photo data, such as GPS location.',
    ],
  },
  {
    heading: 'Settings saved on your device',
    paragraphs: [
      "Each tool remembers your last options, such as the target size or quality, in your browser's local storage. This data stays on your device, contains no images, and is never sent to us. You can remove it at any time by clearing your browser's data for this site.",
    ],
  },
  {
    heading: 'Analytics',
    paragraphs: analyticsParagraphs(siteConfig.analytics.provider),
  },
  {
    heading: 'Ads and cookies',
    paragraphs: adsParagraphs(siteConfig.ads.enabled),
  },
  {
    heading: 'Hosting',
    paragraphs: [
      'The website is hosted on Cloudflare. Like any web host, Cloudflare processes technical data such as your IP address and browser type to deliver the pages and protect the site from attacks. We do not use this data to identify you.',
    ],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      'If anything on this page changes, we will update it and the date at the top.',
      `Questions about privacy? Email ${email}.`,
    ],
  },
];

export const privacyContent: LegalContent = {
  slug: 'privacy',
  title: `Privacy Policy | ${name}`,
  description: `How ${name} handles your data: images are processed in your browser and never uploaded. What we store on your device, analytics, ads and contact.`,
  h1: 'Privacy policy',
  sections,
  updatedAt: '2026-10-23',
};
