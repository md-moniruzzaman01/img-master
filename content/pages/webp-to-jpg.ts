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
  cardDescription: 'Turn WebP images into JPG files that open everywhere.',
  title: 'Convert WebP to JPG Online – Free, No Upload | Img Master',
  description:
    'Change WebP images into JPG files that open in any app and upload to any form. One tap on your phone, nothing uploaded, free with no signup.',
  h1: 'Convert WebP to JPG',
  subtitle: 'Convert WebP to JPG so your image opens in every app and uploads to any form.',
  howTo: [
    'Pick the .webp file from your downloads or gallery.',
    'It is changed to JPG the moment you pick it.',
    'Tap Download to keep the JPG, or Share to send it on.',
  ],
  howToHeading: 'How to convert WebP to JPG',
  sections: [
    {
      heading: 'Why you got a WebP file',
      paragraphs: [
        'Many websites now serve their images as WebP, because the files are smaller and pages load faster. When you save an image from such a site, your phone keeps it as WebP. Some older apps, photo editors and online forms do not accept it.',
        'Converting WebP to JPG fixes that. JPG is supported almost everywhere, from gallery apps to printing shops to upload forms.',
      ],
    },
    {
      heading: 'What changes when you go from WebP to JPG',
      paragraphs: [
        'The new file looks like the original, with a few differences you should know about:',
      ],
      list: [
        'The JPG is saved at quality 90 by default, which keeps it close to the WebP. You can move the slider if you want a smaller file.',
        'If the WebP has a transparent background, those areas are filled with white. You can choose another background color on the result.',
        'An animated WebP becomes a still image of its first frame.',
        'Hidden data, such as location, is not copied into the new file.',
      ],
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
    'If the JPG must be under a size limit, such as 50KB, use [Compress to 50KB](/compress-image-to-50kb). It also accepts WebP files and saves a JPG.',
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
      q: 'Will converting WebP to JPG make the file bigger?',
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
  updatedAt: '2026-10-24',
};
