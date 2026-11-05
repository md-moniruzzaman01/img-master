import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

// Resize tool (ResizeOptions in lib/types.ts): width and/or height in pixels,
// or a percentage; ratio lock on by default; output same format, JPG, PNG or WebP.
export const content: ToolContent = {
  primaryKeyword: 'resize image',
  secondaryKeywords: [
    'resize image to pixels',
    'change image dimensions',
    'resize photo online',
    'resize image by percentage',
    'reduce image width and height',
    'resize image without losing quality',
  ],
  shortName: 'Resize image',
  cardDescription: 'Exact pixels or a percentage, ratio locked.',
  title: 'Resize Image Online – Exact Pixels, No Upload | Img Master',
  description:
    'Resize images to an exact width and height in pixels, or by a percentage, with the ratio kept. JPG, PNG and WebP. Free, runs in your browser, no upload.',
  h1: 'Resize image',
  h1Accent: 'Resize',
  subtitle: 'Resize an image to an exact width and height in pixels, or by a percentage.',
  sideTip: 'Keep the ratio lock on and type one side. The other side follows on its own.',
  useCases: {
    heading: 'When an exact pixel size matters',
    intro: 'Pixel size is the width and height of the picture, not the file size in KB.',
    items: [
      {
        icon: 'document',
        title: 'Form photo sizes',
        text: 'Forms that ask for a width and height in pixels',
      },
      {
        icon: 'code',
        title: 'Website images',
        text: 'Pictures that fit your layout with no extra weight',
      },
      {
        icon: 'image',
        title: 'Profile pictures',
        text: 'Square photos for social and work profiles',
      },
      { icon: 'mail', title: 'Email & chat', text: 'Big camera photos made small enough to send' },
    ],
  },
  howToHeading: 'How to resize an image',
  howTo: [
    `Choose one image, or up to ${siteConfig.maxFiles} at once.`,
    'Type a width or a height in pixels, or switch to a percentage.',
    'Download the resized file, or all of them together as a ZIP.',
  ],
  sections: [
    {
      heading: 'Resize by pixels or by percentage',
      paragraphs: [
        'There are two ways to resize an image here. **Pixels** lets you type the exact width and height you need, for example 600 × 600 or 1280 wide. **Percentage** scales both sides by the same amount, so 50% makes each side half as long.',
        'Use pixels when a form or a website tells you the size. Use a percentage when you only want a smaller picture and the exact numbers do not matter.',
      ],
    },
    {
      heading: 'Keep the shape with the ratio lock',
      paragraphs: [
        'The ratio lock is on at the start. Type only the width, and the height is worked out for you, so faces and buildings keep their shape. If you type both sides, the picture is fitted inside that box without being stretched.',
        'Turn the lock off only when you need exactly that width and height. A photo that has a different shape will then look squeezed or stretched. To avoid that, crop the photo to the right shape in your gallery app first.',
      ],
    },
    {
      heading: 'Resize first, then compress to a file size',
      paragraphs: [
        'Pixel size and file size are two different rules. A form may ask for both, such as a set width and height and a limit in KB. Resize the photo here first. Then open a size page, for example [Compress to 50 KB](/compress-image-to-50kb), and set Pixel size to Keep exact, so the width and height stay as you set them.',
      ],
    },
    {
      heading: 'Which format the resized file uses',
      paragraphs: [
        'By default, the new file keeps the format of the original: a JPG stays a JPG and a PNG stays a PNG. You can also save as JPG, PNG or WebP. JPG and WebP are saved at quality 90. If you save a picture with a transparent background as JPG, the clear areas are filled with a solid color.',
        'Like every tool on this site, the new file is saved without hidden photo data, such as GPS location.',
      ],
    },
  ],
  tips: [
    'Start from the largest copy of the photo you have. A picture cannot gain detail it does not already have.',
    'Need a smaller file and do not care about the exact pixels? The [image compressor](/compress-image) can set a max width and a quality in one step.',
  ],
  faqs: [
    {
      q: 'How do I resize a photo to 600 × 600 pixels?',
      a: 'Type 600 as the width and 600 as the height. If your photo is not square, it is fitted inside 600 × 600 while the ratio lock is on. Crop it square first if you need exactly 600 × 600.',
    },
    {
      q: 'Does resizing make the file smaller?',
      a: 'Usually, yes. Fewer pixels need fewer bytes. If you need a set file size, such as 100 KB, use a compress-to-size page after you resize.',
    },
    {
      q: 'Will a smaller picture look blurry?',
      a: 'It should stay sharp. We scale large pictures down in steps with high-quality smoothing, which keeps edges clean. Very small sizes can still lose fine detail, such as small text.',
    },
    {
      q: 'Can I resize several images at once?',
      a: `Yes. Choose up to ${siteConfig.maxFiles} images. The same setting is used for each one, and Download all saves them as one ZIP file.`,
    },
    {
      q: 'Is my image uploaded to resize it?',
      a: 'No. Your browser resizes the image on your own device, so it never leaves your phone or computer.',
    },
  ],
  related: [
    'compress-image-to-50kb',
    'compress-image-to-100kb',
    'compress-image',
    'image-converter',
    'favicon-generator',
  ],
  updatedAt: '2026-10-25',
};
