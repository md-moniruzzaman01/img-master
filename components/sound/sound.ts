import { siteConfig } from '@/lib/site-config';

export type SoundName = 'start' | 'success' | 'error';

export const SOUND_KEY = 'im-sound';
/** Bump when a file in public/sounds changes (the files are cached as immutable). */
export const SOUND_VERSION = 1;
const GAIN = 0.35;

type Reader = Pick<Storage, 'getItem'> | null | undefined;
type Writer = Pick<Storage, 'setItem'> | null | undefined;

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function getSoundPref(storage?: Reader): boolean {
  try {
    const s = storage === undefined ? defaultStorage() : storage;
    const v = s?.getItem(SOUND_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    // Storage blocked: use the default.
  }
  return siteConfig.soundEnabled;
}

const listeners = new Set<() => void>();

/** For useSyncExternalStore in the toggle. */
export function subscribeSoundPref(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setSoundPref(on: boolean, storage?: Writer): void {
  try {
    const s = storage === undefined ? defaultStorage() : storage;
    s?.setItem(SOUND_KEY, on ? '1' : '0');
  } catch {
    // Storage blocked: the choice lasts only for this page view.
  }
  for (const fn of listeners) fn();
}

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, Promise<AudioBuffer | null>>();

/**
 * Create or resume the AudioContext. Call only from a user gesture (a click or
 * key press); browsers keep the context suspended otherwise.
 */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor =
        globalThis.AudioContext ??
        (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  } catch {
    // No audio on this device.
  }
}

function load(name: SoundName, c: AudioContext): Promise<AudioBuffer | null> {
  let p = buffers.get(name);
  if (!p) {
    p = fetch(`/sounds/${name}.mp3?v=${SOUND_VERSION}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('sound missing'))))
      .then((data) => c.decodeAudioData(data))
      .catch(() => {
        buffers.delete(name); // allow a retry next time
        return null;
      });
    buffers.set(name, p);
  }
  return p;
}

/** Play one effect. Does nothing unless the visitor turned sound on and unlocked audio. */
export function playSound(name: SoundName): void {
  try {
    const c = ctx;
    if (!c || !getSoundPref()) return;
    if (c.state === 'suspended') void c.resume().catch(() => {});
    void load(name, c)
      .then((buf) => {
        if (!buf) return;
        const src = c.createBufferSource();
        const gain = c.createGain();
        gain.gain.value = GAIN;
        src.buffer = buf;
        src.connect(gain).connect(c.destination);
        src.start();
      })
      .catch(() => {});
  } catch {
    // Sound is a nicety; never break the tool.
  }
}
