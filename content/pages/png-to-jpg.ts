import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'png to jpg',
  secondaryKeywords: [
    'convert png to jpg',
    'png to jpeg',
    'screenshot to jpg',
    'change png to jpg',
    'png to jpg white background',
    'reduce png file size',
  ],
  shortName: 'PNG to JPG',
  cardDescription: 'Change PNG screenshots and graphics into small JPG files.',
  title: 'Convert PNG to JPG Online – Free, No Upload | Img Master',
  description:
    'Change PNG screenshots and images into smaller JPG files that every form accepts. Pick a background color for transparent areas. Free, no upload.',
  h1: 'Convert PNG to JPG',
  subtitle: 'Change a large PNG or screenshot into a smaller JPG that forms and apps accept.',
  howTo: [
    'Choose the PNG image or screenshot from your phone.',
    'It turns into a JPG right away. Transparent parts become white unless you pick a color.',
    'Download the JPG, or share it to another app.',
  ],
  sections: [
    {
      heading: 'Why change PNG to JPG',
      paragraphs: [
        'Phones save screenshots as PNG, and some apps export pictures as PNG too. For photos, PNG files can be very large. Converting PNG to JPG usually makes the file much smaller, and JPG is the format most online forms ask for.',
        'If a form says "JPG or JPEG only", this is the fix. Your image is converted on your own device and is not uploaded.',
      ],
    },
    {
      heading: 'What happens to transparent areas',
      paragraphs: [
        'JPG cannot store transparency. When your PNG has a clear background, for example a logo or a cut-out photo, those areas must be filled with a color. White is the default because it suits most forms and documents.',
        'When the image has transparency, a background color option appears on the result, so you can choose black or another color instead.',
      ],
    },
    {
      heading: 'Screenshots and small text',
      paragraphs: [
        'Screenshots often contain small text. At low quality, JPG compression can leave faint marks around sharp letters. The default quality of 90 keeps text clean in most cases. If you see fuzzy edges around letters, move the slider higher.',
        'If the file is still too large for a form, compress it to a fixed limit instead, for example with [Compress to 100KB](/compress-image-to-100kb).',
      ],
    },
  ],
  tips: [
    'A logo that must keep its clear background should stay PNG or become WebP, not JPG.',
    'Crop screenshots to the part you need before converting. The JPG will be smaller and easier to read.',
  ],
  faqs: [
    {
      q: 'How do I convert a PNG to JPG on my phone?',
      a: 'Open this page, tap Choose images and select the PNG. It becomes a JPG immediately. Tap Download, and the JPG is saved to your phone.',
    },
    {
      q: 'Why did my transparent background turn white?',
      a: 'JPG has no transparency, so the clear parts need a color. White is used by default. You can choose a different background color on the result card.',
    },
    {
      q: 'Will the JPG be smaller than the PNG?',
      a: 'For photos and most screenshots, yes, often much smaller. A simple graphic with few colors can already be small as a PNG, and the JPG may not save much.',
    },
    {
      q: 'Is PNG to JPG conversion lossless?',
      a: 'No. JPG removes a little detail to save space. At the default quality of 90 it is hard to notice. Keep the PNG if you need an exact copy.',
    },
    {
      q: 'Can I convert many PNG files to JPG at once?',
      a: `Yes. Choose up to ${siteConfig.maxFiles} files together. Each one becomes a JPG, and Download all saves them in a single ZIP file.`,
    },
  ],
  related: [
    'jpg-to-png',
    'webp-to-jpg',
    'compress-image-to-100kb',
    'image-converter',
    'png-to-webp',
  ],
  updatedAt: '2026-10-23',
};
