import { siteConfig } from '@/lib/site-config';
import type { ToolContent } from '@/lib/types';

export const content: ToolContent = {
  primaryKeyword: 'heic to jpg',
  secondaryKeywords: [
    'heic to jpg converter',
    'convert heic to jpg',
    'heic to jpeg',
    'heic to jpg online',
    'change heic to jpg',
    'open heic file on windows',
    'heic converter',
    'heif to jpg',
  ],
  shortName: 'HEIC to JPG',
  cardDescription: 'Make iPhone photos open anywhere.',
  title: 'Convert HEIC to JPG Online – Free, No Upload | Img Samurai',
  description:
    'HEIC to JPG converter for iPhone photos. Open them on Windows, Android and upload forms. Many files at once, no upload, no signup. Free on your phone.',
  h1: 'Convert HEIC to JPG',
  h1Accent: 'JPG',
  subtitle: 'Convert HEIC to JPG so your iPhone photos open on Windows, Android and upload forms.',
  sideTip: 'Photos from an iPhone have no clear areas, so the fill color rarely matters.',
  howTo: [
    'Pick one or more HEIC photos from your gallery, Files app or computer.',
    'Each photo is changed to JPG at once. The first time, a small reader loads for a few seconds.',
    'Tap Download for each JPG, or Download all for a ZIP. On a phone, Share sends them on.',
  ],
  howToHeading: 'How to convert HEIC to JPG',
  sections: [
    {
      heading: 'Why convert HEIC to JPG?',
      paragraphs: [
        'You can change HEIC to JPG when a photo from an iPhone or iPad will not open or will not upload. HEIC, also called HEIF, is the photo format that iPhones and iPads use by default. It is made to keep photo files small. JPG is older, but almost every phone, computer and website understands it.',
      ],
      list: [
        'Many Windows apps cannot show HEIC photos.',
        'Some older Android phones cannot open them either.',
        'Email and chat apps may show no preview for a HEIC file.',
        'Many upload forms accept only JPG or PNG.',
      ],
    },
    {
      heading: 'Open HEIC file on Windows without installing anything',
      paragraphs: [
        'If you copied photos from an iPhone to a Windows computer and they will not open, you do not need a new program. Open this HEIC to JPG converter in Chrome, Edge or Firefox, choose the photos, and save the JPG copies. They open in the normal photo viewer, in Word and in an email.',
        'The original HEIC file stays where it is. You get a new JPG next to it, with the same name and a .jpg ending.',
      ],
    },
    {
      heading: 'How your browser opens HEIC',
      paragraphs: [
        'Safari on iPhone, iPad and Mac can read HEIC by itself. Chrome, Edge and Firefox cannot, so on those browsers the page loads a small open-source reader called libheif the first time you pick a HEIC photo. It runs inside your browser and comes from our own site, not from another server. It takes a few seconds once, and your photo is still never uploaded.',
      ],
      table: {
        caption: 'HEIC to JPG: what changes',
        headers: ['Part of the photo', 'What happens'],
        rows: [
          ['Quality', 'Saved at 90 by default; move the slider for a smaller file'],
          ['Pixel size', 'Kept, unless the photo is over 16.7 megapixels'],
          ['Transparent areas', 'Filled with the color you pick (white by default)'],
          ['Live Photo or burst', 'Only the main photo is converted'],
          ['Hidden data', 'Location and camera details are not copied'],
        ],
      },
    },
    {
      heading: 'Many photos at once, and sharing',
      paragraphs: [
        `Choose up to ${siteConfig.maxFiles} photos in one go. Every HEIC photo becomes its own JPG, so **IMG_0421.heic** turns into **IMG_0421.jpg**. **Download all** gives you the whole set in one ZIP file.`,
        'A photo over 16.7 megapixels, such as one from a 48 MP camera, is made smaller first, so a phone with little memory can finish. The result tells you when that happens. Very rare HEIC files may still not open. If so, share the photo again from the iPhone and choose **Most Compatible**.',
      ],
    },
  ],
  tips: [
    'Want a JPG straight from the camera next time? On iPhone, go to Settings, Camera, Formats, and choose **Most Compatible**.',
    'Need exact pixels for editing instead? Use [HEIC to PNG](/heic-to-png).',
  ],
  faqs: [
    {
      q: 'Why is my iPhone photo HEIC?',
      a: 'iPhones save photos as HEIC by default, because the files are smaller than JPG. The photo looks the same on the iPhone. The problem starts when you send it to a device or website that does not know HEIC.',
    },
    {
      q: 'How do I open a HEIC file on Windows?',
      a: 'The easy way is to convert it. Choose the HEIC file on this page, download the JPG, and open that in any photo app. Nothing is installed on your computer.',
    },
    {
      q: 'Is HEIC to JPG conversion safe, and does it upload my photo?',
      a: 'It is safe because nothing is uploaded. This HEIC to JPG converter works in your browser. The photo is opened and saved inside your browser, and it never leaves your device. The small HEIC reader loads from our own site.',
    },
    {
      q: 'Is HEIC to JPEG the same as HEIC to JPG?',
      a: 'Yes. HEIC to JPEG gives the same result as HEIC to JPG, because JPG and JPEG are two names for one format. If a form asks for JPEG, a .jpg file is accepted.',
    },
    {
      q: 'How do I make my iPhone save JPG instead of HEIC?',
      a: 'Open Settings, then Camera, then Formats, and choose Most Compatible. New photos are saved as JPG. Photos you took before stay HEIC, so convert those here.',
    },
    {
      q: 'Does converting HEIC to JPG reduce quality?',
      a: 'JPG removes a little detail to save space. At quality 90 the change is hard to see on a screen. If the JPG is too big for a form, try [Compress to 500 KB](/compress-image-to-500kb).',
    },
  ],
  related: [
    'heic-to-png',
    'image-converter',
    'compress-image',
    'compress-image-to-500kb',
    'webp-to-jpg',
  ],
  updatedAt: '2026-11-16',
};
