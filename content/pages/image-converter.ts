import type { ToolContent } from '@/lib/types';

// Hub page for the Convert category: links to every converter page.
export const content: ToolContent = {
  primaryKeyword: 'image converter',
  secondaryKeywords: [
    'convert image to jpg',
    'convert image to png',
    'convert image to webp',
    'photo format converter',
    'change image format',
    'online image converter',
  ],
  shortName: 'Image converter',
  cardDescription: 'Convert images to JPG, PNG or WebP in your browser.',
  title: 'Image Converter Online – JPG, PNG, WebP | Img Master',
  description:
    'Convert images to JPG, PNG or WebP in seconds. Pick any common format, choose the output and download. Free, works on phones, no upload needed.',
  h1: 'Image Converter',
  subtitle: 'Convert any common image to JPG, PNG or WebP with one tap, right in your browser.',
  howTo: [
    'Choose one or more images in any common format.',
    'Pick JPG, PNG or WebP under Convert to.',
    'Download each converted file, or all of them as a ZIP.',
  ],
  howToHeading: 'How to convert images online',
  sections: [
    {
      heading: 'Formats this image converter supports',
      paragraphs: [
        'This image converter opens JPG, PNG, WebP, GIF and BMP files. Other formats work if your browser can open them; for example, Safari can read HEIC photos from an iPhone. For an animated GIF, only the first frame is converted.',
        'You can save as JPG, PNG or WebP. For JPG and WebP, a quality slider (90 by default) lets you trade file size for detail. PNG keeps every pixel, so it has no quality setting.',
      ],
    },
    {
      heading: 'Choosing the right format',
      paragraphs: [
        'When an image with a transparent background is saved as JPG, the clear parts are filled with a color. White is the default, and you can change it on the result. If you need a website icon in the .ico format, use [PNG to ICO](/png-to-ico).',
      ],
      table: {
        caption: 'JPG, PNG and WebP compared',
        headers: ['Format', 'Good for', 'Transparency', 'File size'],
        rows: [
          ['JPG', 'Photos, forms and sharing', 'No', 'Small'],
          ['PNG', 'Logos, screenshots and graphics with text', 'Yes', 'Large'],
          ['WebP', 'Websites and apps', 'Yes', 'Usually the smallest'],
        ],
      },
    },
    {
      heading: 'All converter tools',
      paragraphs: [
        'These pages start with the right formats already set, so there is nothing to choose.',
      ],
      table: {
        caption: 'Converter pages on Img Master',
        headers: ['Tool', 'What it does'],
        rows: [
          ['[WebP to JPG](/webp-to-jpg)', 'Makes WebP images open and upload anywhere'],
          ['[WebP to PNG](/webp-to-png)', 'Keeps transparent backgrounds from WebP files'],
          ['[PNG to WebP](/png-to-webp)', 'Makes PNG graphics lighter for websites'],
          ['[JPG to WebP](/jpg-to-webp)', 'Makes photos lighter for websites'],
          ['[PNG to JPG](/png-to-jpg)', 'Turns large PNGs and screenshots into small JPGs'],
          ['[JPG to PNG](/jpg-to-png)', 'Saves photos as PNG for apps and editing'],
        ],
      },
    },
  ],
  faqs: [
    {
      q: 'How do I change a picture to JPG?',
      a: 'Choose the picture, keep JPG selected under Convert to, and download the new file. It works the same way on a phone or a computer.',
    },
    {
      q: 'Which format makes the smallest file?',
      a: 'For photos, WebP is usually the smallest, followed by JPG. PNG is normally the largest for photos, but it suits sharp graphics and screenshots. If you need a file under a set size, use the [compress tool](/compress-image) instead.',
    },
    {
      q: 'Does converting reduce image quality?',
      a: 'Converting to PNG keeps every pixel as it is. Converting to JPG or WebP removes a little detail to save space. At the default quality of 90, this is hard to see.',
    },
    {
      q: 'Can I convert HEIC photos?',
      a: 'Only if your browser can open them. Safari on iPhone, iPad and Mac usually can. In other browsers, a HEIC file may show an error saying it cannot be opened.',
    },
    {
      q: 'Are my images uploaded for conversion?',
      a: 'No. Your browser does the conversion, so your images never leave your device. Nothing is sent to our server or to any other service.',
    },
  ],
  related: [
    'webp-to-jpg',
    'png-to-jpg',
    'jpg-to-webp',
    'png-to-webp',
    'webp-to-png',
    'compress-image',
  ],
  updatedAt: '2026-10-24',
};
