'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { FrameSet, SamuraiState } from './frames';
import { KENDO } from './frames';
import { Samurai } from './samurai';
import { Slash } from './slash';

export function SamuraiStage({
  state,
  set = KENDO,
  height = 150,
  heightSm,
  sun = true,
  className,
  children,
}: {
  state: SamuraiState;
  set?: FrameSet;
  height?: number;
  /** Height in px from the `sm` breakpoint (640px) up. Layout-true, no scaling. */
  heightSm?: number;
  sun?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [cuts, setCuts] = useState(0);
  const [shown, setShown] = useState<SamuraiState>(state);

  return (
    <div
      data-testid="samurai-stage"
      data-state={shown}
      style={
        heightSm
          ? ({ '--stage-h': `${height}px`, '--stage-h-sm': `${heightSm}px` } as CSSProperties)
          : { height }
      }
      className={`flex items-center justify-center${
        heightSm ? ' h-[var(--stage-h)] sm:h-[var(--stage-h-sm)]' : ''
      }${className ? ` ${className}` : ''}`}
    >
      <Samurai
        state={state}
        set={set}
        height={height}
        className={heightSm ? 'h-full w-auto' : undefined}
        sun={sun}
        onCut={() => setCuts((n) => n + 1)}
        onShownChange={setShown}
      />
      <Slash fireKey={cuts} />
      {children}
    </div>
  );
}
