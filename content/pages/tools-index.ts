// "Every tool" page (/tools, spec §5.5). Owned by seo-content.
// The tool cards come from the registry. The subtitle uses a {count}
// placeholder that the view fills with getLiveToolCount(); see fillCount().
import type { InfoPageContent } from '@/lib/types';

export const toolsIndexContent: InfoPageContent = {
  title: 'All Image Tools – Compress, Convert, Resize | Img Master',
  description:
    'Every free Img Master tool on one page: compress to an exact size, convert JPG, PNG and WebP, resize, and make favicons. All run in your browser.',
  h1: 'Every tool',
  subtitle: '{count} tools. Each does one job well, and none of them uploads your images.',
  sections: [
    {
      heading: 'Which tool do you need?',
      paragraphs: ['Start from what you have to do:'],
      list: [
        'A form or website gives you a file size limit, such as 50 KB: open the size page that matches the limit, or set your own size in the [image compressor](/compress-image).',
        'A site does not accept your file type: use the converter for that pair, for example WebP to JPG.',
        'You need an exact width and height in pixels: use Resize image.',
        'You are building a website and need a tab icon: use the Favicon generator.',
      ],
    },
  ],
  updatedAt: '2026-10-25',
};

/** Fill the {count} placeholder, e.g. fillCount(toolsIndexContent.subtitle, getLiveToolCount()). */
export function fillCount(text: string, count: number): string {
  return text.replace(/\{count\}/g, String(count));
}
