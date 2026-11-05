'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { cx } from '@/components/ui/cx';
import { borderedIconClasses, iconButtonClasses } from '@/components/ui/icon-button';
import { SpeakerIcon, SpeakerOffIcon } from '@/components/ui/icons';
import { getSoundPref, setSoundPref, subscribeSoundPref, unlockAudio } from './sound';

/**
 * Toggle for the optional sword sounds (off by default). Turning it on creates
 * the AudioContext inside the click, as browsers require, and plays nothing.
 * `pill`: labeled button for the mobile menu.
 */
export function SoundToggle({ variant = 'icon' }: { variant?: 'icon' | 'pill' }) {
  const on = useSyncExternalStore(
    subscribeSoundPref,
    () => getSoundPref(),
    () => false,
  );

  // A returning visitor with sound on: unlock audio at their first tap or key press.
  useEffect(() => {
    if (!on) return;
    const unlock = () => unlockAudio();
    const opts = { once: true, capture: true } as const;
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    return () => {
      window.removeEventListener('pointerdown', unlock, opts);
      window.removeEventListener('keydown', unlock, opts);
    };
  }, [on]);

  const toggle = () => {
    const next = !on;
    if (next) unlockAudio();
    setSoundPref(next);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={toggle}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-control border border-line bg-card px-4 font-medium text-ink-2"
      >
        {on ? <SpeakerIcon size={20} /> : <SpeakerOffIcon size={20} />}
        Sound on
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label="Sound on"
      aria-pressed={on}
      data-testid="sound-toggle"
      onClick={toggle}
      className={cx(iconButtonClasses, borderedIconClasses)}
    >
      {on ? <SpeakerIcon size={20} /> : <SpeakerOffIcon size={20} />}
    </button>
  );
}
