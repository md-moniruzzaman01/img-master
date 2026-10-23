// Home page text (DESIGN.md §3.2). Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { HomeContent } from '@/lib/types';

export const homeContent: HomeContent = {
  title: 'Img Master – Free Image Tools for Your Phone',
  description:
    'Compress photos to an exact size like 50KB, convert JPG, PNG and WebP, and make favicons. Runs in your browser, so nothing is uploaded. Free, no signup.',
  h1: 'Free Image Tools. No Upload. No Signup.',
  subtitle: 'Compress photos, convert formats and make favicons right on your phone.',
  sizeRowHeading: 'Compress to a size',
  trustItems: ['No upload', 'No signup', 'No watermark', 'Free'],
  howItWorks: {
    heading: 'How Img Master works',
    paragraphs: [
      'Img Master runs in your web browser. When you choose an image, your own phone or computer does the work. The image never leaves your device, and the result is ready quickly even on slow mobile data.',
      `Pick a tool, choose your images and download the result. You can work on up to ${siteConfig.maxFiles} images at once, save them together as a ZIP, or share a result straight to another app on phones that support it. Every new file is saved without hidden photo data, such as GPS location.`,
      'Building a website? The [Favicon Generator](/favicon-generator) turns a logo, letters or an emoji into the icon files your site needs, in one ZIP.',
    ],
  },
  faqs: [
    {
      q: 'Is Img Master really free?',
      a: 'Yes. Every tool is free to use, with no signup, no watermark and no daily limit.',
    },
    {
      q: 'Are my photos uploaded?',
      a: 'No. All processing happens in your browser, on your own device. Your images are never sent to us or to anyone else.',
    },
    {
      q: 'Which image formats can I use?',
      a: 'You can open JPG, PNG, WebP, GIF and BMP images, plus other formats your browser supports, such as HEIC in Safari. You can save as JPG, PNG or WebP. The favicon tools save ICO and PNG files, plus SVG for text and emoji icons.',
    },
    {
      q: 'Will an online form accept the compressed file?',
      a: 'Each compress-to-size result stays under the limit whether the website counts 1KB as 1,000 or 1,024 bytes. Forms can have other rules too, such as pixel size or file type, so always read the instructions on the form.',
    },
  ],
  updatedAt: '2026-10-24',
};
