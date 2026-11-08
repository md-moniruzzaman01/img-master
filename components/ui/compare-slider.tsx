'use client';

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cx } from './cx';

const STEP = 2;
const BIG_STEP = 10;

export interface CompareSliderProps {
  /** Fills an absolute, full-bleed layer; revealed on the left up to `percent`. Size it with `size-full object-cover` (or `object-contain`). */
  before: ReactNode;
  /** Fills an absolute, full-bleed layer underneath `before`; shown on the right. */
  after: ReactNode;
  beforeLabel: string;
  afterLabel: string;
  /** 0–100, default 50. */
  defaultPercent?: number;
  /** Accessible name for the slider handle (default: "{beforeLabel} and {afterLabel}"). */
  label?: string;
  className?: string;
}

/**
 * Before/after reveal slider (spec §6 "Compare"): drag the handle or use the
 * arrow keys to move the line. `role="slider"` with a value text so screen
 * readers announce the split as it changes. Shared by components/tool/compare.tsx
 * and components/home/compare-demo.tsx — neither photo content nor copy lives here.
 */
export function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  defaultPercent = 50,
  label,
  className,
}: CompareSliderProps) {
  const [percent, setPercent] = useState(defaultPercent);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPercent(Math.min(100, Math.max(0, Math.round(pct))));
  }, []);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  }
  function endDrag() {
    draggingRef.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next = percent;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, percent - STEP);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(100, percent + STEP);
        break;
      case 'PageDown':
        next = Math.max(0, percent - BIG_STEP);
        break;
      case 'PageUp':
        next = Math.min(100, percent + BIG_STEP);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
      default:
        return;
    }
    e.preventDefault();
    setPercent(next);
  }

  return (
    <div
      ref={trackRef}
      data-testid="compare-slider"
      className={cx(
        'relative touch-none select-none overflow-hidden rounded-card bg-paper-2',
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {after}
        <Tag text={afterLabel} side="right" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
      >
        {before}
        <Tag text={beforeLabel} side="left" />
      </div>
      <div
        role="slider"
        tabIndex={0}
        data-testid="compare-slider-handle"
        aria-label={label ?? `${beforeLabel} and ${afterLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% ${beforeLabel}, ${100 - percent}% ${afterLabel}`}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 flex w-11 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
        style={{ left: `${percent}%` }}
      >
        <span aria-hidden="true" className="h-full w-[2px] bg-white" />
        <span
          aria-hidden="true"
          className="absolute flex size-10 items-center justify-center rounded-full border-2 border-white bg-shu text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M5 3 1 8l4 5M11 3l4 5-4 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

function Tag({ text, side }: { text: string; side: 'left' | 'right' }) {
  return (
    <span
      className={cx(
        'absolute top-3 rounded-[4px] bg-band px-2 py-1 type-caption font-bold text-on-band',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      {text}
    </span>
  );
}
