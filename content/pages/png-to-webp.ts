import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'png to webp',
  secondaryKeywords: [
    'convert png to webp',
    'png to webp converter',
    'png to webp transparent',
    'reduce png size',
    'png to webp for website',
  ],
  shortName: 'PNG to WebP',
  cardDescription: 'Shrink PNG files by saving them as WebP, transparency kept.',
  title: 'Convert PNG to WebP Online – Free, No Upload | Img Master',
  description: `Convert PNG images to lighter WebP files for faster websites, with transparent backgrounds kept. Batch up to ${siteConfig.maxFiles}, save as ZIP. Free, no upload.`,
  h1: 'Convert PNG to WebP',
  subtitle: 'Make PNG images lighter for your website as WebP, keeping transparent backgrounds.',
  howTo: [
    'Choose the PNG files you want to make lighter.',
    'They are converted to WebP at once, at quality 90 unless you change it.',
    'Download all of them as a ZIP, or each file on its own.',
  ],
  sections: [
    {
      heading: 'Why convert PNG to WebP for a website',
      paragraphs: [
        'PNG files are often large, especially screenshots and detailed graphics. When you convert PNG to WebP, the file usually becomes much smaller, and it can keep its transparent background. Smaller images make pages load faster, which matters most for visitors on mobile data.',
      ],
    },
    {
      heading: 'The quality setting explained',
      paragraphs: [
        'The WebP files saved here use lossy compression, like JPG. The quality slider sets how much detail is kept. At the default of 90, most graphics look the same as the PNG.',
        'For photos placed on a page, 75 to 85 is often enough. For logos with sharp text, stay at 90 or higher and check the edges at full size. Your chosen quality is remembered for next time on this device.',
      ],
    },
    {
      heading: 'Browser support in plain words',
      paragraphs: [
        'All current versions of Chrome, Edge, Firefox, Safari and Opera can show WebP images. Very old browsers cannot, so keep your PNG files as a backup.',
        'Creating WebP is a different matter. Some browsers, mainly on iPhone and iPad, can show WebP but cannot save it. If yours cannot, this page tells you, and you can use a browser on a computer or choose another format.',
      ],
    },
  ],
  tips: [
    'Keep your original PNG files. If you ever need lossless copies again, you will have them.',
    'Converting photos rather than graphics? [JPG to WebP](/jpg-to-webp) is the matching tool.',
  ],
  faqs: [
    {
      q: 'Does PNG to WebP keep transparency?',
      a: 'Yes. WebP supports transparent backgrounds, so logos and icons keep their clear areas.',
    },
    {
      q: 'How much smaller will my files be?',
      a: 'It depends on the image. Photos and screenshots usually shrink a lot, while tiny icons may change very little. The result card shows the exact before and after sizes for each file.',
    },
    {
      q: "Why does it say my browser can't save WebP?",
      a: 'Some browsers can open WebP but cannot create it. This happens mostly on iPhone and iPad. Try a desktop browser such as Chrome or Firefox, or save as PNG or JPG instead.',
    },
    {
      q: 'Can I use WebP images on my website?',
      a: 'Yes. All current major browsers show WebP. Upload the WebP file the same way you would upload a PNG. If your website platform refuses it, check its help pages for WebP support.',
    },
    {
      q: 'Is there a limit on the number of files?',
      a: `You can convert up to ${siteConfig.maxFiles} images in one batch, and there is no daily limit. The files are converted on your device, so nothing is uploaded.`,
    },
  ],
  related: ['jpg-to-webp', 'webp-to-png', 'png-to-jpg', 'image-converter', 'compress-image'],
  updatedAt: '2026-10-23',
};
