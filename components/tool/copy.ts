// Tool microcopy (DESIGN.md §6 + the Figma "Ink Samurai v2" frames). Strings
// marked "invented" are in neither and are listed in the ui-builder report.
import type { EngineErrorCode, EngineNote } from '@/lib/types';
import { formatBytes, percentSmaller, targetText } from './format';

type Verb = 'compress' | 'convert' | 'resize';

export const copy = {
  pickerButton: 'Choose images',
  pickerButtonFormat: (format: string) => `Choose ${format} files`,
  dropHere: 'Drop images here',
  dropHereFormat: (format: string) => `Drop ${format} images here`,
  tapToChoose: 'Tap to choose photos',
  release: 'Release to start the cut',
  pickerHintDesktop: (max: number) => `or paste with Ctrl+V · JPG, PNG, WebP · up to ${max} files`,
  pickerHintConvert: (max: number) => `or paste with Ctrl+V · up to ${max} files · one ZIP for many`,
  pickerHintMobile: (max: number) => `JPG, PNG, WebP · up to ${max} photos`,
  pickerHintHero: 'or paste with Ctrl+V · JPG, PNG, WebP',
  stepTarget: 'Target size',
  stepDrop: 'Drop images here',

  privacy: 'Processed on this device. Nothing is uploaded.',
  privacyConvert: 'Converted on this device. Nothing is uploaded.',
  privacyDone: 'Done on this device. Your originals were never uploaded.',
  sample: 'No image? Try a sample',
  sampleMobile: 'No photo handy? Try a sample',
  sampleFailed: "We couldn't make the sample image. Choose one of your own.", // invented

  output: 'Output',
  maxWidth: 'Max width',
  keepOriginal: 'Keep original',
  pixelSize: 'Pixel size',
  keepExact: 'Keep exact',
  allowSmaller: 'Allow smaller',
  location: 'Location data',
  locationRemoved: 'removed',
  moreOptions: 'More options',
  moreSummary: (format: string, keep: boolean) =>
    `${format} · ${keep ? 'keep pixel size' : 'pixel size may shrink'}`,
  sizeMode: 'Target size',
  qualityMode: 'Quality',
  maxFileSize: 'Max file size',
  quality: 'Quality',
  fill: 'Fill transparent areas with',
  fillWhite: 'White',
  fillPaper: 'Paper',
  fillBlack: 'Black',
  fillCustom: 'Pick a colour', // invented
  swapTo: (a: string, b: string) => `Swap to ${a} → ${b}`,
  outputs: 'Output: JPG · PNG · WebP',
  convertTo: 'Convert to',
  anyFormat: 'Any',

  // Resize
  resizeBy: 'Resize by', // invented
  byPixels: 'Pixels', // invented
  byPercent: 'Percent', // invented
  width: 'Width',
  height: 'Height',
  auto: 'Auto', // invented
  percent: 'Scale', // invented
  keepRatio: 'Keep ratio', // invented
  keepRatioOn: 'Ratio locked', // invented
  keepRatioOff: 'Ratio unlocked', // invented
  sameFormat: 'Same as original', // invented
  sameShort: 'Same', // invented
  formatLabel: 'Format', // invented
  resizeHint: 'Leave one side on Auto to keep the shape.', // invented
  resizeFitHint: 'The image fits inside this box and keeps its shape.', // invented
  resizePercentHint: 'Width and height scale together.', // invented
  percentKeeps: '100% keeps the size.', // invented
  resizeNeedSize: 'Enter a width or a height.', // invented
  resizeBadPixels: 'Use a size from 1 to 20,000 px.', // invented
  resizeBadPercent: 'Use a percent from 1 to 400.', // invented
  resizeWaiting: 'Your image will start when this is fixed.', // invented
  resizeTooBig: (w: number, h: number) => `Largest size for this image is ${w} × ${h} px.`, // invented
  resizeDoneLive: (w: number, h: number, bytes: number) =>
    `Done. ${w} by ${h} pixels, ${formatBytes(bytes)}`, // invented

  // States (samurai panel)
  stage: {
    idle: {
      label: 'Idle',
      title: 'Ready when you are',
      line: 'Choose a size, then drop your image.',
      compact: { label: 'Ready', title: 'Choose your photos.' },
    },
    idleConvert: { label: 'Ready', title: 'Blade drawn', line: 'Release to start the cut.' },
    idleOther: { label: 'Idle', title: 'Ready when you are', line: 'Drop your image to start.' }, // invented
    ready: { label: 'Ready', title: 'Blade drawn', line: 'Release to start the cut.' },
    readyMobile: 'Choose your photos.',
    cutting: { label: 'Cutting', title: 'Measuring the cut…' },
    cuttingLine: (target?: string) =>
      target ? `Trying quality levels to land under ${target}.` : 'Working on your images.', // second half invented
    done: { label: 'Done', title: 'Clean cut' },
    doneLine: (n: number, before: number, after: number) =>
      `${n} ${n === 1 ? 'image' : 'images'} · ${formatBytes(before)} → ${formatBytes(after)}`,
    error: { label: 'Error', title: 'That one resisted' },
  },
  tip: 'Tip',

  // Banners
  cutting: (verb: Verb, m: number) =>
    m === 1
      ? verb === 'convert'
        ? 'Converting your image…'
        : verb === 'resize'
          ? 'Resizing your image…'
          : 'Cutting your image…'
      : `${verb === 'convert' ? 'Converting' : verb === 'resize' ? 'Resizing' : 'Cutting'} ${m} images…`,
  cuttingLine: (target: string | undefined, done: number, m: number) =>
    target
      ? `Trying quality levels to land under ${target} · ${done} of ${m} done`
      : `${done} of ${m} done`,
  cleanCut: (n: number) => (n === 1 ? 'Clean cut. Your image is ready.' : `Clean cut. ${n} images ready.`),
  cleanCutMobile: (n: number) => (n === 1 ? 'Clean cut. Ready.' : `Clean cut. ${n} ready.`),
  totals: (before: number, after: number, target?: string) => {
    const p = percentSmaller(before, after);
    const parts = [`${formatBytes(before)} → ${formatBytes(after)} in total`];
    if (p > 0) parts.push(`${p}% lighter`);
    if (target) parts.push(`all under ${target}`);
    return parts.join(' · ');
  },
  someFailed: (failed: number) =>
    failed === 1 ? "One file couldn't be cut." : `${failed} files couldn't be cut.`,
  noneWorked: 'That one resisted.',
  readyOf: (ok: number, m: number) => `${ok} of ${m} ready`,
  downloadAll: (bytes: number) => `Download all (ZIP) · ${formatBytes(bytes)}`,
  downloadAllShort: 'Download all (ZIP)',
  downloadSome: (n: number) => `Download ${n} images (ZIP)`,
  preparingZip: 'Preparing ZIP…', // invented
  zipFailed: "We couldn't make the ZIP. Download the images one by one.", // invented

  // Rows
  waiting: 'Waiting…', // invented
  working: 'Working…', // invented
  cuttingBadge: 'Cutting',
  under: (target: string) => `Under ${target}`,
  qualityPct: (q: number) => `Quality ${Math.round(q * 100)}%`,
  resizedTo: (w: number, h: number) => `resized to ${w} × ${h}`,
  compare: 'Compare',
  results: 'Results',
  download: (bytes: number) => `Download · ${formatBytes(bytes)}`,
  doneBang: (n: number) => (n === 1 ? 'Clean cut.' : `Clean cut. ${n} images ready.`),
  backgroundLabel: 'Background colour',
  backgroundHint: 'Fills transparent areas when saving as JPG.',
  save: 'Save',
  share: 'Share',
  remove: 'Remove',
  notAnImageBadge: 'Not an image',
  failedBadge: "Couldn't cut", // invented
  removeHint: 'Remove it, or choose a JPG, PNG or WebP file instead.',

  // Footer of the results
  again: (verb: Verb) =>
    verb === 'compress' ? 'Compress more images' : verb === 'resize' ? 'Resize more images' : 'Convert more images',
  againMobile: (verb: Verb) =>
    verb === 'compress' ? 'Compress more photos' : verb === 'resize' ? 'Resize more photos' : 'Convert more photos',
  smaller: 'Need it even smaller?',
  smallerMobile: 'Need it smaller?',
  tryTargetLink: (label: string) => `Try ${label}`,

  // Notes (one line under the numbers)
  alreadySmall: (targetKB: number) =>
    `Already under ${targetText(targetKB)}. We saved a clean copy without hidden photo data.`,
  resizedToTarget: (w: number, h: number, targetKB: number) =>
    `Resized to ${w} × ${h} px to reach ${targetText(targetKB)}.`,
  resized: (w: number, h: number) => `Resized to ${w} × ${h} px.`, // invented (max width)
  bigImage: 'This photo is very large, so we reduced its dimensions first to keep your phone fast.',
  flattened: 'Transparent areas were filled with your background colour.', // invented
  notSmaller: "We couldn't make this file smaller. Try JPG or WebP, or a lower quality.", // invented
  animationDropped: 'This was an animation. We kept the first frame.', // invented

  // Errors
  unreachable: (targetKB: number, nextKB: number, canAllowSmaller: boolean) =>
    canAllowSmaller
      ? `We couldn't get this image under ${targetText(targetKB)} and keep it readable. Try ${targetText(nextKB)}, or allow smaller dimensions.`
      : `We couldn't get this image under ${targetText(targetKB)} and keep it readable. Try ${targetText(nextKB)}.`,
  smallestReached: (bytes: number) => `The smallest we could reach was ${formatBytes(bytes)}.`, // invented
  notAnImage: "We can't open this file. Try a JPG, PNG or WebP image.",
  notAnImageNamed: (name: string) => `“${name}” isn't an image. Use JPG, PNG or WebP.`,
  tooMany: (max: number) => `You can add up to ${max} images at once. We took the first ${max}.`,
  webpUnsupported: "Your browser can't save WebP files yet. Try Chrome or Firefox, or choose JPG.",
  outOfMemory:
    'This photo is too large for your device right now. Close other apps or tabs and try again.', // invented
  unknownError: 'Something went wrong with this image. Please try again.', // invented
  engineLoadFailed: "We couldn't start the image tool. Check your connection and reload the page.", // invented
  invalidOptions: 'These sizes don’t work for this image. Try smaller numbers.', // invented (fallback)
  needPng: 'This tool needs a PNG file. Convert your image to PNG first.', // invented

  tryTarget: (kb: number) => `Try ${targetText(kb)}`, // invented (button)
  allowSmallerButton: 'Allow smaller dimensions', // invented (button)
  useJpg: 'Use JPG', // invented (button)
  reload: 'Reload page', // invented (button)
  confirmReplace: "You haven't saved your results yet. Start over with the new images?", // invented
  optionsChanged: 'Your new options are ready.', // invented
  applyTo: (n: number) => `Apply to ${n} images`, // invented
  saved: 'Saved',
  savedIos: 'Ready — use Share to save to Photos',

  // Live region
  processing(verb: Verb, n: number, m: number): string {
    if (verb === 'compress') return m === 1 ? 'Compressing…' : `Compressing photo ${n} of ${m}…`;
    if (verb === 'resize') return m === 1 ? 'Resizing…' : `Resizing ${n} of ${m}…`; // invented
    return m === 1 ? 'Converting…' : `Converting ${n} of ${m}…`;
  },
  doneSingle: (outputBytes: number, inputBytes: number) => {
    const p = percentSmaller(inputBytes, outputBytes);
    return p > 0
      ? `Done. ${formatBytes(outputBytes)}, ${p}% smaller`
      : `Done. ${formatBytes(outputBytes)}`;
  },
  doneMany: (ok: number, total: number) =>
    ok === total ? `Done. ${total} images are ready.` : `Done. ${ok} of ${total} images are ready.`, // invented
  failedOne: "This image couldn't be processed.", // invented
  noneWorkedLive: 'None of the images could be processed.', // invented
  comingSoon: 'This tool is coming soon.', // invented

  /** "98% smaller" (the row shows it under the sizes). */
  change(inputBytes: number, outputBytes: number): string {
    const p = percentSmaller(inputBytes, outputBytes);
    if (p > 0) return `${p}% smaller`;
    if (p < 0) return `${-p}% larger`; // invented
    if (outputBytes > inputBytes) return 'slightly larger'; // invented
    if (outputBytes < inputBytes) return 'slightly smaller'; // invented
    return 'same size'; // invented
  },

  // Compare dialog
  compareTitle: (name: string) => `Compare: ${name}`, // invented
  original: 'Original',
  result: 'Result',
  compareHint: 'Drag the line, or use the arrow keys.', // invented
  sliderLabel: 'Before and after', // invented
  sliderValue: (pct: number) => `${pct}% original, ${100 - pct}% result`, // invented
  close: 'Close',
} as const;

export function errorMessage(code: EngineErrorCode | 'UNKNOWN', message?: string): string {
  switch (code) {
    case 'UNSUPPORTED_FORMAT':
    case 'DECODE_FAILED':
      return copy.notAnImage;
    case 'ENCODE_UNSUPPORTED':
      return copy.webpUnsupported;
    case 'OUT_OF_MEMORY':
      return copy.outOfMemory;
    case 'INVALID_OPTIONS':
      // The engine's message is plain English ("The largest is 4729 × 3547 px.").
      return message || copy.invalidOptions;
    default:
      return copy.unknownError;
  }
}

/** Short badge for a failed row. */
export function errorBadge(code: EngineErrorCode | 'UNKNOWN'): string {
  return code === 'UNSUPPORTED_FORMAT' || code === 'DECODE_FAILED' ? copy.notAnImageBadge : copy.failedBadge;
}

/** Notes that warn (dimensions changed) vs. notes that only inform. */
export const WARNING_NOTES: readonly EngineNote[] = [
  'resized',
  'downscaled-for-memory',
  'not-smaller',
];
