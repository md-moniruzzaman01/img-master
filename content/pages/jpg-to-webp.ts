import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'jpg to webp',
  secondaryKeywords: [
    'convert jpg to webp',
    'jpeg to webp',
    'jpg to webp converter',
    'convert photos to webp',
    'jpg to webp batch',
  ],
  shortName: 'JPG to WebP',
  cardDescription: 'Turn JPG photos into lighter WebP files for the web.',
  title: 'Convert JPG to WebP Online – Free, No Upload | Img Master',
  description:
    'Turn JPG photos into smaller WebP images for a faster website. Convert a batch at once and save as ZIP. Works in your browser, free, nothing uploaded.',
  h1: 'Convert JPG to WebP',
  subtitle: 'Turn JPG photos into lighter WebP files for your website, a whole batch at a time.',
  howTo: [
    'Pick your JPG photos. You can select many at once.',
    'Each photo is saved as WebP right after you pick it.',
    'Use Download all to get one ZIP with every WebP file.',
  ],
  sections: [
    {
      heading: 'Who needs JPG to WebP',
      paragraphs: [
        'This tool is for people who put photos online: blog writers, shop owners, developers and anyone building a website. When you convert JPG to WebP, the photo usually takes less space at the same visible quality. That helps pages load faster and saves your visitors data.',
      ],
    },
    {
      heading: 'Converting a folder of photos',
      paragraphs: [
        `Pick up to ${siteConfig.maxFiles} JPG files in one go. On a computer, you can also drag them onto the page, or paste an image with Ctrl+V.`,
        'The files keep their names and only the ending changes, so **beach.jpg** becomes **beach.webp**. Your quality setting is remembered on this device, so the next batch uses the same value.',
      ],
    },
    {
      heading: 'Where WebP may not work',
      paragraphs: [
        'Web browsers show WebP without problems. Some other places are less ready: older desktop software, some printing services, and many online forms that list only JPG or PNG. Keep your JPG originals for those cases.',
        'If you get a WebP file that will not open somewhere, [WebP to JPG](/webp-to-jpg) changes it back.',
      ],
    },
  ],
  tips: [
    'A good starting quality for website photos is 80 to 90. Check one photo at full size before you convert the rest.',
    'Very wide photos are bigger than most screens need. Reduce the width first if your site shows them small.',
  ],
  faqs: [
    {
      q: 'Is WebP better than JPG?',
      a: 'For websites, WebP usually gives smaller files at similar quality, and it supports transparency. JPG is still more widely accepted by forms, printers and older apps. A common approach is to use WebP on your site and keep JPG for everything else.',
    },
    {
      q: 'Will converting JPG to WebP lower the quality?',
      a: 'Both formats remove some detail to save space. At the default quality of 90, the difference is very hard to see. Because a JPG has already lost some detail, start from the highest-quality copy you have.',
    },
    {
      q: 'Can I convert JPG to WebP on Android?',
      a: 'Yes. Open this page in Chrome or another browser, choose your photos and download the WebP files. On iPhone and iPad, some browsers cannot save WebP; the page tells you if that happens.',
    },
    {
      q: "Does the WebP keep my photo's location data?",
      a: 'No. The new WebP file is saved without hidden data such as GPS location or camera details. That is useful before you publish photos online. The photos are also never uploaded during conversion.',
    },
    {
      q: 'Can I set a file size instead of a quality?',
      a: 'Not on this page. If you need each photo under a size such as 200KB, use [Compress to 200KB](/compress-image-to-200kb) and choose WebP as the output format.',
    },
  ],
  related: [
    'png-to-webp',
    'webp-to-jpg',
    'compress-image-to-500kb',
    'image-converter',
    'compress-image',
  ],
  updatedAt: '2026-10-23',
};
