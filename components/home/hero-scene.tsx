'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RONIN, RONIN_REST_MS } from '@/components/samurai/frames';
import { Samurai } from '@/components/samurai/samurai';
import { cx } from '@/components/ui/cx';

const REPLAY_MS = RONIN.seq.idle.length * RONIN.ms.idle + RONIN_REST_MS;

/**
 * Brand scene: back-view ronin in front of a red sun, ink-wash hills and a dark rock.
 * Decorative only. The box height is fixed in CSS, so nothing shifts when the sprite loads.
 */
export function HeroScene({
  animate = true,
  compact = false,
  className,
}: {
  animate?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const blurId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tabShown, setTabShown] = useState(true);

  useEffect(() => {
    if (!animate) return;
    const box = boxRef.current;
    let io: IntersectionObserver | undefined;
    if (box && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1];
        if (last) setVisible(last.isIntersecting);
      });
      io.observe(box);
    } else {
      setVisible(true);
    }
    const onVis = () => setTabShown(document.visibilityState !== 'hidden');
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [animate]);

  // Remount the ronin after each play and rest, so the timeline stays pure.
  useEffect(() => {
    if (!animate || !visible || !tabShown) return;
    const id = setInterval(() => setRun((n) => n + 1), REPLAY_MS);
    return () => clearInterval(id);
  }, [animate, visible, tabShown]);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      data-testid="hero-scene"
      className={cx(
        'relative mx-auto w-full max-w-[360px] overflow-hidden',
        compact ? 'h-[250px]' : 'h-[330px]',
        className,
      )}
    >
      <svg
        viewBox="0 0 360 588"
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g transform={compact ? 'translate(0 70)' : undefined}>
          <circle cx="262" cy="330" r="62" className="fill-primary" />
          <path
            d="M-20 470 C40 400 90 380 150 420 C200 450 250 410 300 380 C330 362 360 370 400 400 L400 600 L-20 600 Z"
            className="fill-ink"
            opacity=".1"
            filter={`url(#${blurId})`}
          />
          <path
            d="M-20 510 C30 470 80 455 130 480 C190 510 240 470 290 450 C330 436 365 450 400 470 L400 600 L-20 600 Z"
            className="fill-ink"
            opacity=".18"
            filter={`url(#${blurId})`}
          />
        </g>
        <path
          d="M90 600 L100 566 C112 552 140 548 176 548 L292 546 C322 546 346 552 360 562 L360 600 Z"
          className="fill-ink"
          opacity=".85"
        />
      </svg>
      <div
        className="absolute bottom-[22px] left-1/2"
        style={{ transform: 'translateX(calc(-50% + 56px))' }}
      >
        <Samurai
          key={run}
          set={RONIN}
          state="idle"
          height={compact ? 220 : 300}
          sun={false}
          animate={animate}
          className="block"
        />
      </div>
    </div>
  );
}
