import { describe, expect, it } from 'vitest';
import {
  compressName,
  compressToSizeName,
  convertName,
  dedupeNames,
  sanitizeBase,
  sizeLabel,
} from '../names';

describe('sanitizeBase', () => {
  it('drops the extension and unsafe characters', () => {
    expect(sanitizeBase('My Photo (1).JPG')).toBe('My-Photo-1');
    expect(sanitizeBase('a/b\\c:d*e?.png')).toBe('a-b-c-d-e');
    expect(sanitizeBase('IMG_2024-01-01.jpeg')).toBe('IMG_2024-01-01');
  });
  it('keeps non-English letters', () => {
    expect(sanitizeBase('ছবি ১.jpg')).toBe('ছবি-১');
    expect(sanitizeBase('café.png')).toBe('café');
  });
  it('limits to 60 characters', () => {
    const r = sanitizeBase(`${'a'.repeat(100)}.jpg`);
    expect(r).toHaveLength(60);
  });
  it('falls back to "image"', () => {
    expect(sanitizeBase('.jpg')).toBe('image');
    expect(sanitizeBase('***.png')).toBe('image');
    expect(sanitizeBase('')).toBe('image');
  });
  it('keeps a name with dots but no real extension sensible', () => {
    expect(sanitizeBase('v1.2.final.webp')).toBe('v1-2-final');
  });
});

describe('output names', () => {
  it('compress to size', () => {
    expect(compressToSizeName('photo.png', 50, 'jpeg')).toBe('photo-50kb.jpg');
    expect(compressToSizeName('photo.jpg', 1000, 'jpeg')).toBe('photo-1mb.jpg');
    expect(compressToSizeName('photo.jpg', 2000, 'webp')).toBe('photo-2mb.webp');
    expect(compressToSizeName('photo.jpg', 1500, 'jpeg')).toBe('photo-1500kb.jpg');
  });
  it('convert', () => {
    expect(convertName('photo.webp', 'jpeg')).toBe('photo.jpg');
    expect(convertName('photo.jpg', 'png')).toBe('photo.png');
    expect(convertName('logo.png', 'ico')).toBe('logo.ico');
  });
  it('compress', () => {
    expect(compressName('photo.jpg', 'jpeg')).toBe('photo-compressed.jpg');
    expect(compressName('photo.png', 'webp')).toBe('photo-compressed.webp');
  });
  it('size labels', () => {
    expect(sizeLabel(20)).toBe('20kb');
    expect(sizeLabel(1000)).toBe('1mb');
  });
});

describe('dedupeNames', () => {
  it('adds -2, -3 to duplicates', () => {
    expect(dedupeNames(['a.jpg', 'a.jpg', 'b.jpg', 'a.jpg'])).toEqual([
      'a.jpg',
      'a-2.jpg',
      'b.jpg',
      'a-3.jpg',
    ]);
  });
  it('is case-insensitive and avoids clashes with existing -2 names', () => {
    expect(dedupeNames(['a.jpg', 'a-2.jpg', 'A.JPG'])).toEqual(['a.jpg', 'a-2.jpg', 'A-3.JPG']);
  });
});
