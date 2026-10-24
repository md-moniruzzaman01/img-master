'use client';

import { useState, type ReactNode } from 'react';
import type { FrameSet, SamuraiState } from './frames';
import { KENDO } from './frames';
import { Samurai } from './samurai';
import { Slash } from './slash';

export function SamuraiStage({
  state,
  set = KENDO,
  height = 150,
  sun = true,
  className,
  children,
}: {
  state: SamuraiState;
  set?: FrameSet;
  height?: number;
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
      style={{ height }}
      className={`flex items-center justify-center${className ? ` ${className}` : ''}`}
    >
      <Samurai
        state={state}
        set={set}
        height={height}
        sun={sun}
        onCut={() => setCuts((n) => n + 1)}
        onShownChange={setShown}
      />
      <Slash fireKey={cuts} />
      {children}
    </div>
  );
}
