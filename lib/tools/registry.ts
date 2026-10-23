// Every tool page on the site (PRODUCT.md §3). Owned by the lead.
// Order here is display order in menus and grids.
// A page is built and listed in the sitemap only when status is 'live'.
import type { ToolCategory, ToolDefinition } from '../types';

const size = (
  slug: string,
  targetKB: number,
  status: ToolDefinition['status'],
  phase: ToolDefinition['phase'],
): ToolDefinition => ({
  slug,
  kind: 'compress-to-size',
  category: 'compress',
  status,
  phase,
  preset: { targetKB, to: 'jpeg' },
});

export const tools: readonly ToolDefinition[] = [
  // ── Compress (PRODUCT.md §3.1, §3.3) ────────────────────────────
  {
    slug: 'compress-image',
    kind: 'compress',
    category: 'compress',
    status: 'live',
    phase: 1,
    hub: true,
    preset: { quality: 0.75 },
  },
  size('compress-image-to-20kb', 20, 'live', 1),
  size('compress-image-to-50kb', 50, 'live', 1),
  size('compress-image-to-100kb', 100, 'live', 1),
  size('compress-image-to-200kb', 200, 'live', 1),
  size('compress-image-to-500kb', 500, 'live', 1),
  size('compress-image-to-1mb', 1000, 'live', 1),
  // Phase 2: only if Search Console or keyword data shows demand.
  size('compress-image-to-10kb', 10, 'draft', 2),
  size('compress-image-to-30kb', 30, 'draft', 2),
  size('compress-image-to-150kb', 150, 'draft', 2),
  size('compress-image-to-300kb', 300, 'draft', 2),
  size('compress-image-to-2mb', 2000, 'draft', 2),

  // ── Convert (PRODUCT.md §3.2, §3.3) ─────────────────────────────
  {
    slug: 'image-converter',
    kind: 'convert',
    category: 'convert',
    status: 'live',
    phase: 1,
    hub: true,
    preset: { from: 'any', to: 'jpeg', quality: 0.9 },
  },
  conv('webp-to-jpg', 'webp', 'jpeg'),
  conv('webp-to-png', 'webp', 'png'),
  conv('png-to-webp', 'png', 'webp'),
  conv('jpg-to-webp', 'jpeg', 'webp'),
  conv('png-to-jpg', 'png', 'jpeg'),
  conv('jpg-to-png', 'jpeg', 'png'),
  // Phase 2: needs a HEIC decoder (owner must approve the dependency).
  // `from: 'any'` because HEIC isn't an ImageFormat we encode.
  {
    slug: 'heic-to-jpg',
    kind: 'convert',
    category: 'convert',
    status: 'draft',
    phase: 2,
    preset: { from: 'any', to: 'jpeg', quality: 0.9 },
  },

  // ── Favicon (PRODUCT.md §3.4; product phase 1, built in KICKOFF Phase 4) ──
  {
    slug: 'favicon-generator',
    kind: 'favicon-image',
    category: 'favicon',
    status: 'live',
    phase: 1,
    hub: true,
    preset: {},
  },
  {
    slug: 'favicon-from-text',
    kind: 'favicon-text',
    category: 'favicon',
    status: 'live',
    phase: 1,
    preset: {},
  },
  {
    slug: 'favicon-from-emoji',
    kind: 'favicon-emoji',
    category: 'favicon',
    status: 'live',
    phase: 1,
    preset: {},
  },
  {
    slug: 'png-to-ico',
    kind: 'png-to-ico',
    category: 'favicon',
    status: 'live',
    phase: 1,
    preset: { from: 'png' },
  },

  // ── Later (PRODUCT.md §3.6) ─────────────────────────────────────
  // Crop, signature tools, guides and use-case pages need specs first.
  {
    slug: 'resize-image',
    kind: 'resize',
    category: 'resize',
    status: 'draft',
    phase: 2,
    hub: true,
    preset: {},
  },
];

function conv(
  slug: string,
  from: NonNullable<ToolDefinition['preset']['from']>,
  to: NonNullable<ToolDefinition['preset']['to']>,
): ToolDefinition {
  return {
    slug,
    kind: 'convert',
    category: 'convert',
    status: 'live',
    phase: 1,
    preset: { from, to, quality: 0.9 },
  };
}

/** Display names for categories (breadcrumbs, menus, footer). */
export const categoryLabels: Record<ToolCategory, string> = {
  compress: 'Compress',
  convert: 'Convert',
  favicon: 'Favicon',
  resize: 'Resize',
};

/** Category display order. */
export const categoryOrder: readonly ToolCategory[] = ['compress', 'convert', 'favicon', 'resize'];
