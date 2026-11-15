import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'heic to png',
  secondaryKeywords: [
    'heic to png converter',
    'convert heic to png',
    'heic to png online',
    'change heic to png',
    'heif to png',
    'iphone photo to png',
    'heic converter',
  ],
  shortName: 'HEIC to PNG',
  cardDescription: 'Lossless copies for editing.',
  title: 'Convert HEIC to PNG Online – Free, No Upload | Img Samurai',
  description:
    'HEIC to PNG converter for iPhone photos. Save lossless PNG copies for editing apps and design work. No upload, no signup, many files at once. Free.',
  h1: 'Convert HEIC to PNG',
  h1Accent: 'PNG',
  subtitle: 'Convert HEIC to PNG to get a lossless copy of an iPhone photo for editing apps.',
  sideTip: 'PNG photos are big. If you only need a small file that opens anywhere, pick JPG.',
  howTo: [
    'Select the HEIC photo, or several of them.',
    'Each photo is saved as a PNG at once. There are no settings to set.',
    'Download the PNG files one by one, or all together in a ZIP.',
  ],
  howToHeading: 'How to convert HEIC to PNG',
  sections: [
    {
      heading: 'When to convert HEIC to PNG',
      paragraphs: [
        'Convert HEIC to PNG when you plan to edit the photo. PNG is lossless. The pixels are saved exactly as they are, so saving again and again does not add new compression marks the way JPG can.',
        'It also helps when an app, a design tool or a website accepts PNG but cannot read HEIC.',
      ],
      list: [
        'Photo editors and design apps',
        'Slides and documents that need a picture file',
        'Software that has no HEIC support',
        'Forms that list PNG as an allowed type',
      ],
    },
    {
      heading: 'PNG files from photos are large',
      paragraphs: [
        'Expect a much bigger file than the HEIC. HEIC is built to make photos small. PNG keeps every pixel, and a photo has a very large number of them. A big PNG is normal and does not mean something went wrong.',
        'The picture will not look better, either. The HEIC already lost some detail when the iPhone saved it, and PNG cannot bring that back. It only stops any new loss.',
      ],
      table: {
        caption: 'HEIC, JPG and PNG for iPhone photos',
        headers: ['Format', 'File size', 'Opens in'],
        rows: [
          ['HEIC', 'Smallest', 'Apple devices and some newer apps'],
          ['JPG', 'Small', 'Almost everything'],
          ['PNG', 'Largest', 'Almost everything, and good for editing'],
        ],
      },
    },
    {
      heading: 'Screenshots, graphics and clear backgrounds',
      paragraphs: [
        'iPhone screenshots are usually saved as PNG already, so they do not need this page. A HEIC photo has no transparent areas, so converting it to PNG will not give you a clear background. To cut out a subject, you still need an editing app.',
        'If a plain photo must be small for a form or an email, [HEIC to JPG](/heic-to-jpg) is the better choice.',
      ],
    },
    {
      heading: 'How the photo is opened',
      paragraphs: [
        `On iPhone, iPad and Mac, Safari reads HEIC on its own. In other browsers, a small open-source reader called libheif loads from our site the first time, which takes a few seconds. You can pick up to ${siteConfig.maxFiles} photos at once. Live Photos and burst files give you the main photo only, and location and camera details are not copied.`,
        'A photo over 16.7 megapixels is made smaller first, and the result says so. If a rare HEIC file will not open, share it again from the iPhone as **Most Compatible** and try once more.',
      ],
    },
  ],
  tips: [
    'Camera photos do not need to be PNG just to look sharp. Keep PNG for files you will edit.',
    'Keep the original HEIC file too. It is the smallest copy of your photo.',
  ],
  faqs: [
    {
      q: 'How do I convert HEIC to PNG on my iPhone?',
      a: 'Open this page in Safari, tap the picker and choose the photo from your library. The PNG is made at once. Tap Download to save it to Files, or Share to send it on.',
    },
    {
      q: 'Is PNG better than JPG for iPhone photos?',
      a: 'Only for editing. PNG keeps exact pixels, but the file is much larger. For sharing, email and most forms, JPG is smaller and just as easy to open.',
    },
    {
      q: 'Why is my PNG so much bigger than the HEIC file?',
      a: 'HEIC removes detail the eye barely sees to save space. PNG does not remove anything. Photos have a lot of fine detail, so the PNG ends up several times larger.',
    },
    {
      q: 'Does HEIC to PNG keep the full quality?',
      a: 'The PNG is an exact copy of the photo as it opens on your device, with no new loss. The small loss that HEIC already made stays in the picture.',
    },
    {
      q: 'Is my photo uploaded when I change HEIC to PNG?',
      a: 'No. Your browser does the work, and the photo never leaves your device. The HEIC reader comes from our own site and runs in the same tab.',
    },
    {
      q: 'What is HEIF, and is it the same as HEIC?',
      a: 'HEIF is the file format family, and HEIC is the version iPhones use for photos. For this page, the two names mean the same thing, and both files can be converted.',
    },
  ],
  related: ['heic-to-jpg', 'image-converter', 'png-to-jpg', 'jpg-to-png', 'compress-image'],
  updatedAt: '2026-11-16',
};
