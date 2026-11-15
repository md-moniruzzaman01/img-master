import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolDefinition } from '@/lib/types';
import { copy } from '../copy';
import {
  HEIC_ACCEPT,
  SLOW_DECODE_MS,
  createDecodeWatch,
  heicErrorText,
  isHeicFile,
  isHeicTool,
  isHubConverterTool,
} from '../heic';
import { defaultOptions, rememberedKeysFor } from '../tool-options';

const tool = (from: 'heic' | 'any' | 'webp'): ToolDefinition =>
  ({
    slug: from === 'any' ? 'image-converter' : `${from}-to-jpg`,
    kind: 'convert',
    category: 'convert',
    preset: { from, to: 'jpeg', quality: 0.9 },
  }) as unknown as ToolDefinition;

describe('HEIC picker', () => {
  it('accepts HEIC and HEIF only', () => {
    expect(HEIC_ACCEPT).toBe('.heic,.heif,image/heic,image/heif');
  });
  it('recognises HEIC by type or extension', () => {
    expect(isHeicFile({ name: 'a.HEIC', type: '' })).toBe(true);
    expect(isHeicFile({ name: 'a', type: 'image/heif' })).toBe(true);
    expect(isHeicFile({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });
});

describe('hub vs fixed converters', () => {
  it('heic is a fixed-format converter, not the hub', () => {
    expect(isHubConverterTool(tool('heic'))).toBe(false);
    expect(isHeicTool(tool('heic'))).toBe(true);
    expect(isHubConverterTool(tool('webp'))).toBe(false);
    expect(isHubConverterTool(tool('any'))).toBe(true);
    expect(isHeicTool(tool('any'))).toBe(false);
  });
  it('does not remember the target format on heic pages', () => {
    expect(rememberedKeysFor(tool('heic'))).not.toContain('convertTo');
    expect(rememberedKeysFor(tool('any'))).toContain('convertTo');
    expect(defaultOptions(tool('heic')).convertTo).toBe('jpeg');
  });
});

describe('HEIC error messages', () => {
  const heic = { name: 'IMG_1.heic', type: '' };
  it('maps engine errors', () => {
    expect(heicErrorText('UNSUPPORTED_FORMAT', heic)).toBe(copy.heic.unsupported);
    expect(heicErrorText('DECODE_FAILED', heic)).toBe(copy.heic.decodeFailed);
    expect(heicErrorText('UNSUPPORTED_FORMAT', { name: 'a.pdf', type: 'application/pdf' })).toBe(
      copy.heic.notHeic,
    );
  });
  it('leaves other errors to the shared messages', () => {
    expect(heicErrorText('OUT_OF_MEMORY', heic)).toBeNull();
    expect(heicErrorText('DECODE_FAILED', { name: 'a.jpg', type: 'image/jpeg' })).toBeNull();
  });
  it('uses the agreed wording', () => {
    expect(copy.heic.decodeFailed).toBe("We couldn't read this file. It may be damaged.");
    expect(copy.heic.unsupported).toContain("'Most Compatible' (JPG)");
  });
});

describe('decode wait status', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows "opening" at once and "slow" only after 1.5 s', () => {
    const seen: string[] = [];
    const w = createDecodeWatch((s) => seen.push(s));
    w.stage('decode');
    expect(seen).toEqual(['opening']);
    vi.advanceTimersByTime(SLOW_DECODE_MS - 1);
    expect(seen).toEqual(['opening']);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(['opening', 'slow']);
  });
  it('a fast decode never shows the slow message', () => {
    const seen: string[] = [];
    const w = createDecodeWatch((s) => seen.push(s));
    w.stage('decode');
    vi.advanceTimersByTime(400);
    w.stage('encode');
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['opening', 'none']);
  });
  it('repeated decode reports do not restart the timer', () => {
    const seen: string[] = [];
    const w = createDecodeWatch((s) => seen.push(s));
    w.stage('decode');
    vi.advanceTimersByTime(1000);
    w.stage('decode');
    vi.advanceTimersByTime(500);
    expect(seen).toEqual(['opening', 'slow']);
  });
  it('reset clears a pending timer', () => {
    const seen: string[] = [];
    const w = createDecodeWatch((s) => seen.push(s));
    w.stage('decode');
    w.reset();
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['opening', 'none']);
  });
});
