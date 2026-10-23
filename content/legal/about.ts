// About page (SEO.md §6). Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { LegalContent } from '@/lib/types';

const { owner, contactEmail, name } = siteConfig;

export const aboutContent: LegalContent = {
  slug: 'about',
  title: `About Us | ${name}`,
  description: `${name} is a set of free image tools that run in your browser. Learn who makes it, why it exists, and how it keeps your photos on your device.`,
  h1: `About ${name}`,
  sections: [
    {
      heading: `Who runs ${name}`,
      paragraphs: [
        `${name} is built and run by ${owner.name} through [${owner.company}](${owner.companyUrl}).`,
      ],
    },
    {
      heading: 'Why it exists',
      paragraphs: [
        'Many people need to make a photo smaller or change its format to fill in an online form, send an email or publish a website. Often they are on a phone with slow mobile data.',
        `Most online tools ask you to upload the photo, wait, and then download it again. ${name} was made to do the same job faster and more privately, directly on your phone, with big buttons and as little reading as possible.`,
      ],
    },
    {
      heading: 'How it works',
      paragraphs: [
        'Every tool runs inside your web browser. Your device opens the image, compresses or converts it, and gives you the new file. Images are never uploaded, because there is no server that receives them.',
        'Each new file is saved without hidden photo data, such as GPS location. The tools are free, with no signup and no watermark.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Questions, ideas or a problem to report? Email [${contactEmail}](mailto:${contactEmail}).`,
      ],
    },
  ],
  updatedAt: '2026-10-23',
};
