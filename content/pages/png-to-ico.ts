import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'png to ico',
  secondaryKeywords: [
    'convert png to ico',
    'png to favicon.ico',
    'png to icon',
    'ico converter',
    'make ico file',
    'png to ico 32x32',
  ],
  shortName: 'PNG to ICO',
  cardDescription: 'Convert a PNG into a multi-size .ico file.',
  title: 'PNG to ICO Converter – Free, No Upload | Img Master',
  description:
    'Convert a PNG to ICO with 16, 32 and 48 px icons (plus 256 px for large PNGs). Use it as favicon.ico. Free, runs in your browser, no upload.',
  h1: 'PNG to ICO Converter',
  subtitle:
    'Convert a PNG to ICO with several icon sizes inside one file, ready to use as favicon.ico.',
  howTo: [
    'Choose a square PNG from your phone or computer.',
    'The tool builds the ICO file right away.',
    'Download it, and rename it favicon.ico if you need that name.',
  ],
  sections: [
    {
      heading: 'What a PNG to ICO converter does',
      paragraphs: [
        'ICO is an icon format from Windows. One ICO file can hold several pictures of the same icon at different sizes. A PNG to ICO converter reads your PNG, makes smaller copies and puts them in one file. Your PNG is not uploaded.',
        'This tool writes 16, 32 and 48 pixel versions. When your PNG is at least 256 pixels wide, it adds a 256 pixel version too. The download is named after your PNG, with the ending .ico.',
      ],
    },
    {
      heading: 'Why one ICO file holds many sizes',
      paragraphs: [
        'Different places show an icon at different sizes. A browser tab is small. A desktop shortcut or a Windows taskbar may use a bigger one. With several sizes inside, the system picks the nearest match and does not need to stretch one picture.',
        'Stretching is what makes icons look soft. Starting from a large, square PNG with simple shapes gives the cleanest small copies.',
      ],
    },
    {
      heading: 'When you need an ICO and when PNG is enough',
      paragraphs: [
        'Most current browsers show PNG or SVG icons in a tab. An ICO file is still a safe default, because some tools, older browsers and Windows features look for favicon.ico. Many sites keep both.',
        'For a full pack with Apple and Android icons, a manifest file and an HTML snippet, use the [Favicon Generator](/favicon-generator). Use this page when you only need the .ico file.',
      ],
      list: [
        'Website tab icon: ICO plus PNG is a safe pair.',
        'Home screen icon: use the PNG files.',
        'Windows shortcut icon: use the ICO.',
      ],
    },
  ],
  tips: ['Use a square PNG. A picture that is not square may not look right as an icon.'],
  faqs: [
    {
      q: 'How do I convert a PNG to ICO?',
      a: 'Choose the PNG on this page and the ICO is made at once. Tap Download to save it. It works on a phone or a computer.',
    },
    {
      q: 'What sizes are inside the ICO file?',
      a: 'The file has 16, 32 and 48 pixel icons. If your PNG is at least 256 pixels, a 256 pixel icon is added too.',
    },
    {
      q: 'How do I use the file as favicon.ico?',
      a: 'Rename it to favicon.ico, then put it in the main folder of your website. You can also add a link tag in the head of your page that points to the file.',
    },
    {
      q: 'Will the transparent background stay?',
      a: 'ICO files can keep transparent areas, so a PNG with a clear background should keep it. Check the result on a light and a dark background.',
    },
    {
      q: 'Is my PNG uploaded to make the ICO?',
      a: 'No. Your browser builds the ICO on your own device. The PNG is not sent to us or to any other service.',
    },
  ],
  related: [
    'favicon-generator',
    'favicon-from-text',
    'favicon-from-emoji',
    'png-to-jpg',
    'png-to-webp',
  ],
  updatedAt: '2026-10-23',
};
