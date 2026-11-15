import { siteConfig } from '@/lib/site-config';
import { cx } from '@/components/ui/cx';

/*
 * Img Samurai mark: a crimson hanko seal carrying 侍 ("samurai"), drawn as
 * paths so it looks the same on every device. The master geometry lives in
 * scripts/brand/mark.mjs, which also builds app/icon.svg, app/favicon.ico and
 * the PNG icons. Keep the two in sync.
 */

/** Seal body with the bottom-right corner sliced off by a blade (2-unit gap). */
const SEAL_CUT =
  'M5.2 3.4 L58.9 2.9 Q61.2 2.9 61.2 5.2 L61.35 47.15 L47.15 61.35 L5.4 61.5 Q2.8 61.5 2.8 58.9 L2.6 5.9 Q2.6 3.4 5.2 3.4 Z' +
  'M61.36 49.14 L61.5 58.6 Q61.5 61.2 58.9 61.2 L49.14 61.36 Z';

/** Thin inner border, broken where the blade cut the corner. */
const BORDER = 'M49.5 57 H9 Q7 57 7 55 V9 Q7 7 9 7 H55 Q57 7 57 9 V49.5';

/** 侍, one path per brush stroke. */
const GLYPH =
  'M24.5 11.5 Q21.5 20.5 13.5 28.5' + // 亻 falling stroke
  'M19.5 21.5 V52.5' + // 亻 upright
  'M39.5 10.5 V25.5' + // 土
  'M31 17.5 H48' +
  'M27.5 25.5 H51.5' +
  'M27 34 H52' + // 寸
  'M45.5 29 V49.5 Q45.5 53 42 52.5 L39 51' +
  'M32 39.5 L35.5 45';

/** Crimson hanko seal with 侍. Decorative: the logo text is the accessible name. */
export function BrandSeal({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      className={cx('size-8 shrink-0 text-white lg:size-[34px]', className)}
    >
      <path d={SEAL_CUT} className="fill-shu" />
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d={BORDER} strokeWidth={2} />
        <path d={GLYPH} strokeWidth={5} />
      </g>
    </svg>
  );
}

/**
 * Wordmark text: "Img" in the surrounding colour, "Samurai" in crimson.
 * The visible (and accessible) text is exactly siteConfig.name.
 * `accentClass` sets the crimson token for the surface: `text-accent` on paper
 * (AA in both themes), `text-shu` on the dark band (large text, 3:1).
 */
export function BrandName({ accentClass = 'text-accent' }: { accentClass?: string }) {
  const space = siteConfig.name.indexOf(' ');
  if (space < 0) return <>{siteConfig.name}</>;
  return (
    <span>
      {siteConfig.name.slice(0, space + 1)}
      <span className={accentClass}>{siteConfig.name.slice(space + 1)}</span>
    </span>
  );
}
