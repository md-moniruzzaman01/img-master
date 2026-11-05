import { describe, expect, it } from 'vitest';
import type { SearchItem } from '@/lib/types';
import { searchTools } from '../match';

const item = (slug: string, title: string, keywords: string[] = []): SearchItem => ({
  slug,
  href: `/${slug}`,
  title,
  description: '',
  glyph: '',
  category: 'compress',
  keywords,
});

const items = [
  item('compress-image', 'Image compressor', ['compress image']),
  item('compress-image-to-50kb', 'To 50KB', ['compress image to 50kb']),
  item('compress-image-to-500kb', 'To 500KB', ['compress image to 500kb']),
  item('webp-to-jpg', 'WebP to JPG', ['webp to jpg']),
];

describe('searchTools', () => {
  it('returns everything for an empty query', () => {
    expect(searchTools(items, '  ')).toHaveLength(4);
  });
  it('ranks the exact size first for "50"', () => {
    const r = searchTools(items, '50');
    expect(r[0].slug).toBe('compress-image-to-50kb');
    expect(r.map((x) => x.slug)).toContain('compress-image-to-500kb');
  });
  it('matches "50kb" and "50 KB" alike', () => {
    expect(searchTools(items, '50kb')[0].slug).toBe('compress-image-to-50kb');
    expect(searchTools(items, '50 KB')[0].slug).toBe('compress-image-to-50kb');
  });
  it('needs every word', () => {
    expect(searchTools(items, 'webp jpg').map((x) => x.slug)).toEqual(['webp-to-jpg']);
    expect(searchTools(items, 'webp png')).toEqual([]);
  });
});
