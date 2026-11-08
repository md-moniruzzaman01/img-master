import { afterEach, describe, expect, it, vi } from 'vitest';
import { SOUND_KEY, getSoundPref, playSound, setSoundPref } from '../sound';

const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sound preference', () => {
  it('getSoundPref default is false', () => {
    expect(getSoundPref({ getItem: () => null })).toBe(false);
  });

  it("getSoundPref reads '1' and '0'", () => {
    expect(getSoundPref({ getItem: (k) => (k === SOUND_KEY ? '1' : null) })).toBe(true);
    expect(getSoundPref({ getItem: () => '0' })).toBe(false);
  });

  it('getSoundPref returns default when storage throws', () => {
    expect(getSoundPref(throwing)).toBe(false);
  });

  it('setSoundPref never throws when storage throws', () => {
    expect(() => setSoundPref(true, throwing)).not.toThrow();
  });

  it('setSoundPref writes 1 or 0', () => {
    const set = vi.fn();
    setSoundPref(true, { setItem: set });
    setSoundPref(false, { setItem: set });
    expect(set).toHaveBeenNthCalledWith(1, SOUND_KEY, '1');
    expect(set).toHaveBeenNthCalledWith(2, SOUND_KEY, '0');
  });
});

describe('playSound', () => {
  it('is a no-op when pref is off', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(() => playSound('start')).not.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not fetch when pref is on but no audio context exists yet', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('localStorage', { getItem: () => '1' });
    playSound('success');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
