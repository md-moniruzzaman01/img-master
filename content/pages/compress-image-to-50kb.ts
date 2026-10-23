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
  shortName: 'To 50KB',
  cardDescription: 'Get a clear JPG under 50KB for forms and applications.',
  title: 'Compress Image to 50KB Online – Free, No Upload | Img Master',
  description:
    'Reduce any photo to under 50KB in seconds. Works on your phone, keeps faces clear, and your image never leaves your device. Free, no signup.',
  h1: 'Compress Image to 50KB',
  subtitle: 'Get a clear JPG under 50KB for online forms in seconds, right on your phone.',
  howTo: [
    'Tap Choose images and select your photo from the gallery.',
    'The 50KB target is already on, so compression starts right away.',
    'Check the new size and dimensions, then tap Download or Share.',
  ],
  sections: [
    {
      heading: 'Why so many forms ask for a 50KB photo',
      paragraphs: [
        'If you need to compress an image to 50KB, an online form is probably the reason. Application, admission and job websites store a lot of photos, so they set a small size limit. 50KB is a common one for a passport-style photo. The exact rule is different for each form, so always read the instructions on the form itself.',
        'This page gives you a JPG that is under the limit. JPG is the format that nearly every form accepts.',
      ],
    },
    {
      heading: 'How to compress a photo to 50KB and keep your face clear',
      paragraphs: [
        'At 50KB there is enough room for a sharp face if the photo is simple. A plain photo spends its bytes on your face instead of on the background.',
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
        'There are two ways to count a kilobyte. Some sites use 1,000 bytes and others use 1,024 bytes. A file of 50,500 bytes is 49.3KB on one site and 50.5KB on another, so it can pass one check and fail the next.',
        'Img Master keeps every result under the limit in both systems, so a file from this page should pass either way. If a form still rejects it, look at its other rules. It may also ask for exact pixel dimensions, a minimum size, or a JPG file only.',
      ],
    },
    {
      heading: 'JPG or WebP at 50KB?',
      paragraphs: [
        'WebP can hold a little more detail in the same number of bytes. But many forms only accept JPG or JPEG. Keep the default JPG unless the form clearly lists WebP. You can switch the format in the options below the result.',
      ],
    },
  ],
  tips: [
    'Need a smaller file for a signature? Use [Compress to 20KB](/compress-image-to-20kb).',
    'Your phone saved the photo as WebP or PNG? You can still pick it here. The result will be a JPG.',
    'Your last settings are remembered on this device, so the next photo uses the same options.',
  ],
  faqs: [
    {
      q: 'How do I reduce my photo size to 50KB on my phone?',
      a: 'Open this page in your phone browser, tap Choose images and pick the photo. It is compressed to under 50KB right away. Tap Download to save it, or Share to send it to another app.',
    },
    {
      q: 'Will the photo lose quality?',
      a: 'Some detail is removed, because that is how a file gets smaller. The tool removes as little as it can, and it reduces the dimensions only when quality alone is not enough. A plain background and good light help your face stay sharp.',
    },
    {
      q: 'Can I compress several photos to 50KB at once?',
      a: `Yes. You can pick up to ${siteConfig.maxFiles} images at once. Each one is compressed to under 50KB, and you can download them one by one or all together as a ZIP file.`,
    },
    {
      q: 'My photo is already under 50KB. What happens?',
      a: 'You still get a fresh copy under 50KB. It is saved again without hidden photo data, such as the camera model or GPS location.',
    },
    {
      q: 'Does the website keep a copy of my photo?',
      a: 'No. Your photo is processed inside your browser and is never sent to us. When you close the page, the result is gone unless you downloaded it.',
    },
  ],
  related: [
    'compress-image-to-20kb',
    'compress-image-to-100kb',
    'compress-image',
    'png-to-jpg',
    'webp-to-jpg',
  ],
  updatedAt: '2026-10-23',
};
