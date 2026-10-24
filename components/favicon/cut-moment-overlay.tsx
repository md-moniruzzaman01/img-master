'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Slash } from '@/components/samurai/slash';
import { useReducedMotion } from '@/components/samurai/use-reduced-motion';

const TILE = 96;
const ICON = 32;
const HOLD = 350;
const FLY = 300;
const CONVERGE = 600;
const TOTAL = HOLD + FLY + CONVERGE;

/** Eight shards: two rows of four, cut along shared slanted lines. */
const SHARDS = [
  { clip: 'polygon(0% 0%, 26% 0%, 20% 44%, 0% 44%)', out: [-12, -8, -6] },
  { clip: 'polygon(26% 0%, 52% 0%, 46% 48%, 20% 44%)', out: [-4, -12, 3] },
  { clip: 'polygon(52% 0%, 74% 0%, 80% 52%, 46% 48%)', out: [5, -12, -4] },
  { clip: 'polygon(74% 0%, 100% 0%, 100% 46%, 80% 52%)', out: [12, -8, 6] },
  { clip: 'polygon(0% 44%, 20% 44%, 30% 100%, 0% 100%)', out: [-12, 8, 5] },
  { clip: 'polygon(20% 44%, 46% 48%, 48% 100%, 30% 100%)', out: [-4, 12, -3] },
  { clip: 'polygon(46% 48%, 80% 52%, 70% 100%, 48% 100%)', out: [5, 12, 4] },
  { clip: 'polygon(80% 52%, 100% 46%, 100% 100%, 70% 100%)', out: [12, 8, -6] },
] as const;

/**
 * The cut-to-icon moment: the samurai's slashes split the tile into shards
 * that pull together into the tab icon. Transforms and opacity only, at most
 * 1.25 s. Never blocks anything: if the target can't be measured it just ends.
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
  const reduced = useReducedMotion();
  const [doneKey, setDoneKey] = useState(0);
  const [slashKey, setSlashKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onDoneRef = useRef(onDone);
  const hasTile = tile != null;

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const active = !reduced && hasTile && playKey > 0 && doneKey !== playKey;

  // Nothing to animate: report done right away so the page never waits.
  useEffect(() => {
    if (playKey > 0 && (reduced || !hasTile)) onDoneRef.current();
  }, [playKey, reduced, hasTile]);

  useLayoutEffect(() => {
    if (!active) return;
    const finish = () => {
      setDoneKey(playKey);
      onDoneRef.current();
    };
    const stage = rootRef.current?.parentElement;
    const target = document.querySelector('[data-cut-target]');
    const els = shardRefs.current.filter((el): el is HTMLDivElement => !!el);
    let to: { x: number; y: number } | null = null;
    try {
      const a = stage?.getBoundingClientRect();
      const b = target?.getBoundingClientRect();
      if (a && b && a.width > 0 && b.width > 0 && els.length === SHARDS.length) {
        to = {
          x: b.left + b.width / 2 - (a.left + a.width / 2),
          y: b.top + b.height / 2 - (a.top + a.height / 2),
        };
      }
    } catch {
      to = null;
    }
    if (!to || typeof els[0]?.animate !== 'function') {
      finish();
      return;
    }

    const sr = stage!.getBoundingClientRect();
    for (const el of els) {
      el.style.left = `${sr.left + sr.width / 2 - TILE / 2}px`;
      el.style.top = `${sr.top + sr.height / 2 - TILE / 2}px`;
    }
    const timers = [
      window.setTimeout(() => setSlashKey((n) => n + 1), 0),
      window.setTimeout(() => setSlashKey((n) => n + 1), 250),
    ];
    const scale = ICON / TILE;
    const animations = els.map((el, i) => {
      const [dx, dy, rot] = SHARDS[i].out;
      return el.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1, offset: 0 },
          {
            transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
            opacity: 1,
            offset: HOLD / TOTAL,
          },
          {
            transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(1)`,
            opacity: 1,
            offset: (HOLD + FLY) / TOTAL,
          },
          {
            transform: `translate(${to.x}px, ${to.y}px) rotate(0deg) scale(${scale})`,
            opacity: 1,
            offset: 0.97,
          },
          {
            transform: `translate(${to.x}px, ${to.y}px) rotate(0deg) scale(${scale})`,
            opacity: 0,
            offset: 1,
          },
        ],
        { duration: TOTAL, easing: 'ease-in-out', fill: 'both' },
      );
    });
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      finish();
    };
    animations[0].finished.then(end, () => {});
    // Safety net in case the animation is cancelled by the browser.
    timers.push(window.setTimeout(end, TOTAL + 100));

    return () => {
      ended = true;
      timers.forEach((t) => window.clearTimeout(t));
      animations.forEach((a) => a.cancel());
    };
  }, [active, playKey]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none">
      {active && (
        <>
          <Slash fireKey={slashKey} />
          <div className="im-anim pointer-events-none fixed inset-0 z-30 overflow-visible">
            {SHARDS.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  shardRefs.current[i] = el;
                }}
                data-testid="cut-shard"
                className="im-anim absolute"
                style={{
                  width: TILE,
                  height: TILE,
                  clipPath: s.clip,
                }}
              >
                {tile}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
