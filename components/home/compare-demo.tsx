// Home "See the cut before you trust it" compare demo (spec §5.1 item 4). The
// scenes below are an illustration, not a photo, and carry no benchmark
// numbers — the Figma's invented "2.4 MB / 48.6 KB / 98% lighter" chips are
// replaced by the `originalLabel`/`resultLabel` props from content/home.ts.
import { SectionHeading } from '@/components/layout/section-heading';
import { CompareSlider } from '@/components/ui/compare-slider';
import { pageGlyphs } from '@/lib/tools/glyphs';

export function CompareDemo({
  heading,
  intro,
  originalLabel,
  resultLabel,
}: {
  heading: string;
  intro?: string;
  originalLabel: string;
  resultLabel: string;
}) {
  return (
    <div className="grid gap-5">
      <SectionHeading glyph={pageGlyphs.compare} heading={heading} intro={intro} />
      <CompareSlider
        className="aspect-[16/10] w-full sm:aspect-[2/1]"
        defaultPercent={55}
        label={`${originalLabel} and ${resultLabel}`}
        beforeLabel={originalLabel}
        afterLabel={resultLabel}
        before={<DetailedScene />}
        after={<SimpleScene />}
      />
    </div>
  );
}

/** Illustrated scene, full detail: textured hills, a tiered pagoda, scattered petals. */
function DetailedScene() {
  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="250" className="fill-art-sky-1" />
      <rect width="400" height="250" className="fill-art-sky-2" opacity="0.3" />
      <circle cx="300" cy="86" r="42" className="fill-art-sun" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={300 + Math.cos(a) * 58}
            cy={86 + Math.sin(a) * 58}
            r="2.4"
            className="fill-art-sun"
            opacity="0.6"
          />
        );
      })}
      <path
        d="M0 176 40 148 80 168 130 128 180 162 230 138 280 170 330 148 400 172V250H0Z"
        className="fill-art-hill-1"
      />
      <path
        d="M0 206 60 188 120 202 190 180 260 204 330 186 400 202V250H0Z"
        className="fill-art-hill-2"
      />
      <g transform="translate(150 112)">
        <path d="M-5 68h10V26h-10Z" className="fill-art-ink" />
        <path d="M-24 26 0 2l24 24Z" className="fill-art-ink-2" />
        <path d="M-30 28h60v-4h-60Z" className="fill-art-ink" />
        <path d="M-17 48 0 30l17 18Z" className="fill-art-ink-2" />
        <path d="M-23 50h46v-4h-46Z" className="fill-art-ink" />
      </g>
      {Array.from({ length: 28 }).map((_, i) => (
        <circle
          key={i}
          cx={(i * 41 + 13) % 400}
          cy={36 + ((i * 59 + 7) % 150)}
          r="1.6"
          className="fill-sakura"
          opacity="0.75"
        />
      ))}
    </svg>
  );
}

/** Illustrated scene, reduced detail: flat hill, a plain pagoda, no petals. */
function SimpleScene() {
  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="250" className="fill-art-sky-1" />
      <circle cx="300" cy="86" r="42" className="fill-art-sun" />
      <path d="M0 196 120 176 260 194 400 180V250H0Z" className="fill-art-hill-2" />
      <g transform="translate(150 112)">
        <path d="M-4 68h8V34h-8Z" className="fill-art-ink" />
        <path d="M-22 34h44v-4h-44Z" className="fill-art-ink" />
      </g>
    </svg>
  );
}
