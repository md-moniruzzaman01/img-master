// Favicon microcopy. Strings marked "invented" are not in DESIGN.md §6 and are
// listed in the ui-builder report for review. Plain English, short sentences.

export const faviconCopy = {
  // Mode tabs
  modeLabel: 'Make your icon from', // invented
  modeImage: 'Image',
  modeText: 'Text',
  modeEmoji: 'Emoji',

  // Image mode
  pickImage: 'Choose an image', // invented
  pickAnother: 'Choose a different image', // invented
  imageHint: 'PNG, JPG or WebP · square images work best', // invented
  imageHintDesktop: 'or drop an image here, or paste with Ctrl+V', // invented
  zoom: 'Zoom', // invented
  zoomHint: 'The center of your image is used.', // invented

  // Text mode
  textLabel: 'Text (1 to 3 characters)', // invented
  textInvalid: 'Type 1 to 3 characters to see your icon.', // invented
  weight: 'Weight', // invented
  weightRegular: 'Regular',
  weightSemibold: 'Semibold',
  weightBold: 'Bold',
  textColor: 'Text color', // invented

  // Emoji mode
  emojiLabel: 'Emoji', // invented
  emojiHint: 'Use your emoji keyboard, or paste one.', // invented
  emojiInvalid: 'Add one emoji to see your icon.', // invented
  emojiQuick: 'Quick picks', // invented

  // Shared style controls
  shape: 'Shape', // invented
  shapeSquare: 'Square',
  shapeRounded: 'Rounded',
  shapeCircle: 'Circle',
  padding: 'Padding', // invented
  background: 'Background color', // invented
  transparent: 'Transparent background', // invented

  // Preview
  previewHeading: 'Preview', // invented
  previewEmpty: 'Choose an image to see your icon.', // invented
  previewEmptyText: 'Type 1 to 3 letters to see your icon.', // invented
  previewEmptyEmoji: 'Choose an emoji to see your icon.', // invented
  updating: 'Updating…', // invented
  previewUpdated: 'Preview updated', // invented
  siteTitle: 'Your site', // invented (fake tab title)
  tabLight: 'Light',
  tabDark: 'Dark',
  homeScreen: 'Home screen', // invented
  realSizes: 'Real sizes', // invented
  previewDescription:
    'Your icon in a browser tab, on a phone home screen, and at 16, 32, 48, 180 and 512 pixels.', // invented

  // Output
  downloadZip: 'Download ZIP', // invented
  preparingZip: 'Preparing ZIP…', // invented
  downloadIco: 'Download favicon.ico only', // invented
  saved: 'Saved',
  savedIos: 'Ready — check Downloads in the Files app', // invented
  zipFailed: "We couldn't make the ZIP. Please try again.", // invented
  snippetHeading: 'Add this to your site', // invented
  snippetHint: 'Put the files from the ZIP in your site root. Then paste this code in your <head>.', // invented
  snippetPlaceholder: 'Your code will show here.', // invented
  copyCode: 'Copy code',
  copied: 'Copied',
  copyFailed: 'Select the code and copy it.', // invented

  // Errors
  previewFailed: "We couldn't make the preview. Please try again.", // invented

  // PNG to ICO
  icoPick: 'Choose PNG files', // invented
  icoHint: (max: number) => `PNG only · up to ${max} at once`, // invented
  icoHintDesktop: 'or drop PNG files here, or paste with Ctrl+V', // invented
  icoNeedPng: 'This tool needs a PNG file. Convert your image to PNG first.', // invented
  icoSizes: (big: boolean) => `ICO · ${big ? '16, 32, 48 and 256' : '16, 32 and 48'} px`, // invented
  icoSummary: (size: string) => `${size} · works in every browser`, // invented
  icoDone: (n: number) =>
    n === 1 ? 'Done! Your ICO file is ready.' : `Done! ${n} ICO files are ready.`, // invented
  icoDoneAnnounce: (n: number) =>
    n === 1 ? 'Done. Your ICO file is ready.' : `Done. ${n} ICO files are ready.`, // invented
  icoAnother: 'Convert another',
  icoPlaceholder: 'Your ICO files will show here', // invented
} as const;
