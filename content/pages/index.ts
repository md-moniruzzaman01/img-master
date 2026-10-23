// Content for every tool page, keyed by slug. Owned by seo-content.
// The build fails if a live tool in lib/tools/registry.ts has no entry here.
import type { ToolContent } from '@/lib/types';
import { content as compressImage } from './compress-image';
import { content as compressImageTo20kb } from './compress-image-to-20kb';
import { content as compressImageTo50kb } from './compress-image-to-50kb';
import { content as compressImageTo100kb } from './compress-image-to-100kb';
import { content as compressImageTo200kb } from './compress-image-to-200kb';
import { content as compressImageTo500kb } from './compress-image-to-500kb';
import { content as compressImageTo1mb } from './compress-image-to-1mb';
import { content as imageConverter } from './image-converter';
import { content as webpToJpg } from './webp-to-jpg';
import { content as webpToPng } from './webp-to-png';
import { content as pngToWebp } from './png-to-webp';
import { content as jpgToWebp } from './jpg-to-webp';
import { content as pngToJpg } from './png-to-jpg';
import { content as jpgToPng } from './jpg-to-png';
import { content as faviconGenerator } from './favicon-generator';
import { content as faviconFromText } from './favicon-from-text';
import { content as faviconFromEmoji } from './favicon-from-emoji';
import { content as pngToIco } from './png-to-ico';

export const toolContent: Readonly<Partial<Record<string, ToolContent>>> = {
  'compress-image': compressImage,
  'compress-image-to-20kb': compressImageTo20kb,
  'compress-image-to-50kb': compressImageTo50kb,
  'compress-image-to-100kb': compressImageTo100kb,
  'compress-image-to-200kb': compressImageTo200kb,
  'compress-image-to-500kb': compressImageTo500kb,
  'compress-image-to-1mb': compressImageTo1mb,
  'image-converter': imageConverter,
  'webp-to-jpg': webpToJpg,
  'webp-to-png': webpToPng,
  'png-to-webp': pngToWebp,
  'jpg-to-webp': jpgToWebp,
  'png-to-jpg': pngToJpg,
  'jpg-to-png': jpgToPng,
  'favicon-generator': faviconGenerator,
  'favicon-from-text': faviconFromText,
  'favicon-from-emoji': faviconFromEmoji,
  'png-to-ico': pngToIco,
};
