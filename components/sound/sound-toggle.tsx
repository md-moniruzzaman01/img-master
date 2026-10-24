'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { SpeakerIcon, SpeakerOffIcon } from '@/components/ui/icons';
import { getSoundPref, setSoundPref, subscribeSoundPref, unlockAudio } from './sound';

/**
 * Header toggle for the optional sword sounds (off by default). Turning it on
 * creates the AudioContext inside the click, as browsers require, and plays nothing.
 */
export function SoundToggle() {
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

  return (
    <IconButton
      aria-label={on ? 'Sound on' : 'Sound off'}
      aria-pressed={on}
      data-testid="sound-toggle"
      onClick={() => {
        const next = !on;
        if (next) unlockAudio();
        setSoundPref(next);
      }}
    >
      {on ? <SpeakerIcon /> : <SpeakerOffIcon />}
    </IconButton>
  );
}
