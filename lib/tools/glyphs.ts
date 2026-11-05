// Decorative kanji for tools and categories (Figma "Ink Samurai v2"). Owned by the lead.
// Always rendered aria-hidden: they decorate, the English text carries the meaning.
import type { ToolCategory, ToolDefinition } from '../types';

/** Section-heading glyphs, e.g. "圧縮 Compress to an exact size". */
export const categoryGlyphs: Record<ToolCategory, string> = {
  compress: '圧縮',
  convert: '変換',
  favicon: '紋',
  resize: '寸',
};

/** Size targets in kanji numerals (decimal KB, as in the registry). */
const sizeGlyphs: Record<number, string> = {
  10: '十',
  20: '二十',
  30: '三十',
  50: '五十',
  100: '百',
  150: '百五十',
  200: '二百',
  300: '三百',
  500: '五百',
  1000: '千',
  2000: '二千',
};

const slugGlyphs: Record<string, string> = {
  'compress-image': '圧',
  'image-converter': '変',
  'favicon-generator': '紋',
  'favicon-from-text': '字',
  'favicon-from-emoji': '絵',
  'png-to-ico': '器',
  'resize-image': '寸',
};

/** The card glyph for one tool. */
export function getToolGlyph(tool: ToolDefinition): string {
  if (tool.kind === 'compress-to-size' && tool.preset.targetKB) {
    return sizeGlyphs[tool.preset.targetKB] ?? '圧';
  }
  return slugGlyphs[tool.slug] ?? (tool.category === 'convert' ? '変' : categoryGlyphs[tool.category]);
}

/** Page and site-wide glyphs used outside the tool cards. */
export const pageGlyphs = {
  compare: '見',
  faq: '問',
  howTo: '技',
  useCases: '用',
  about: '侍',
  /** Vertical motto beside the hero: "one sword, two halves" (a clean, decisive cut). */
  motto: '一刀両断',
} as const;
