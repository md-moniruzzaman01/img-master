import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 20kb',
  secondaryKeywords: [
    'reduce photo size to 20kb',
    'signature under 20kb',
    '20kb photo',
    'convert image to 20kb',
    'compress jpg to 20kb',
    'resize signature to 20kb',
  ],
  shortName: 'To 20KB',
  cardDescription: 'Shrink a photo or signature to under 20KB.',
  title: 'Compress Image to 20KB Online – Free, No Upload | Img Master',
  description:
    'Shrink a photo or a signature to under 20KB in seconds. Edges and faces stay as clear as the size allows, and nothing leaves your phone. Free, no signup.',
  h1: 'Compress Image to 20KB',
  subtitle: 'Make a photo or signature under 20KB for online forms, right on your phone.',
  howTo: [
    'Tap Choose images and pick a photo or a picture of your signature.',
    'The 20KB size is already selected, so it starts shrinking at once.',
    'Tap Download to save the JPG, or Share to send it to another app.',
  ],
  howToHeading: 'How to compress an image to 20KB',
  sections: [
    {
      heading: 'What fits in 20KB',
      paragraphs: [
        'To compress an image to 20KB, the tool lowers the JPG quality step by step. If that is not enough, it also makes the picture smaller in pixels. 20KB is a very small file, and a photo from a phone camera is many times bigger, so expect a small width and height in the result.',
        'That is fine for the places where a 20KB limit is used. Forms often ask for a signature or a small photo at this size, and they show it small on screen or on a printed card. The result card tells you the final dimensions before you download.',
      ],
    },
    {
      heading: 'Compress a signature to 20KB and keep it readable',
      paragraphs: [
        'A signature is thin dark lines on plain paper. That kind of picture compresses well, so it can stay sharp at 20KB if the photo itself is clean. Most of the work happens before you open this page:',
      ],
      list: [
        'Sign with a black or dark blue pen on plain white paper.',
        'Take the photo in daylight, with no shadow from your hand or phone.',
        'Hold the phone flat above the paper, not at an angle.',
        'Crop close around the signature in your gallery app. Empty paper still uses bytes.',
      ],
    },
    {
      heading: 'When 20KB is not reachable',
      paragraphs: [
        'A busy picture, such as a group photo or a street scene, may not fit in 20KB and still look like anything. In that case the tool tells you, instead of handing you a file full of blocks. You can then allow smaller dimensions, or check whether the form accepts a larger file, such as [50KB](/compress-image-to-50kb).',
        'Leave **Keep original dimensions** switched off at this size. Keeping a large width and height inside 20KB almost always looks worse than a smaller, cleaner picture.',
      ],
    },
  ],
  tips: [
    'Crop first. Less area means more detail in the same 20KB.',
    'Keep JPG as the output unless the form clearly says it accepts WebP.',
    'The downloaded file is named like your-photo-20kb.jpg, so it is easy to find in your Downloads folder.',
  ],
  faqs: [
    {
      q: 'Will my photo still look clear at 20KB?',
      a: 'It depends on the photo. Signatures and simple head-and-shoulders photos usually look fine, because they are plain. Busy photos lose more detail. Cropping before you compress helps a lot.',
    },
    {
      q: 'Why is my 20KB image so small in pixels?',
      a: 'To fit in 20KB, the tool often has to reduce the width and height as well as the quality. A smaller picture with clean edges looks better than a large one covered in blocky marks. The result shows the exact dimensions.',
    },
    {
      q: 'The form says my file is bigger than 20KB. Why?',
      a: 'Some websites count 1KB as 1,000 bytes and others as 1,024 bytes. Img Master keeps the file under 20KB both ways, so this should not happen. If it does, make sure you chose the downloaded file and not the original photo.',
    },
    {
      q: 'Can I compress a PNG signature to 20KB?',
      a: 'Yes. You can pick a PNG, WebP or other common image. The result is saved as a JPG, and a transparent background becomes white.',
    },
    {
      q: 'Is my signature uploaded anywhere?',
      a: 'No. The browser on your own phone or computer does the work, so the picture never leaves your device. That matters for something as personal as a signature.',
    },
  ],
  related: [
    'compress-image-to-50kb',
    'compress-image-to-100kb',
    'compress-image',
    'png-to-jpg',
    'webp-to-jpg',
  ],
  updatedAt: '2026-10-24',
};
