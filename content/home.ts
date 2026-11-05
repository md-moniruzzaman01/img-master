// Home page text (docs/superpowers/specs/2026-10-25-figma-redesign.md §5.1). Owned by seo-content.
// Honesty rules (CLAUDE.md rule 8): no official form limits, no timing promises
// we have not measured, no example numbers on the compare slider.
import type { HomeContent } from '@/lib/types';

export const homeContent: HomeContent = {
  title: 'Img Master – Free Image Tools for Your Phone',
  description:
    'Compress photos to an exact size like 50 KB, convert JPG, PNG and WebP, and make favicons. Runs in your browser, so nothing is uploaded. Free, no signup.',
  eyebrow: 'Free image tools',
  h1: 'Cut any image down to size.',
  h1Accent: 'size.',
  subtitle:
    'Pick a size, drop your photo and download the result. It runs on your phone or laptop, and your image never leaves your device.',
  // "Results in about a second" is not used: in our own tests a 12 MP phone photo
  // took about 3 seconds (median) on emulated phones (reports/data/compress-matrix.ndjson).
  trustItems: ['Works in your browser', 'Built for phones first', 'No sign-up, no watermark'],
  compress: {
    heading: 'Compress to an exact size',
    intro:
      'Many upload forms reject a file that is over their limit. Pick the limit, and we find the highest quality that still fits under it.',
  },
  convert: {
    heading: 'Convert between formats',
    intro:
      'For when a site does not take WebP, or you need to keep a transparent background. Pick the pair.',
  },
  compare: {
    heading: 'See the cut before you trust it',
    intro:
      'Drag the line to compare. After you compress your own photo, the Compare button shows the original and the result in the same way.',
    originalLabel: 'Original',
    resultLabel: 'Result',
  },
  values: [
    {
      glyph: '無',
      title: 'Never uploaded',
      text: 'Your browser does the work. Images stay on your device, so there is nothing on a server to leak.',
    },
    {
      glyph: '精',
      title: 'Exact size, most detail',
      text: 'We try many quality levels and keep the highest one that still fits under your limit.',
    },
    {
      glyph: '速',
      title: 'Quick to open on a phone',
      text: 'Light pages made for a small screen and mobile data. No app to install, no account.',
    },
  ],
  favicon: {
    heading: 'Your site’s family crest',
    intro:
      'A favicon is like a family crest (a "mon" in Japanese) for your website: the small mark people see in a row of browser tabs. Make one from an image, letters or an emoji.',
  },
  howItWorks: {
    heading: 'How it works',
    paragraphs: [
      'Pick a target size, drop your photo, and download the result. The whole process runs inside your browser using a Web Worker — no data is sent to any server.',
      'We try many quality levels and keep the highest one that still fits under your limit. When quality alone is not enough, we shrink the dimensions too, but only as a last step.',
    ],
  },
  faqHeading: 'Questions people ask first',
  faqs: [
    {
      q: 'Is my image uploaded anywhere?',
      a: 'No. The work happens inside your browser, on your own device. When you close the tab, nothing is left anywhere except the files you downloaded.',
    },
    {
      q: 'Why is my result a little under 50 KB?',
      a: 'Upload forms reject a file that is over the limit, even by one byte. We stop a little below it and count 1 KB as 1,000 bytes, so the file also passes forms that count 1 KB as 1,024 bytes.',
    },
    {
      q: 'Will my photo look worse?',
      a: 'A smaller file always loses some detail. We keep the highest quality that fits, and we make the picture smaller in pixels only when quality alone is not enough. Use Compare on the result to check it yourself.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes. It works in current versions of Chrome, Safari, Firefox and Edge, on Android, iPhone and computers. There is no app to install and no account to create.',
    },
  ],
  cta: {
    heading: 'Drop an image anywhere on this page.',
    text: 'We’ll cut it to 50 KB. Pick another size above if you need to.',
    button: 'Choose an image',
  },
  updatedAt: '2026-10-25',
};
