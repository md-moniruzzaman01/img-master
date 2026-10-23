// Tool microcopy (DESIGN.md §6). Strings marked "invented" are not in DESIGN.md
// and are listed in the ui-builder report for review.
import type { EngineErrorCode, EngineNote } from '@/lib/types';
import { formatBytes, percentSmaller, targetText } from './format';

export const copy = {
  pickerButton: 'Choose images',
  pickerHintMobile: (max: number) => `JPG, PNG, WebP · up to ${max} at once`,
  pickerHintDesktop: 'or drop images here, or paste with Ctrl+V',
  dropHere: 'Drop images to start', // invented
  privacy: 'Your images stay on your device. Nothing is uploaded.',

  processing(verb: 'compress' | 'convert', n: number, m: number): string {
    if (verb === 'compress') return m === 1 ? 'Compressing…' : `Compressing photo ${n} of ${m}…`;
    return m === 1 ? 'Converting…' : `Converting ${n} of ${m}…`;
  },
  waiting: 'Waiting…', // invented (queued card, screen readers)

  successLine(inputBytes: number, outputBytes: number): string {
    const p = percentSmaller(inputBytes, outputBytes);
    const before = formatBytes(inputBytes);
    const after = formatBytes(outputBytes);
    if (p > 0) return `${before} → ${after} (${p}% smaller)`;
    if (p < 0) return `${before} → ${after} (${-p}% larger)`; // invented
    // Rounds to 0% but the bytes differ: say which way, never "same size".
    if (outputBytes > inputBytes) return `${before} → ${after} (slightly larger)`; // invented
    if (outputBytes < inputBytes) return `${before} → ${after} (slightly smaller)`; // invented
    return `${before} → ${after} (same size)`; // invented
  },

  alreadySmall: (targetKB: number) =>
    `Already under ${targetText(targetKB)}. We saved a clean copy without hidden photo data.`,
  resizedToTarget: (w: number, h: number, targetKB: number) =>
    `Resized to ${w} × ${h} px to reach ${targetText(targetKB)}.`,
  resized: (w: number, h: number) => `Resized to ${w} × ${h} px.`, // invented (max width)
  bigImage:
    'This photo is very large, so we reduced its dimensions first to keep your phone fast.',
  flattened: 'Transparent areas were filled with your background color.', // invented
  notSmaller: "We couldn't make this file smaller. Try JPG or WebP, or a lower quality.", // invented
  animationDropped: 'This was an animation. We kept the first frame.', // invented

  unreachable: (targetKB: number, nextKB: number, canAllowSmaller: boolean) =>
    canAllowSmaller
      ? `We couldn't get this image under ${targetText(targetKB)} and keep it readable. Try ${targetText(nextKB)}, or allow smaller dimensions.`
      : // invented variant: dimensions are already allowed to shrink
        `We couldn't get this image under ${targetText(targetKB)} and keep it readable. Try ${targetText(nextKB)}.`,
  smallestReached: (bytes: number) => `The smallest we could reach was ${formatBytes(bytes)}.`, // invented
  notAnImage: "We can't open this file. Try a JPG, PNG or WebP image.",
  tooMany: (max: number) => `You can add up to ${max} images at once. We took the first ${max}.`,
  webpUnsupported:
    "Your browser can't save WebP files yet. Try Chrome or Firefox, or choose JPG.",
  outOfMemory: 'This photo is too large for your device right now. Close other apps or tabs and try again.', // invented
  unknownError: 'Something went wrong with this image. Please try again.', // invented
  engineLoadFailed: "We couldn't start the image tool. Check your connection and reload the page.", // invented

  download: (bytes: number) => `Download (${formatBytes(bytes)})`,
  downloadAll: (bytes: number) => `Download all (ZIP, ${formatBytes(bytes)})`,
  preparingZip: 'Preparing ZIP…', // invented
  share: 'Share',
  again: (verb: 'compress' | 'convert') =>
    verb === 'compress' ? 'Compress another' : 'Convert another',

  saved: 'Saved',
  savedIos: 'Ready — use Share to save to Photos',

  results: 'Results',
  moreOptions: 'More options',
  optionsChanged: 'Your new options are ready.', // invented
  applyTo: (n: number) => `Apply to ${n} images`, // invented
  tryTarget: (kb: number) => `Try ${targetText(kb)}`, // invented (button)
  allowSmaller: 'Allow smaller dimensions', // invented (button)
  useJpg: 'Use JPG', // invented (button)
  reload: 'Reload page', // invented (button)
  confirmReplace: "You haven't saved your results yet. Start over with the new images?", // invented

  doneSingle: (outputBytes: number, inputBytes: number) => {
    const p = percentSmaller(inputBytes, outputBytes);
    return p > 0
      ? `Done. ${formatBytes(outputBytes)}, ${p}% smaller`
      : `Done. ${formatBytes(outputBytes)}`;
  },
  doneMany: (ok: number, total: number) =>
    ok === total ? `Done. ${total} images are ready.` : `Done. ${ok} of ${total} images are ready.`, // invented
  noneWorked: 'None of the images could be processed.', // invented
  comingSoon: 'This tool is coming soon.', // invented
  working: 'Working…', // invented (busy card, screen readers)
  failedOne: "This image couldn't be processed.", // invented
  doneBang: (n: number) => (n === 1 ? 'Done!' : `Done! ${n} images are ready.`), // invented (count)
  zipFailed: "We couldn't make the ZIP. Download the images one by one.", // invented
  backgroundLabel: 'Background color', // invented
  backgroundHint: 'Fills transparent areas, because JPG has no transparency.', // invented
} as const;

export function errorMessage(code: EngineErrorCode | 'UNKNOWN'): string {
  switch (code) {
    case 'UNSUPPORTED_FORMAT':
    case 'DECODE_FAILED':
      return copy.notAnImage;
    case 'ENCODE_UNSUPPORTED':
      return copy.webpUnsupported;
    case 'OUT_OF_MEMORY':
      return copy.outOfMemory;
    default:
      return copy.unknownError;
  }
}

/** Notes that warn (dimensions changed) vs. notes that only inform. */
export const WARNING_NOTES: readonly EngineNote[] = [
  'resized',
  'downscaled-for-memory',
  'not-smaller',
];
