import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 200kb',
  secondaryKeywords: [
    'reduce image size to 200kb',
    'photo under 200kb',
    'compress jpg to 200kb',
    'resize image to 200kb',
    'compress picture to 200kb',
    'image size 200kb',
  ],
  shortName: 'To 200 KB',
  cardDescription: 'Email attachments and scanned documents.',
  title: 'Compress Image to 200KB Online – No Upload | Img Master',
  description:
    'Bring a large photo or full-page scan under 200 KB while keeping fine detail. Runs in your phone browser, nothing is uploaded, free and no signup.',
  h1: 'Compress image to 200 KB',
  h1Accent: '200 KB',
  subtitle:
    'Fit a detailed photo or full-page scan under 200 KB, with fine text and edges kept sharp.',
  sideTip: 'Start from the original photo, not a copy that was already sent through a chat app.',
  useCases: {
    heading: 'Where a 200 KB limit shows up',
    intro: 'Look for the maximum file size on the page where you upload.',
    items: [
      {
        icon: 'mail',
        title: 'Email & support tickets',
        text: 'Photos that attach and open quickly',
      },
      {
        icon: 'document',
        title: 'Full-page scans',
        text: 'Documents with small print kept readable',
      },
      {
        icon: 'image',
        title: 'Online listings',
        text: 'Product photos on sites with an upload cap',
      },
      { icon: 'phone', title: 'Group chats', text: 'Sets of photos sent over mobile data' },
    ],
  },
  howTo: [
    'Pick the photo, scan or screenshot you want to make smaller.',
    'It starts shrinking at once and stops just under 200 KB.',
    'Look at the before and after sizes, then download or share it.',
  ],
  howToHeading: 'How to compress an image to 200 KB',
  sections: [
    {
      heading: 'Is 200 KB enough for a good photo?',
      paragraphs: [
        'For viewing on a screen, usually yes. When you compress an image to 200 KB, there is room for a clear portrait, a product photo or a full page of printed text. With a larger budget, the tool has less need to make the picture smaller in pixels.',
        '200 KB is not meant for printing large posters or for zooming far into a photo. For that, keep the original file.',
      ],
    },
    {
      heading: 'Good reasons to compress an image to 200 KB',
      paragraphs: [
        'A 200 KB file is light enough to send on slow data and big enough to look good. For example:',
      ],
      list: [
        'A full-page scan of a document with small print',
        'A photo you attach to an email or a support ticket',
        'Pictures for a listing on a selling website that limits file size',
        'A set of photos you send to a group over mobile data',
      ],
    },
    {
      heading: 'Sending many pages at once',
      paragraphs: [
        `You can choose up to ${siteConfig.maxFiles} images in one go. Each one is compressed to under 200 KB, in the same order you picked them. When there is more than one, **Download all** saves them as a single ZIP file.`,
        'On phones that support it, the **Share** button sends the result straight to a chat or email app, so you do not need to find the file in your downloads first.',
      ],
    },
  ],
  tips: [
    'Forms usually want JPG, which is the default here. For images on your own website, WebP may keep a bit more detail at the same size.',
    'Need a tighter limit for a document? Try [Compress to 100 KB](/compress-image-to-100kb).',
    'If a photo is already under 200 KB, you still get a clean copy without hidden location data.',
  ],
  faqs: [
    {
      q: 'How do I reduce a picture to 200 KB without losing quality?',
      a: 'Every compression removes some data, but at 200 KB the loss is usually hard to see on a phone screen. Start from the original photo, not a copy that was already sent through a chat app. Each extra round of compression adds more damage.',
    },
    {
      q: 'Can I compress screenshots to 200 KB?',
      a: 'Yes. Screenshots are often PNG files and can be large. Pick them here and they are saved as JPG under 200 KB. Text in a screenshot stays sharpest when you crop away the parts you do not need.',
    },
    {
      q: 'Why did the tool make my image smaller in pixels?',
      a: 'If lowering the quality alone would make the picture look rough, the tool reduces the width and height a little instead. The result shows the new dimensions. Set Pixel size to Keep exact if you need the original width and height.',
    },
    {
      q: 'Do I need to install an app?',
      a: 'No. Img Master runs in your web browser on Android, iPhone or a computer. There is nothing to install and no account to create.',
    },
    {
      q: 'What happens to the location data in my photo?',
      a: 'It is removed. Saving a new file drops the hidden details your camera adds, such as GPS location and the phone model. Your photo also never leaves your device.',
    },
  ],
  related: [
    'compress-image-to-100kb',
    'compress-image-to-500kb',
    'compress-image',
    'png-to-jpg',
    'jpg-to-webp',
  ],
  updatedAt: '2026-10-25',
};
