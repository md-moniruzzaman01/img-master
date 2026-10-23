import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'jpg to png',
  secondaryKeywords: [
    'convert jpg to png',
    'jpeg to png',
    'change jpg to png',
    'jpg to png converter',
    'save photo as png',
  ],
  shortName: 'JPG to PNG',
  cardDescription: 'Save JPG photos as PNG for apps and edits that need it.',
  title: 'Convert JPG to PNG Online – Free, No Upload | Img Master',
  description:
    'Save JPG photos as PNG files for apps, editors and forms that need PNG. No further quality loss, works on any phone, nothing is uploaded. Free.',
  h1: 'Convert JPG to PNG',
  subtitle: 'Save a JPG photo as a PNG file for apps, editors or forms that ask for PNG.',
  howTo: [
    'Choose a JPG or JPEG photo.',
    'The PNG is created as soon as the file is picked.',
    'Save it with Download. Picked several? Use Download all for a ZIP.',
  ],
  howToHeading: 'How to convert JPG to PNG',
  sections: [
    {
      heading: 'Reasons to convert JPG to PNG',
      paragraphs: [
        'Converting JPG to PNG does not make a photo look better, but it is useful in a few cases:',
      ],
      list: [
        'A website, form or app accepts only PNG files.',
        'You plan to edit the image several times. PNG does not lose detail each time you save.',
        'You want to add text or shapes in an editor and keep the edges crisp.',
        'You want a lossless master copy to keep in an archive.',
      ],
    },
    {
      heading: "Things a PNG can't fix",
      paragraphs: [
        'A PNG stores the pixels exactly as they are. It cannot bring back detail that the JPG already lost, and it will not remove blocky marks.',
        'It also does not make the background transparent. A white background in your JPG stays white in the PNG. To remove a background, you need an editing app.',
      ],
    },
    {
      heading: 'Why the PNG file is bigger',
      paragraphs: [
        'JPG is built for photos and throws away detail the eye barely notices. PNG keeps everything, so the same photo saved as PNG is usually much larger. That is expected.',
        'If a form asks for PNG but also has a size limit, check whether it accepts JPG too. If it does, a size tool such as [Compress to 200KB](/compress-image-to-200kb) gives a far smaller file.',
      ],
    },
  ],
  tips: [
    'The conversion runs in your browser, so your photo never leaves your device.',
    'Converting several photos? Pick them together. Each one keeps its name, so **holiday.jpg** becomes **holiday.png**.',
    'Picked a PNG by mistake? Use [PNG to JPG](/png-to-jpg) to go the other way.',
  ],
  faqs: [
    {
      q: 'Does converting JPG to PNG improve quality?',
      a: 'No. The PNG looks exactly like the JPG you started with. It only stops more quality loss when you edit and save again.',
    },
    {
      q: 'Will the PNG have a transparent background?',
      a: 'No. JPG images have no transparency, so the PNG keeps the same background as the original photo.',
    },
    {
      q: 'Why is the PNG file so large?',
      a: 'PNG is lossless, so it stores every pixel. Photos have many small color changes, and storing them without loss takes a lot of space. This is normal.',
    },
    {
      q: 'Can I convert JPEG to PNG?',
      a: 'Yes. JPEG and JPG are the same format with different file name endings. Both work here.',
    },
    {
      q: 'Is it free to convert many photos?',
      a: `Yes. There is no cost, no watermark and no signup. You can convert up to ${siteConfig.maxFiles} photos per batch, as many times as you need.`,
    },
  ],
  related: ['png-to-jpg', 'webp-to-png', 'image-converter', 'compress-image', 'jpg-to-webp'],
  updatedAt: '2026-10-24',
};
