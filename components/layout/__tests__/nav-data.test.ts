import { describe, expect, it } from 'vitest';
import { formatPair } from '../nav-data';

describe('formatPair', () => {
  it('knows the HEIC pairs', () => {
    expect(formatPair('heic-to-jpg')).toEqual(['HEIC', 'JPG']);
    expect(formatPair('heic-to-png')).toEqual(['HEIC', 'PNG']);
    expect(formatPair('webp-to-jpg')).toEqual(['WebP', 'JPG']);
  });
});
