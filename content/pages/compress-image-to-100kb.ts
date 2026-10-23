import type { ToolContent } from '@/lib/types';

// TODO(benchmarks): add a "Typical results" table from reports/benchmarks.json
// (SEO.md §4) once qa-reviewer has measured this size.
export const content: ToolContent = {
  primaryKeyword: 'compress image to 100kb',
  secondaryKeywords: [
    'reduce image size to 100kb',
    'photo under 100kb',
    'compress jpg to 100kb',
    'resize image to 100kb',
    'convert photo to 100kb',
    'document scan under 100kb',
  ],
  shortName: 'To 100KB',
  cardDescription: 'Shrink photos and document scans to under 100KB.',
  title: 'Compress Image to 100KB Online – No Upload | Img Master',
  description:
    'Make any photo or document scan smaller than 100KB on your phone. Text stays readable, hidden photo data is removed, and nothing is uploaded. Free.',
  h1: 'Compress Image to 100KB',
  subtitle: 'Reduce a photo or scanned page to under 100KB with readable text, on your own device.',
  howTo: [
    'Choose one or more images, such as a photo of a certificate.',
    'Each one is compressed to under 100KB without any extra taps.',
    'Save the result with Download, or attach it somewhere else with Share.',
  ],
  sections: [
    {
      heading: 'When to compress an image to 100KB',
      paragraphs: [
        'When you compress an image to 100KB, it gets about twice the room of a 50KB file. That extra space makes a real difference for pictures with small details, like the text on a certificate, a mark sheet or an ID card. Some forms use a limit like this for document uploads.',
        'If a form gives you a limit of 100KB, use that size and not a smaller one. A file close to the limit keeps more detail.',
      ],
    },
    {
      heading: 'Taking a document photo that stays readable',
      paragraphs: [
        'Text needs sharp edges between dark letters and light paper. A clean, bright photo keeps those edges at 100KB. A dark or tilted photo wastes bytes on noise and shadows.',
      ],
      list: [
        'Lay the paper flat on a dark table, so the edges are easy to see.',
        'Use daylight from a window. The flash can leave a bright spot that hides words.',
        'Hold the phone straight above the page.',
        'Crop to the page edges in your gallery app before you start.',
      ],
    },
    {
      heading: 'When the width and height get smaller',
      paragraphs: [
        'A full phone photo is usually several megabytes. To reach 100KB, the tool first lowers the JPG quality. If the letters would start to look blotchy, it reduces the width and height instead, and the result shows the new size in pixels. A smaller page with clean letters is easier to read than a large page with blurred ones.',
        'If you must keep the original dimensions, turn on **Keep original dimensions** in the options. Only the quality is lowered then, which can make small text look rough.',
      ],
    },
  ],
  tips: [
    'For a document with several pages, take one photo per page and pick them all at once. Each page becomes its own file under 100KB.',
    'If the result looks soft, check whether the form allows [200KB](/compress-image-to-200kb).',
  ],
  faqs: [
    {
      q: 'How can I make a scanned document under 100KB?',
      a: 'Take a clear photo of the page, or use your scanner app, then pick the image here. It is compressed to under 100KB at once. Save it with Download.',
    },
    {
      q: 'Will the text on my certificate still be readable?',
      a: 'In a clear, well-lit photo, usually yes. Good light and a straight angle help the most. If small text looks rough, crop away the empty edges or use a larger limit.',
    },
    {
      q: 'Can I compress a PDF to 100KB here?',
      a: 'No. Img Master works with images such as JPG, PNG and WebP. For a PDF you need a different tool. Another option is to take a screenshot of the page and compress that image.',
    },
    {
      q: 'Why is the file 97KB and not exactly 100KB?',
      a: 'The tool stays a little under the limit instead of landing on it exactly. It also checks the limit using 1KB = 1,000 bytes, the stricter way of counting, so the file passes on any website. A few kilobytes make no visible difference.',
    },
    {
      q: 'Is it safe to compress my ID card here?',
      a: 'Your image is processed only in your browser. It is not uploaded, not saved on a server, and not seen by anyone else.',
    },
  ],
  related: [
    'compress-image-to-50kb',
    'compress-image-to-200kb',
    'compress-image',
    'png-to-jpg',
    'image-converter',
  ],
  updatedAt: '2026-10-23',
};
