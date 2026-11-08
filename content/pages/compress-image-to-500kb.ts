import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 500kb',
  secondaryKeywords: [
    'reduce image size to 500kb',
    'photo under 500kb',
    'compress jpg to 500kb',
    'resize image to 500kb',
    'image under 500kb for website',
    'compress photo to 500kb',
  ],
  shortName: 'To 500 KB',
  cardDescription: 'Websites and sharing, with high detail kept.',
  title: 'Compress Image to 500KB Online – No Upload | Img Master',
  description:
    'Get high-quality photos under 500 KB for websites, listings and email. Keep the original dimensions if you like. Free, private, runs in your browser.',
  h1: 'Compress image to 500 KB',
  h1Accent: '500 KB',
  subtitle: 'Make a big phone photo under 500 KB and still sharp enough for websites and listings.',
  sideTip:
    'For your own website, try WebP in the Output menu. It can keep more detail at the same size.',
  useCases: {
    heading: 'Where a 500 KB limit shows up',
    intro: "Check the site's upload help for its exact maximum.",
    items: [
      {
        icon: 'code',
        title: 'Your own website',
        text: 'Sharp photos that still load fast on mobile',
      },
      {
        icon: 'image',
        title: 'Online shops & listings',
        text: 'Product photos under a seller upload cap',
      },
      { icon: 'globe', title: 'Forums & blogs', text: 'Posts that limit the size of each photo' },
      { icon: 'mail', title: 'Email', text: 'Large photos that fit in one message' },
    ],
  },
  howTo: [
    `Select one large photo, or a batch of up to ${siteConfig.maxFiles}.`,
    'Each photo is compressed to below 500 KB as soon as you pick it.',
    'Download them one at a time, or all at once in a ZIP file.',
  ],
  howToHeading: 'How to compress an image to 500 KB',
  sections: [
    {
      heading: 'Where a 500 KB limit shows up',
      paragraphs: [
        'You may need to compress an image to 500 KB when a website builder, online shop, forum or application form sets that limit. It is also a sensible size for photos on your own website: big enough to look sharp on a large screen, small enough to load quickly on mobile data.',
        'At this size, most of the detail a viewer can see stays in place. Faces, product edges and printed text keep their shape.',
      ],
    },
    {
      heading: 'Compress to 500 KB and keep the original width and height',
      paragraphs: [
        'At this size, a photo can often reach 500 KB by lowering quality alone. If you need the exact original dimensions, for example for a banner with a fixed size, set **Pixel size** to **Keep exact** under the drop area.',
        'If the target cannot be reached that way, the tool tells you and suggests a next step. It will not quietly save a result that looks bad.',
      ],
    },
    {
      heading: 'JPG or WebP for your website',
      paragraphs: [
        'If the image is for a website you control, WebP is worth trying. At the same 500 KB, WebP usually keeps a little more detail than JPG, and all current major browsers can show it. Switch it with the Output menu in the tool.',
        'If you will upload the photo to a form or a service you do not control, stay with JPG, because some sites still reject WebP files. To change existing JPG files without a size target, use [JPG to WebP](/jpg-to-webp).',
      ],
    },
  ],
  tips: [
    'For product photos, shoot on a plain background. Less clutter means more detail where it matters.',
    'For a fast website, 500 KB is an upper limit, not a goal. Thumbnails can be much smaller; try [Compress to 200 KB](/compress-image-to-200kb).',
  ],
  faqs: [
    {
      q: 'Will a 500 KB photo look good on a big screen?',
      a: 'Usually it looks good on a laptop or phone screen. Very detailed scenes, like leaves or crowds, can lose some fine texture. The result shows the final dimensions so you can check.',
    },
    {
      q: 'How do I resize many product photos to under 500 KB?',
      a: `Pick up to ${siteConfig.maxFiles} photos at once. Each one is compressed to under 500 KB, in the order you chose. Tap Download all to get one ZIP file with every photo.`,
    },
    {
      q: 'Can I keep the same dimensions and only reduce the file size?',
      a: 'Yes. Set Pixel size to Keep exact, and only the quality is lowered. If the photo still cannot fit, the tool tells you instead of saving a poor result.',
    },
    {
      q: 'Does compressing to 500 KB remove EXIF data?',
      a: 'Yes. The new file does not include EXIF data such as GPS location, camera model or date taken. That is good for privacy when you post photos online. Keep your original if you need that data.',
    },
    {
      q: 'Will this work for PNG images with a transparent background?',
      a: 'Yes, but JPG has no transparency, so clear areas become white. Choose WebP as the output format if you need to keep the transparent background.',
    },
    {
      q: 'Are my photos sent to a server?',
      a: 'No. All the work happens in your browser, so your photos never leave your device.',
    },
  ],
  related: [
    'compress-image-to-200kb',
    'compress-image-to-1mb',
    'compress-image',
    'jpg-to-webp',
    'png-to-webp',
  ],
  updatedAt: '2026-10-25',
};
