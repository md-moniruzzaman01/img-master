import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

// Hub page for the Compress category: links to every compress-to-size page.
export const content: ToolContent = {
  primaryKeyword: 'image compressor',
  secondaryKeywords: [
    'compress image',
    'reduce image size',
    'compress photo online',
    'compress jpeg',
    'reduce photo file size',
    'image size reducer',
  ],
  shortName: 'Image compressor',
  cardDescription: 'Any size limit, or a quality slider.',
  title: 'Image Compressor Online – Free, No Upload | Img Master',
  description:
    'Reduce image file size by picking a target like 50 KB or a quality level. Works with JPG, PNG and WebP on any phone. Free, private, no signup.',
  h1: 'Image compressor',
  h1Accent: 'compressor',
  subtitle: 'Set your own size limit or pick a quality level, for JPG, PNG and WebP images.',
  sideTip: 'No size limit to meet? Try quality 70 to 80 and a max width of 1280 pixels.',
  howTo: [
    'Choose your images. JPG, PNG, WebP and most other photos work.',
    'Set a target size such as 100 KB, or switch to Quality.',
    'Download the smaller file, or every file together as a ZIP.',
  ],
  howToHeading: 'How to compress an image',
  sections: [
    {
      heading: 'Two ways to use the image compressor',
      paragraphs: [
        'This image compressor gives you two ways to make a file smaller. **Target size** makes a file under a limit you choose, such as 50 KB, or any number in KB or MB. Use it when a form or website tells you the maximum file size.',
        '**Quality** uses a slider from 10 to 100, set to 75 at the start. Use it when there is no limit and you simply want a lighter file that still looks good. Lower numbers give smaller files, with more visible loss.',
        'You can also set a maximum width, such as 1920, 1280 or 800 pixels. Making a picture narrower is often the quickest way to cut its file size for websites and chats.',
      ],
    },
    {
      heading: 'All compress-to-size tools',
      paragraphs: [
        'Each of these pages opens with its size already selected, so you can bookmark the one you use most.',
      ],
      table: {
        caption: 'Compress-to-size pages on Img Master',
        headers: ['Tool', 'Result', 'Often used for'],
        rows: [
          [
            '[Compress image to 20 KB](/compress-image-to-20kb)',
            'Under 20 KB',
            'Signatures and small form photos',
          ],
          [
            '[Compress image to 50 KB](/compress-image-to-50kb)',
            'Under 50 KB',
            'Profile photos for online forms',
          ],
          [
            '[Compress image to 100 KB](/compress-image-to-100kb)',
            'Under 100 KB',
            'Document scans and ID cards',
          ],
          [
            '[Compress image to 200 KB](/compress-image-to-200kb)',
            'Under 200 KB',
            'Full-page scans and email attachments',
          ],
          [
            '[Compress image to 500 KB](/compress-image-to-500kb)',
            'Under 500 KB',
            'Website images and online listings',
          ],
          [
            '[Compress image to 1 MB](/compress-image-to-1mb)',
            'Under 1 MB',
            'Large camera photos for email and upload',
          ],
        ],
      },
    },
    {
      heading: 'Which option should you choose?',
      paragraphs: ['Match the setting to the job:'],
      list: [
        'A form says "maximum 100 KB": use Target size, or open the 100 KB page from the table.',
        'You want lighter photos for your own website: try a quality between 70 and 80 and a maximum width of 1280 or 1920.',
        'You are sending photos over slow data: a maximum width of 1280 is plenty for most phone screens.',
        'You need a different format, such as WebP to JPG: use the [image converter](/image-converter) instead.',
      ],
    },
  ],
  tips: [
    'Always keep your original photo. Compressing the same file again and again adds more loss each time.',
    'Every result is saved without hidden photo data, such as GPS location.',
  ],
  faqs: [
    {
      q: 'How do I reduce the file size of an image?',
      a: 'Choose the image on this page. Then either pick a target size, like 200 KB, or move the quality slider. The smaller file is ready in a moment, and you can download it.',
    },
    {
      q: 'What quality setting should I use?',
      a: 'Start with the default of 75. It is a good balance for most photos. Go lower for smaller files, or higher if you see blocky patches in skies or skin.',
    },
    {
      q: 'Can I compress a PNG image?',
      a: 'Yes. PNG, JPG, WebP, GIF and BMP images all work. Screenshots and graphics saved as PNG are often large, so they can shrink a lot.',
    },
    {
      q: 'Is there a limit on how many images I can compress?',
      a: `There is no daily limit. You can compress up to ${siteConfig.maxFiles} images in one batch and start a new batch as often as you like.`,
    },
    {
      q: 'Is it safe to compress private photos here?',
      a: 'Yes. Compression runs in your own browser, so your photos never leave your device.',
    },
  ],
  related: [
    'compress-image-to-50kb',
    'compress-image-to-100kb',
    'compress-image-to-200kb',
    'compress-image-to-1mb',
    'image-converter',
    'resize-image',
  ],
  updatedAt: '2026-10-25',
};
