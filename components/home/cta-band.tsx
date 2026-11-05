'use client';

import { openHeroPicker } from '@/components/tool/hero-bus';
import { Button } from '@/components/ui/button';

/**
 * Crimson full-bleed CTA band (spec §5.1 item 8), same full-bleed pattern as
 * ValuesBand. The button doesn't navigate: it opens the home hero tool's
 * picker and scrolls it into view (hero-bus.ts does the scrolling).
 */
export function CtaBand({
  heading,
  text,
  button,
}: {
  heading: string;
  text: string;
  button: string;
}) {
  return (
    <div className="relative overflow-hidden bg-shu text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 flex size-64 items-center justify-center rounded-full bg-shu-deep"
      >
        <span className="kanji text-[6rem] leading-none text-white/10 sm:text-[7.5rem]">一刀</span>
      </span>
      <div className="relative mx-auto max-w-[1280px] px-4 py-12 text-center sm:px-6 lg:px-12 lg:py-16">
        <h2 className="font-display type-h2 font-extrabold">{heading}</h2>
        <p className="mx-auto mt-2 max-w-[36rem] type-body text-white/85">{text}</p>
        <Button variant="white" size="md" onClick={() => openHeroPicker()} className="mt-6">
          {button}
        </Button>
      </div>
    </div>
  );
}
