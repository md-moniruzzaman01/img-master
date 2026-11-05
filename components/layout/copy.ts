// Header, menu and footer microcopy. Strings not in the Figma file are marked "invented".
import { siteConfig } from '@/lib/site-config';

export const navCopy = {
  skip: 'Skip to content',
  cta: 'Compress an image',
  menu: 'Menu',
  closeMenu: 'Close menu',
  compress: 'Compress',
  convert: 'Convert',
  resize: 'Resize',
  favicon: 'Favicon',
  howItWorks: 'How it works',
  compressToSize: 'Compress to a size',
  convertFormat: 'Convert a format', // invented (Figma has only the Compress menu)
  faviconTools: 'Icons for your site', // invented
  otherWays: 'Other ways',
  /** Honest label for the 50 KB row (Figma "MOST USED" implies usage numbers we don't have). */
  startHere: 'Start here', // invented, see report
  batchTips: 'Batch tips',
  batchTipsLine: `Up to ${siteConfig.maxFiles} files, one ZIP`,
  promo50Title: 'Need 50 KB for a form?',
  promo50Text: 'Drop a photo and get a clear JPG under 50 KB, made on your device.', // invented (Figma line claimed usage)
  promo50Link: 'Open 50 KB tool',
  promoConvertTitle: "Form won't take WebP?", // invented
  promoConvertText: 'Turn it into a JPG that every upload form opens.', // invented
  promoConvertLink: 'Open WebP to JPG', // invented
  promoFaviconTitle: "Your site's family crest", // from the home section
  promoFaviconText: 'Make every icon size and the HTML from an image, letters or an emoji.', // invented
  promoFaviconLink: 'Open favicon generator', // invented
  searchTools: (n: number) => `Search ${n} tools`,
  more: 'More…',
  iconsAndSize: 'Icons & size',
  allTools: 'All tools',
  allToolsLine: 'Every tool on one page', // invented
  anyFormat: 'Any format',
  anySize: 'Any size',
  footerBlurb: 'Image tools that cut clean. Everything runs on your device — nothing is uploaded.',
  footerMoreTools: 'More tools',
  builtIn: 'Built by Softwara in Dhaka',
  motto: '一 刀 両 断',
} as const;
