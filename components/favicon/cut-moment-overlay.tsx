'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const DURATION_MS = 800;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The cut moment: a crimson slash, the tile splits into two shards that drift apart and fade.
 * Pure CSS keyframes (globals.css `.cut-*`). Runs once per playKey; the shell owns playKey.
 */
export function CutMoment({
  playKey,
  tile,
  onDone,
}: {
  playKey: number;
  tile: ReactNode;
  onDone: () => void;
}) {
  const [finishedKey, setFinishedKey] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const skip = playKey > 0 && prefersReducedMotion();
  const active = playKey > 0 && finishedKey !== playKey && !skip;

  useEffect(() => {
    if (playKey <= 0) return;
    if (skip) {
      doneRef.current();
      return;
    }
    const id = window.setTimeout(() => {
      setFinishedKey(playKey);
      doneRef.current();
    }, DURATION_MS);
    return () => window.clearTimeout(id);
  }, [playKey, skip]);

  if (!active) return null;

  return (
    <div
      key={playKey}
      aria-hidden="true"
      data-testid="cut-moment"
      className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center lg:right-auto lg:left-[45.45%] lg:w-[54.55%]"
    >
      <div className="relative size-32 sm:size-40">
        <div data-testid="cut-shard" className="cut-shard cut-shard-a">
          <div className="size-full overflow-hidden rounded-card bg-paper-2">{tile}</div>
        </div>
        <div data-testid="cut-shard" className="cut-shard cut-shard-b">
          <div className="size-full overflow-hidden rounded-card bg-paper-2">{tile}</div>
        </div>
        <svg viewBox="0 0 100 100" className="cut-line absolute inset-0 size-full overflow-visible">
          <line
            x1="112"
            y1="-12"
            x2="-12"
            y2="112"
            pathLength={1}
            stroke="var(--shu)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
