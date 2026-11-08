import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'webp to jpg',
  secondaryKeywords: [
    'convert webp to jpg',
    'webp to jpeg',
    'change webp to jpg',
    'save webp as jpg',
    'open webp file',
    'webp converter',
  ],
  shortName: 'WebP to JPG',
  cardDescription: 'For forms and old apps.',
  title: 'Convert WebP to JPG Online – Free, No Upload | Img Master',
  description:
    'Change WebP images into JPG files that open in older apps and upload to most forms. Works on your phone, many files at once, nothing uploaded. Free.',
  h1: 'Convert WebP to JPG',
  h1Accent: 'JPG',
  subtitle: 'Convert WebP to JPG so your image opens in older apps, email and most upload forms.',
  sideTip: 'Transparent parts of a WebP become the fill color you pick. White suits most forms.',
  howTo: [
    'Pick the .webp file from your downloads or gallery.',
    'It is changed to JPG the moment you pick it.',
    'Tap Download to keep the JPG, or Share to send it on.',
  ],
  howToHeading: 'How to convert WebP to JPG',
  sections: [
    {
      heading: 'Why convert WebP to JPG?',
      paragraphs: [
        'Many websites now serve their images as WebP, because the files are smaller. When you save an image from such a site, your phone keeps it as WebP. JPG is the safer choice when you need to send or upload that image somewhere else:',
      ],
      list: [
        'Some upload forms accept only JPG or PNG.',
        'Some older photo apps and image viewers cannot open WebP.',
        'JPG shows a preview in almost every email and chat app.',
        'Print shops and photo kiosks accept JPG.',
      ],
    },
    {
      heading: 'What changes in the file',
      paragraphs: ['The JPG looks like the original. These are the differences to know about:'],
      table: {
        caption: 'WebP to JPG: what changes',
        headers: ['Part of the file', 'What happens'],
        rows: [
          ['Transparency', 'Filled with the color you pick (white by default)'],
          ['Animation', 'Only the first frame is kept'],
          ['Quality', 'Saved at 90 by default; move the slider for a smaller file'],
          ['Pixel size', 'Kept, unless the image is over 16.7 megapixels'],
          ['File size', 'Often a little larger than the WebP'],
          ['Hidden data', 'Location and camera details are not copied'],
        ],
      },
    },
    {
      heading: 'Converting many images at once',
      paragraphs: [
        `If you saved a whole set of images, choose them together (up to ${siteConfig.maxFiles}). Each one becomes a separate JPG with the same name, so **photo.webp** becomes **photo.jpg**. **Download all** puts them in one ZIP file.`,
        'On a phone that supports sharing files, the **Share** button sends the JPGs straight to WhatsApp, Messenger or email.',
      ],
    },
  ],
  tips: [
    'If the JPG must be under a size limit, such as 50 KB, use [Compress to 50 KB](/compress-image-to-50kb). It also accepts WebP files and saves a JPG.',
    'Need to keep a transparent background? Choose [WebP to PNG](/webp-to-png) instead.',
  ],
  faqs: [
    {
      q: "Why can't I open a WebP file on my phone?",
      a: 'Most new phones can show WebP images, but some apps and older devices cannot. Some upload forms also allow only JPG or PNG. Converting to JPG solves both problems.',
    },
    {
      q: 'Is JPG the same as JPEG?',
      a: 'Yes. JPG and JPEG are two names for the same format. A form that asks for JPEG accepts a .jpg file.',
    },
    {
      q: 'Will the JPG be bigger than the WebP?',
      a: 'Often, yes, a little. WebP packs images more tightly than JPG. If the new file is too big for a form, lower the quality slider or use a compress-to-size tool.',
    },
    {
      q: 'Can I convert WebP to JPG on iPhone?',
      a: 'Yes. Open this page in Safari or any other browser, choose the WebP image from Photos or Files, and download the JPG. Nothing needs to be installed.',
    },
    {
      q: 'Is the converted image stored on your server?',
      a: 'No. The conversion happens inside your browser. Your image never leaves your device.',
    },
  ],
  related: [
    'webp-to-png',
    'png-to-jpg',
    'image-converter',
    'compress-image-to-50kb',
    'jpg-to-webp',
  ],
  updatedAt: '2026-10-25',
};
