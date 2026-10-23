// Contact page (SEO.md §6): an email link only, no form (there is no backend).
// Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { LegalContent } from '@/lib/types';

const { name, contactEmail, owner } = siteConfig;

export const contactContent: LegalContent = {
  slug: 'contact',
  title: `Contact | ${name}`,
  description: `Get in touch with ${name} by email. Report a problem with a tool, suggest a new size or format, or ask a question about the site.`,
  h1: 'Contact',
  sections: [
    {
      heading: 'Email us',
      paragraphs: [
        `The best way to reach ${name} is by email: [${contactEmail}](mailto:${contactEmail}).`,
        'If you are reporting a problem, please tell us which tool page you used, your phone or computer, and your browser (for example, Chrome on Android). Please do not attach private photos. We do not need them to help.',
      ],
    },
    {
      heading: 'What you can write about',
      paragraphs: ['For example:'],
      list: [
        'A tool did not work or showed an error',
        'A size or format you would like to see added',
        'A mistake in the text on a page',
        `Business questions for [${owner.company}](${owner.companyUrl})`,
      ],
    },
  ],
  updatedAt: '2026-10-23',
};
