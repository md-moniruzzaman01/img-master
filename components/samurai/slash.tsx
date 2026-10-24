'use client';

import { useState } from 'react';
import { useReducedMotion } from './use-reduced-motion';

export function Slash({ fireKey }: { fireKey: number }) {
  const reduced = useReducedMotion();
  const [doneKey, setDoneKey] = useState(0);
  const cutting = !reduced && fireKey > 0 && doneKey !== fireKey;

  // Keyed on fireKey so a new cut restarts the animation even mid-run.
  return (
    <div
      key={fireKey}
      data-testid="slash"
      aria-hidden="true"
      onAnimationEnd={() => setDoneKey(fireKey)}
      className={`im-anim pointer-events-none absolute -left-[10%] top-[44%] h-0.5 w-[120%] origin-left -rotate-[8deg] bg-primary opacity-0${
        cutting ? ' is-cutting im-slash' : ''
      }`}
    />
  );
}
