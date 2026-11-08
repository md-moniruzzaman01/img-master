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
  shortName: 'To 1 MB',
  cardDescription: 'Big phone photos for portals with a 1 MB cap and email.',
  title: 'Compress Image to 1MB Online – Free, No Upload | Img Master',
  description:
    'Shrink big phone or camera photos to under 1 MB for email, forms and sharing. Quality stays high, nothing is uploaded, and it is free with no signup.',
  h1: 'Compress image to 1 MB',
  h1Accent: '1 MB',
  subtitle: 'Turn a large camera photo into a sharp file under 1 MB, ready to email or upload.',
  sideTip: 'Here 1 MB means 1,000 KB, so the file also fits limits that count 1 MB as 1,024 KB.',
  useCases: {
    heading: 'Where a 1 MB limit shows up',
    intro: 'The number is the same, but sites count it in different ways. Ours fits both.',
    items: [
      {
        icon: 'globe',
        title: 'Portals with a 1 MB cap',
        text: 'Applications that accept larger photos',
      },
      { icon: 'mail', title: 'Email attachments', text: 'Several photos in one message' },
      {
        icon: 'image',
        title: 'Photo sharing',
        text: 'Full-screen photos without the huge original',
      },
      { icon: 'phone', title: 'Mobile data', text: 'Uploads that finish sooner on a slow network' },
    ],
  },
  howTo: [
    'Choose the large photo, or several of them, from your phone or computer.',
    'The tool brings each file under 1 MB on its own. There is nothing to set.',
    'Tap Download to save the smaller copy next to your original.',
  ],
  howToHeading: 'How to compress an image to 1 MB',
  sections: [
    {
      heading: 'What 1 MB means when you compress an image',
      paragraphs: [
        'On this page, 1 MB means 1,000 KB, or 1,000,000 bytes. Some apps count 1 MB as 1,048,576 bytes instead. When you compress an image to 1 MB here, the result stays under both numbers, so a "1 MB" upload limit accepts it whichever way the website counts.',
      ],
    },
    {
      heading: 'Why phone photos are bigger than 1 MB',
      paragraphs: [
        'Modern phone cameras save photos with many megapixels and high quality settings. That is useful for printing or zooming in, but the files are often several megabytes. Email services, chat apps and online forms may refuse them, or take a long time to send them on mobile data.',
        'A 1 MB JPG still has plenty of detail for viewing on screens. For sharing and uploading, the smaller copy is usually all you need.',
      ],
    },
    {
      heading: 'Very large photos and iPhone HEIC files',
      paragraphs: [
        'Photos over 16.7 megapixels are reduced in size before compression, to protect your phone from running out of memory. The result tells you when this happens.',
        'iPhones often save photos as HEIC. Safari can open HEIC files, so on an iPhone you can pick them here and get a JPG under 1 MB. Other browsers may not be able to read HEIC yet.',
      ],
    },
  ],
  tips: [
    'Keep the original photo. The smaller copy is for sending; the original is your backup for printing.',
    'If a site needs something much smaller, try [Compress to 500 KB](/compress-image-to-500kb), or set a custom size in the [general compressor](/compress-image).',
  ],
  faqs: [
    {
      q: 'How do I compress a photo to less than 1 MB for email?',
      a: 'Pick the photo on this page and it is reduced to under 1 MB at once. Download it and attach the new file to your email. You can pick several photos at the same time.',
    },
    {
      q: 'Will compressing to 1 MB reduce the quality?',
      a: 'A little data is removed, but at 1 MB the change is usually very hard to see on a phone or laptop screen. If the photo is already under 1 MB, you get a clean copy instead.',
    },
    {
      q: 'Is 1 MB the same as 1024 KB?',
      a: 'Not always. Some websites use 1 MB = 1,000 KB and others use 1,024 KB. Img Master stays under 1,000,000 bytes, which fits both, so you do not need to worry about the difference.',
    },
    {
      q: 'Can I compress an iPhone photo to 1 MB?',
      a: 'Yes. In Safari on iPhone, you can pick photos straight from your library, including HEIC photos. The result is a JPG under 1 MB that opens almost everywhere.',
    },
    {
      q: 'Why not make the file even smaller?',
      a: 'You can, but there is no need if the limit is 1 MB. A file close to the limit keeps the most detail. If you need a much smaller file, pick a smaller size in the tool.',
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
  updatedAt: '2026-10-25',
};
