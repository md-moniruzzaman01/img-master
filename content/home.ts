// Home page text (DESIGN.md §3.2). Owned by seo-content.
import { siteConfig } from '@/lib/site-config';
import type { HomeContent } from '@/lib/types';

export const homeContent: HomeContent = {
  title: 'Img Master – Free Image Tools for Your Phone',
  description:
    'Compress photos to an exact size like 50KB, and convert between JPG, PNG and WebP. Runs in your browser, so nothing is uploaded. Free, no signup.',
  h1: 'Free image tools that work on your phone',
  subtitle: 'Shrink a photo to an exact size or change its format. No upload, no signup.',
  sizeRowHeading: 'Compress to a size',
  trustItems: ['No upload', 'No signup', 'No watermark', 'Free'],
  howItWorks: {
    heading: 'How Img Master works',
    paragraphs: [
      'Img Master runs in your web browser. When you choose an image, your own phone or computer does the work. The image is not uploaded to any server, so it stays private, and the result is ready quickly even on slow mobile data.',
      `Pick a tool, choose your images and download the result. You can work on up to ${siteConfig.maxFiles} images at once, save them together as a ZIP, or share a result straight to another app on phones that support it. Every new file is saved without hidden photo data, such as GPS location.`,
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
      a: 'You can open JPG, PNG, WebP, GIF and BMP images, plus other formats your browser supports, such as HEIC in Safari. You can save as JPG, PNG or WebP.',
    },
    {
      q: 'Will an online form accept the compressed file?',
      a: 'Each compress-to-size result stays under the limit whether the website counts 1KB as 1,000 or 1,024 bytes. Forms can have other rules too, such as pixel size or file type, so always read the instructions on the form.',
    },
  ],
  updatedAt: '2026-10-23',
};
