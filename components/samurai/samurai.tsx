'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FrameSet, SamuraiState } from './frames';
import { KENDO } from './frames';
import { InkDefs } from './ink-defs';
import { currentFrame, request, startTimeline, tick, type Timeline } from './timeline';
import { useReducedMotion } from './use-reduced-motion';

type View = { shown: SamuraiState; frame: number };

export function Samurai({
  state,
  set = KENDO,
  height,
  onCut,
  onShownChange,
  sun = true,
  className,
}: {
  state: SamuraiState;
  set?: FrameSet;
  height: number;
  onCut?: () => void;
  onShownChange?: (s: SamuraiState) => void;
  sun?: boolean;
  className?: string;
}) {
  const filterId = useId();
  const reduced = useReducedMotion();
  const tlRef = useRef<Timeline | null>(null);
  const onCutRef = useRef(onCut);
  const onShownRef = useRef(onShownChange);
  const [view, setView] = useState<View>(() => ({ shown: state, frame: set.seq[state][0] }));

  useEffect(() => {
    onCutRef.current = onCut;
    onShownRef.current = onShownChange;
  });

  // Forward state changes to the timeline (only when the prop changes).
  useEffect(() => {
    const prev = tlRef.current;
    if (prev && prev.set === set) {
      const next = request(prev, state);
      if (next === prev) return;
      tlRef.current = next;
      setView({ shown: next.shown, frame: currentFrame(next) });
    } else {
      const next = startTimeline(set, state);
      tlRef.current = next;
      setView({ shown: next.shown, frame: currentFrame(next) });
    }
  }, [state, set]);

  // Frame clock: one timeout re-armed after every frame.
  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      stop();
      const tl = tlRef.current;
      if (!tl || document.visibilityState === 'hidden') return;
      if (tl.done && tl.shown === tl.requested) return;
      timer = setTimeout(() => {
        const cur = tlRef.current;
        if (!cur) return;
        const r = tick(cur);
        tlRef.current = r.t;
        if (r.cut) onCutRef.current?.();
        setView({ shown: r.t.shown, frame: r.frame });
      }, set.ms[tl.shown]);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
      else schedule();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [view, reduced, set]);

  const shown = reduced ? state : view.shown;
  const frame = reduced ? set.still[state] : view.frame;

  useEffect(() => {
    onShownRef.current?.(shown);
  }, [shown]);

  const { w, h } = set;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${w} ${h}`}
      width={Math.round((height * w) / h)}
      height={height}
      className={`text-ink${className ? ` ${className}` : ''}`}
    >
      <InkDefs id={filterId} />
      {sun && set === KENDO ? (
        <circle cx={w * 0.62} cy={h * 0.36} r={h * 0.27} className="fill-primary" opacity=".9" />
      ) : null}
      <path
        d={`M${w * 0.03} ${h * 0.97} Q${w * 0.5} ${h * 0.93} ${w * 0.97} ${h * 0.97}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".35"
      />
      <use href={`${set.sprite}#${set.prefix}${frame}`} filter={`url(#${filterId})`} />
    </svg>
  );
}
