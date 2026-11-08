// "How it works" page (/how-it-works, spec §5.6). Owned by seo-content.
// Every statement here must match docs/ENGINE.md and lib/image-engine.
import { siteConfig } from '@/lib/site-config';
import type { InfoPageContent } from '@/lib/types';

export const howItWorksContent: InfoPageContent = {
  title: 'How It Works – Image Tools With No Upload | Img Master',
  description:
    'See how Img Master compresses and converts images inside your browser: read, search, shrink only if needed. Nothing is uploaded, and batches save as a ZIP.',
  h1: 'How it works',
  subtitle:
    'Every tool runs inside your browser. Here is what happens to your image, step by step, and where the limits are.',
  sections: [
    {
      heading: 'Read, search, shrink only if needed',
      paragraphs: [
        'When you compress an image to a size such as [50 KB](/compress-image-to-50kb), three things happen on your device:',
      ],
      list: [
        '**Read.** Your browser opens the image. Phone photos are turned the right way up, using the rotation the camera saved.',
        '**Search.** We save the picture at different quality levels: high, low, then in between. We keep the highest quality that lands under your limit.',
        '**Shrink only if needed.** If even a low quality is still too big, we make the picture a little smaller in pixels and search again. The result tells you when this happened.',
      ],
    },
    {
      heading: 'What "nothing is uploaded" means',
      paragraphs: [
        `${siteConfig.name} is a set of plain web pages. There is no server program that could receive a photo, and no upload button that sends one. When you open a page, your browser downloads the page and its code. After that, the browser reads your image, draws it, and saves the new file with its own built-in image tools.`,
        'The heavy work usually runs in a background worker inside the same browser tab, so the page stays responsive. Your image never leaves your device. The new file contains only the picture, so hidden photo data such as GPS location is not copied. The [privacy policy](/privacy) lists everything else the site does and does not collect.',
      ],
    },
    {
      heading: 'Many files at once',
      paragraphs: [
        `You can pick up to ${siteConfig.maxFiles} images in one batch. The results are listed in the order you picked them. Each file can be saved on its own, or you can tap **Download all** to get one ZIP file. The ZIP is also made on your device.`,
        'Each new file keeps its original name with a short ending, such as **photo-50kb.jpg**, so it is easy to find next to the original.',
      ],
    },
    {
      heading: 'Limits you may meet',
      paragraphs: ['The tools are honest about what they cannot do:'],
      list: [
        'Images over 16.7 megapixels are made smaller first, to protect your phone from running out of memory. The result shows a note when this happens.',
        'Animated GIF and WebP files keep only their first frame.',
        'HEIC photos from an iPhone open only in browsers that can read HEIC, such as Safari.',
        'PDF files are not supported. The tools work with images only.',
        'If a very small target cannot be reached without ruining the picture, the tool says so and suggests a larger size, instead of giving you a bad file.',
        'Large photos take longer on older phones, because your own device does the work.',
      ],
    },
  ],
  faqs: [
    {
      q: 'Do I need an internet connection?',
      a: 'You need one to open the page. The image work itself happens on your device, so a slow connection does not slow it down.',
    },
    {
      q: 'Can you see the photos I compress?',
      a: 'No. The photo is never sent to us, so there is nothing for us to see or store. It stays in your browser until you close or reload the page.',
    },
    {
      q: 'Why did my image get smaller in pixels?',
      a: 'The tool lowers the quality first. If the lowest good quality is still over your limit, it reduces the width and height a little and tries again. A smaller, clean picture usually looks better than a large, blocky one.',
    },
    {
      q: 'Why does my new file have no location data?',
      a: 'The browser draws the picture again and saves only the pixels. Hidden details from the camera, such as GPS location, the phone model and the date taken, are not copied into the new file.',
    },
  ],
  updatedAt: '2026-10-25',
};
