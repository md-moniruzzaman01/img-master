// PLACEHOLDER content so the build passes in Phase 0.
// seo-content replaces every page file in Phase 1, then deletes this helper.
import type { ToolContent } from '@/lib/types';

export function placeholder(h1: string, shortName: string, related: string[]): ToolContent {
  return {
    primaryKeyword: h1.toLowerCase(),
    secondaryKeywords: [],
    shortName,
    cardDescription: `${h1} on your phone. Free, no upload.`,
    title: `${h1} | Img Master`,
    description: `PLACEHOLDER: ${h1}. Works in your browser, nothing is uploaded.`,
    h1,
    subtitle: 'PLACEHOLDER subtitle. Your images stay on your device.',
    howTo: ['Choose images.', 'Wait a moment.', 'Download the result.'],
    sections: [],
    faqs: [],
    related,
    updatedAt: '2026-10-23',
  };
}
