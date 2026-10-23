// Terms of use (SEO.md §6): short, plain, "provided as is". Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { LegalContent } from '@/lib/types';

const { name, contactEmail } = siteConfig;

export const termsContent: LegalContent = {
  slug: 'terms',
  title: `Terms of Use | ${name}`,
  description: `The rules for using ${name}: free image tools that run in your browser, provided as is. Your images stay yours, and you decide how to use them.`,
  h1: 'Terms of use',
  sections: [
    {
      heading: `Using ${name}`,
      paragraphs: [
        `${name} is free to use for personal or work purposes. By using the site, you agree to these terms. If you do not agree, please do not use the site.`,
        'Do not use the site to break the law, or to try to harm the site or its visitors.',
      ],
    },
    {
      heading: 'Your images',
      paragraphs: [
        'You keep all rights to your images. They are processed on your own device, so we never receive a copy.',
        'You are responsible for having the right to use the images you work on. You are also responsible for checking that a result meets the rules of any form or website where you upload it.',
      ],
    },
    {
      heading: 'Provided as is',
      paragraphs: [
        `${name} is provided "as is", without any warranty. We work to keep the tools accurate, but we cannot promise that every result will be accepted by every form, or that the site will always be available. Always keep your original files.`,
        'As far as the law allows, we are not responsible for any loss or damage that comes from using the site.',
      ],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        'We may update these terms. The date at the top of this page shows the latest version.',
        `Questions? Email [${contactEmail}](mailto:${contactEmail}).`,
      ],
    },
  ],
  updatedAt: '2026-10-23',
};
