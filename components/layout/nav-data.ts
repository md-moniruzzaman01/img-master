// Menu, footer and page data derived from the nav groups (pure, server side).
import type { ToolCardData, ToolNavGroup } from '@/lib/types';

/** Tabs of the favicon generator: listed in menus and search, not as their own tile. */
export const isTabTool = (t: ToolCardData) => t.kind === 'favicon-text' || t.kind === 'favicon-emoji';

export function groupOf(groups: ToolNavGroup[], category: ToolNavGroup['category']) {
  return groups.find((g) => g.category === category);
}

/** "compress-image-to-50kb" → 50, "…-to-1mb" → 1000. */
export function targetKBOf(slug: string): number | undefined {
  const m = /-to-(\d+)(kb|mb)$/.exec(slug);
  if (!m) return undefined;
  return Number(m[1]) * (m[2] === 'mb' ? 1000 : 1);
}

/** 50 → "50 KB", 1000 → "1 MB". */
export function sizeLabel(kb: number): string {
  return kb >= 1000 && kb % 100 === 0 ? `${kb / 1000} MB` : `${kb} KB`;
}

const FORMAT: Record<string, string> = { jpg: 'JPG', jpeg: 'JPG', png: 'PNG', webp: 'WebP' };

/** "webp-to-jpg" → ["WebP", "JPG"]; undefined for the hub. */
export function formatPair(slug: string): [string, string] | undefined {
  const m = /^([a-z]+)-to-([a-z]+)$/.exec(slug);
  if (!m || !FORMAT[m[1]] || !FORMAT[m[2]]) return undefined;
  return [FORMAT[m[1]], FORMAT[m[2]]];
}

/** Live compress-to-size pages, smallest first. */
export function sizeTools(groups: ToolNavGroup[]): (ToolCardData & { kb: number })[] {
  return (groupOf(groups, 'compress')?.tools ?? [])
    .flatMap((t) => {
      const kb = t.kind === 'compress-to-size' ? targetKBOf(t.slug) : undefined;
      return kb ? [{ ...t, kb }] : [];
    })
    .sort((a, b) => a.kb - b.kb);
}

/** Live convert pages that are a format pair (hub excluded). */
export function pairTools(groups: ToolNavGroup[]) {
  return (groupOf(groups, 'convert')?.tools ?? []).flatMap((t) => {
    const pair = formatPair(t.slug);
    return pair ? [{ ...t, pair }] : [];
  });
}

/** Live tools that are not a tab of another tool (for counts and grids). */
export function standaloneTools(groups: ToolNavGroup[]): ToolCardData[] {
  return groups.flatMap((g) => g.tools).filter((t) => !isTabTool(t));
}

/** Pages every site menu links to (static HTML). */
export const INFO_LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
] as const;
