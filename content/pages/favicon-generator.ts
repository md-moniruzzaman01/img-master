import type { ToolContent } from '@/lib/types';

// Hub page for the Favicon category: image mode, plus links to every favicon tool.
export const content: ToolContent = {
  primaryKeyword: 'favicon generator',
  secondaryKeywords: [
    'create favicon from image',
    'favicon.ico generator',
    'make a favicon',
    'website icon maker',
    'apple touch icon generator',
    'favicon for website',
  ],
  shortName: 'Favicon generator',
  cardDescription: 'Turn a logo or photo into a full favicon pack.',
  title: 'Favicon Generator – Free, No Upload | Img Master',
  description:
    'Turn a logo or picture into a full favicon pack: ICO, PNG sizes, Apple icon and manifest. Preview it first. Free, runs in your browser, no upload.',
  h1: 'Favicon Generator',
  subtitle: 'Use this favicon generator to turn your logo into every icon file a website needs.',
  howTo: [
    'Choose a square logo or picture. Use the zoom slider and padding to fit it.',
    'Check the preview in the browser tab and on the phone home screen.',
    'Download the ZIP, or copy the HTML snippet and add it to your site.',
  ],
  howToHeading: 'How to use the favicon generator',
  sections: [
    {
      heading: 'What this favicon generator makes',
      paragraphs: [
        'A favicon is the small icon shown in a browser tab, in bookmarks and on a phone home screen. One image is not enough for all of these places, so this favicon generator makes a full set from your picture.',
        'The ZIP file contains the files below. A README.txt inside the ZIP repeats the HTML snippet, and the snippet is also shown on the page with a Copy button.',
      ],
      table: {
        caption: 'Files in the favicon ZIP',
        headers: ['File', 'Used for'],
        rows: [
          ['favicon.ico (16, 32, 48)', 'Browser tabs, and older browsers'],
          ['favicon-16x16.png, favicon-32x32.png', 'Browser tabs and bookmarks'],
          ['apple-touch-icon.png (180)', 'iPhone and iPad home screens'],
          ['android-chrome-192x192.png, android-chrome-512x512.png', 'Android home screens'],
          ['site.webmanifest', 'Lists the Android icons for your site'],
        ],
      },
    },
    {
      heading: 'Choose the right favicon tool',
      paragraphs: [
        'Start from the kind of source you have. All four tools give you the same kind of download, except that the SVG file comes only from the text and emoji tools.',
      ],
      table: {
        caption: 'Favicon tools on Img Master',
        headers: ['Tool', 'Start from'],
        rows: [
          [
            '[Favicon from text](/favicon-from-text)',
            'One to three letters, such as your initials',
          ],
          ['[Favicon from emoji](/favicon-from-emoji)', 'One emoji from your keyboard'],
          ['[PNG to ICO](/png-to-ico)', 'A PNG you already have, saved as a .ico file'],
        ],
      },
    },
    {
      heading: 'Get a clear result from a logo',
      paragraphs: [
        'Icons are tiny, so a detailed logo turns into a blur at 16 pixels. Pick a logo with one simple shape. The tool crops the middle square of your image, so move the zoom slider until the main shape fills the frame.',
        'Add a little padding if the shape touches the edge. Choose a background color for a logo with a clear background, or keep it transparent. Then look at the real-size previews, not only the large one.',
      ],
    },
  ],
  tips: [
    'Start from a square image at least 512 pixels wide, so the large sizes stay sharp.',
    'If you already have a PNG and only need a .ico file, use [PNG to ICO](/png-to-ico).',
  ],
  faqs: [
    {
      q: 'What size should my favicon image be?',
      a: 'Use a square picture, and the bigger the better. The tool makes the small sizes for you. A starting image of 512 by 512 pixels or more gives the sharpest result.',
    },
    {
      q: 'Is my logo uploaded to a server?',
      a: 'No. The icons are drawn by your browser, so your logo never leaves your device. Nothing is sent to us or to any other service.',
    },
    {
      q: 'How do I add the favicon to my website?',
      a: 'Unzip the files and put them in the main folder of your site. Then copy the HTML snippet into the head section of your pages. The README.txt in the ZIP has the same snippet.',
    },
    {
      q: 'Why does my old favicon still show?',
      a: 'Browsers keep favicons in a cache for a long time. Close the tab and open the site again, or clear the browser data. You can also rename the file and update the link.',
    },
    {
      q: 'Do I still need a favicon.ico file?',
      a: 'It is a safe choice, because many tools and older browsers look for it. Most current browsers also accept PNG icons, so the ZIP gives you both.',
    },
  ],
  related: [
    'favicon-from-text',
    'favicon-from-emoji',
    'png-to-ico',
    'image-converter',
    'compress-image',
  ],
  updatedAt: '2026-10-24',
};
