// Tool search used by the Ctrl+K palette and the "Every tool" filter. Pure.
import type { SearchItem } from '@/lib/types';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/→/g, ' to ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Haystack for one item: title, description, keywords and slug words. */
function haystack(item: SearchItem): string {
  return norm([item.title, item.description, item.slug.replace(/-/g, ' '), ...item.keywords].join(' '));
}

/**
 * Items matching every word of `query`, best first. Empty query: all items in order.
 * "50" finds the 50KB page ("50kb" → "50 kb" words), "webp" every WebP converter.
 */
export function searchTools(items: readonly SearchItem[], query: string): SearchItem[] {
  // Split digits from letters so "50kb" matches "50 kb" and "50KB".
  const q = norm(query).replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2');
  if (!q) return [...items];
  const words = q.split(' ');
  const scored: { item: SearchItem; score: number; i: number }[] = [];
  items.forEach((item, i) => {
    const hay = ` ${haystack(item).replace(/(\d)([a-z])/g, '$1 $2').replace(/([a-z])(\d)/g, '$1 $2')} `;
    if (!words.every((w) => hay.includes(` ${w}`))) return;
    const title = ` ${norm(item.title).replace(/(\d)([a-z])/g, '$1 $2')} `;
    let score = 0;
    for (const w of words) {
      if (title.includes(` ${w} `)) score += 4;
      else if (title.includes(` ${w}`)) score += 2;
      if (hay.includes(` ${w} `)) score += 1;
    }
    scored.push({ item, score, i });
  });
  return scored.sort((a, b) => b.score - a.score || a.i - b.i).map((s) => s.item);
}
