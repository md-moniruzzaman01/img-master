import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 50kb',
  secondaryKeywords: [
    'reduce photo size to 50kb',
    'photo under 50kb',
    'convert image to 50kb',
    '50kb photo for online form',
    'resize photo to 50kb',
    'compress jpeg to 50kb',
  ],
  shortName: 'To 50 KB',
  cardDescription: 'Job applications, exam and admission forms.',
  title: 'Compress Image to 50KB Online – Free, No Upload | Img Master',
  description:
    'Reduce any photo to under 50 KB on your phone. We keep the sharpest version that fits, faces stay clear, and your image never leaves your device. Free.',
  h1: 'Compress image to 50 KB',
  h1Accent: '50 KB',
  subtitle: 'Get a clear JPG under 50 KB for job, exam and admission forms, right on your phone.',
  sideTip:
    'If your form also asks for a pixel size, resize the photo first, then set Pixel size to Keep exact here.',
  useCases: {
    heading: 'Where a 50 KB limit shows up',
    intro: 'Check the exact rule on your form. Some also ask for a pixel size or JPG only.',
    items: [
      {
        icon: 'document',
        title: 'Job applications',
        text: 'Photo and signature uploads on hiring portals',
      },
      {
        icon: 'cap',
        title: 'Exam & admission forms',
        text: 'Applicant photos with strict size caps',
      },
      {
        icon: 'globe',
        title: 'Government portals',
        text: 'Online applications with upload limits',
      },
      { icon: 'mail', title: 'Email & chat', text: 'Light enough to send on slow connections' },
    ],
  },
  howToHeading: 'How we land under 50 KB',
  howTo: [
    'Read: your browser opens the image. Nothing is sent anywhere.',
    'Search: we try quality levels (high, low, then in between) until the file sits just under 50 KB.',
    'Shrink only if needed: if the lowest good quality is still too big, we reduce the pixel size a little and try again.',
  ],
  sections: [
    {
      heading: 'Compress an image to 50 KB for an online form',
      paragraphs: [
        'If you need to compress an image to 50 KB, an online form is probably the reason. Application, admission and job websites store a lot of photos, so they set a small size limit. The exact rule is different for each form, so always read the instructions on the form itself.',
        'This page gives you a JPG that is under the limit. JPG is the format that nearly every form accepts.',
      ],
    },
    {
      heading: 'Take a photo that stays clear at 50 KB',
      paragraphs: [
        'At 50 KB there is enough room for a sharp face if the photo is simple. A plain photo spends its bytes on your face instead of on the background.',
      ],
      list: [
        'Stand in front of a plain, light-colored wall.',
        'Face a window or a lamp so the light on your face is even.',
        'Let your head and shoulders fill most of the frame.',
        'Move the phone closer instead of using digital zoom.',
      ],
    },
    {
      heading: 'The form still says the file is too big',
      paragraphs: [
        'There are two ways to count a kilobyte. Some sites use 1,000 bytes and others use 1,024 bytes. A file of 50,500 bytes is 49.3 KB on one site and 50.5 KB on another, so it can pass one check and fail the next.',
        'Img Master keeps every result under the limit in both systems, so a file from this page should pass either way. If a form still rejects it, look at its other rules. It may also ask for exact pixel dimensions, a minimum size, or a JPG file only.',
      ],
    },
  ],
  tips: [
    'Need a smaller file for a signature? Use [Compress to 20 KB](/compress-image-to-20kb).',
    'Your phone saved the photo as WebP or PNG? You can still pick it here. The result will be a JPG.',
    'WebP can hold a little more detail in 50 KB, but many forms accept only JPG. Keep the JPG output unless the form clearly lists WebP.',
  ],
  faqs: [
    {
      q: 'Why is the result under 50 KB, not exactly 50?',
      a: 'Upload forms reject anything over the limit, even by one byte. We stop at the highest quality that stays below 50 KB, so the file passes the size check.',
    },
    {
      q: 'Will the photo still be clear?',
      a: 'Some detail is removed, because that is how a file gets smaller. The tool removes as little as it can, and it reduces the dimensions only when quality alone is not enough. A plain background and good light help your face stay sharp.',
    },
    {
      q: 'Can I set the exact pixel size too?',
      a: 'This page can keep the original width and height: set Pixel size to Keep exact. To choose a new width and height, use [Resize image](/resize-image) first, then compress the resized photo here.',
    },
    {
      q: 'My form says JPG only. Is that the default?',
      a: 'Yes. Every result on this page is a JPG unless you change Output to WebP. JPG and JPEG are two names for the same format, so a form that asks for JPEG accepts it.',
    },
    {
      q: 'Can I compress many photos at once?',
      a: `Yes. You can pick up to ${siteConfig.maxFiles} images at once. Each one is compressed to under 50 KB, and you can download them one by one or all together as a ZIP file.`,
    },
    {
      q: 'Does the website keep a copy of my photo?',
      a: 'No. Your photo is processed inside your browser and never leaves your device. When you close the page, the result is gone unless you downloaded it.',
    },
  ],
  related: [
    'compress-image-to-20kb',
    'compress-image-to-100kb',
    'compress-image',
    'resize-image',
    'webp-to-jpg',
  ],
  updatedAt: '2026-10-25',
};
