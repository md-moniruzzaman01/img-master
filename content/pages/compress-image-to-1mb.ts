import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 1mb',
  secondaryKeywords: [
    'reduce image size to 1mb',
    'photo under 1mb',
    'compress jpg to 1mb',
    'resize image to 1mb',
    'image less than 1mb',
    'compress photo to 1mb for email',
  ],
  shortName: 'To 1MB',
  cardDescription: 'Bring big phone photos under 1MB and keep them sharp.',
  title: 'Compress Image to 1MB Online – Free, No Upload | Img Master',
  description:
    'Shrink big phone or camera photos to under 1MB for email, forms and sharing. Quality stays high, nothing is uploaded, and it is free with no signup.',
  h1: 'Compress Image to 1MB',
  subtitle: 'Turn a large camera photo into a sharp file under 1MB, ready to email or upload.',
  howTo: [
    'Choose the large photo, or several of them, from your phone or computer.',
    'The tool brings each file under 1MB on its own. There is nothing to set.',
    'Tap Download to save the smaller copy next to your original.',
  ],
  howToHeading: 'How to compress an image to 1MB',
  sections: [
    {
      heading: 'What 1MB means when you compress an image',
      paragraphs: [
        'On this page, 1MB means 1,000KB, or 1,000,000 bytes. Some apps count 1MB as 1,048,576 bytes instead. When you compress an image to 1MB here, the result stays under both numbers, so a "1MB" upload limit accepts it whichever way the website counts.',
      ],
    },
    {
      heading: 'Why phone photos are bigger than 1MB',
      paragraphs: [
        'Modern phone cameras save photos with many megapixels and high quality settings. That is useful for printing or zooming in, but the files are often several megabytes. Email services, chat apps and online forms may refuse them, or take a long time to send them on mobile data.',
        'A 1MB JPG still has plenty of detail for viewing on screens. For sharing and uploading, the smaller copy is usually all you need.',
      ],
    },
    {
      heading: 'Very large photos and iPhone HEIC files',
      paragraphs: [
        'Photos over 16.7 megapixels are reduced in size before compression, to protect your phone from running out of memory. The result tells you when this happens.',
        'iPhones often save photos as HEIC. Safari can open HEIC files, so on an iPhone you can pick them here and get a JPG under 1MB. Other browsers may not be able to read HEIC yet.',
      ],
    },
  ],
  tips: [
    'Keep the original photo. The smaller copy is for sending; the original is your backup for printing.',
    'If a site needs something much smaller, try [Compress to 500KB](/compress-image-to-500kb), or set a custom size in the [general compressor](/compress-image).',
  ],
  faqs: [
    {
      q: 'How do I compress a photo to less than 1MB for email?',
      a: 'Pick the photo on this page and it is reduced to under 1MB at once. Download it and attach the new file to your email. You can pick several photos at the same time.',
    },
    {
      q: 'Will compressing to 1MB reduce the quality?',
      a: 'A little data is removed, but at 1MB the change is usually very hard to see on a phone or laptop screen. If the photo is already under 1MB, you get a clean copy instead.',
    },
    {
      q: 'Is 1MB the same as 1024KB?',
      a: 'Not always. Some websites use 1MB = 1,000KB and others use 1,024KB. Img Master stays under 1,000,000 bytes, which fits both, so you do not need to worry about the difference.',
    },
    {
      q: 'Can I compress an iPhone photo to 1MB?',
      a: 'Yes. In Safari on iPhone, you can pick photos straight from your library, including HEIC photos. The result is a JPG under 1MB that opens almost everywhere.',
    },
    {
      q: 'Why not make the file even smaller?',
      a: 'You can, but there is no need if the limit is 1MB. A file close to the limit keeps the most detail. If you need a much smaller file, choose another size in the options.',
    },
    {
      q: 'Does my photo get uploaded to make it smaller?',
      a: 'No. Your browser does the work, so the photo never leaves your device. It is not sent to Img Master or anyone else.',
    },
  ],
  related: [
    'compress-image-to-500kb',
    'compress-image-to-200kb',
    'compress-image',
    'jpg-to-webp',
    'image-converter',
  ],
  updatedAt: '2026-10-24',
};
