// About page (SEO.md §6; Figma desktop-about-*). Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { LegalContent } from '@/lib/types';

const { owner, contactEmail, name } = siteConfig;

export const aboutContent: LegalContent = {
  slug: 'about',
  title: `About Us | ${name}`,
  description: `${name} is a set of free image tools that run in your browser. Learn who makes it, why it exists, and how it keeps your photos on your device.`,
  h1: 'One clean cut.',
  eyebrow: 'About',
  intro: [
    'Ittō ryōdan (一刀両断) means cutting something in two with a single stroke. In Japanese it also means making a decision cleanly, without hesitation. That is what we wanted from image tools.',
    `Many image sites upload your photo to their server first, then make you wait. ${name} runs inside your browser instead. You pick a size, drop your image, and the new file is made on your own device.`,
  ],
  values: [
    {
      glyph: '義',
      title: 'Respect your files',
      text: 'Your photos never leave your device. There is nothing for us to keep, sell or lose.',
    },
    {
      glyph: '誠',
      title: 'Say what it does',
      text: 'Every result shows its new file size and pixel size, and tells you what changed. No surprises.',
    },
    {
      glyph: '勇',
      title: 'Stay simple',
      text: 'One tool per job, with sensible defaults. You can finish on a phone with one thumb.',
    },
  ],
  sections: [
    {
      heading: `Who runs ${name}`,
      paragraphs: [
        `${name} is built and run by ${owner.name} through [${owner.company}](${owner.companyUrl}), a small software studio in Dhaka.`,
      ],
    },
    {
      heading: 'Why it exists',
      paragraphs: [
        'Many people need to make a photo smaller or change its format to fill in an online form, send an email or publish a website. Often they are on a phone with slow mobile data.',
        `Most online tools ask you to upload the photo, wait, and then download it again. ${name} was made to do the same job more privately, directly on your phone, with big buttons and as little reading as possible.`,
      ],
    },
    {
      heading: 'How the tools work',
      paragraphs: [
        'Every tool runs inside your web browser. Your device opens the image, compresses or converts it, and gives you the new file. Images are never uploaded, because there is no server that receives them. [How it works](/how-it-works) explains each step.',
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
  updatedAt: '2026-10-25',
};
