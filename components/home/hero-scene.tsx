// Hero scene from the Figma file (docs/figma-export/svg/hero-scene.svg), optimised:
// coordinates rounded, circle paths turned into <circle>, colours mapped to tokens,
// the motto and seal drawn as text instead of outlined glyphs (generated once by
// a ui-builder script; edit by hand from here). Server component, no JavaScript.
// Fixed aspect ratio, so it never shifts the layout.
import { cx } from '@/components/ui/cx';
import { pageGlyphs } from '@/lib/tools/glyphs';
import { SamuraiBody } from '@/components/samurai/samurai';

type Dot = [cx: number, cy: number, r: number, fill: string];

const FILL: Record<string, string> = {
  'art-sun': 'fill-art-sun',
  'art-red-deep': 'fill-art-red-deep',
  sakura: 'fill-sakura',
};

function dots(list: Dot[]) {
  return list.map(([x, y, r, f], i) => (
    <circle key={i} cx={x} cy={y} r={r} className={FILL[f] ?? 'fill-sakura'} />
  ));
}

/**
 * Sun, ring, cherry branch, pagoda, hills and the samurai, with the vertical
 * motto 一刀両断 and a 侍 seal on the left. `crop`: a shorter frame for phones
 * (the top of the scene is cut, the samurai stays whole).
 */
export function HeroScene({
  className,
  crop = false,
  showMotto = true,
}: {
  className?: string;
  /** Shorter scene below lg (home on phones). */
  crop?: boolean;
  showMotto?: boolean;
  /** Kept for the old call signature (app/not-found.tsx). */
  animate?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'relative w-full',
        crop ? 'aspect-[690/520] lg:aspect-[690/650]' : 'aspect-[690/650]',
        className,
      )}
    >
      <svg
        viewBox="0 0 690 650"
        preserveAspectRatio="xMidYMax slice"
        width="690"
        height="650"
        focusable="false"
        className="absolute inset-0 size-full"
      >
        <defs>
          <clipPath id="hs-c0">
            <rect x="530" y="180" width="110" height="250" />
          </clipPath>
          <clipPath id="hs-c1">
            <rect x="310" width="380" height="230" />
          </clipPath>
        </defs>
      <path d="M10 580V430L80 380L140 414L230 324L310 394L370 358L460 424L530 384L650 458V580H10Z" className="fill-art-wash" fillOpacity="0.08" />
      <path d="M10 580V490L120 446L210 486L330 416L430 476L510 452L650 504V580H10Z" className="fill-art-wash" fillOpacity="0.13" />
      <g opacity=".22" clipPath="url(#hs-c0)">
      <path d="M586 180H584V220H586V180Z" className="fill-art-wash" />
      <path d="M549 234C573 220.7 597 220.7 621 234C597 230 573 230 549 234Z" className="fill-art-wash" />
      <path d="M604.8 232H565.2V258H604.8V232Z" className="fill-art-wash" fillOpacity="0.8" />
      <path d="M537 274C569 260.7 601 260.7 633 274C601 270 569 270 537 274Z" className="fill-art-wash" />
      <path d="M611.4 272H558.6V298H611.4V272Z" className="fill-art-wash" fillOpacity="0.8" />
      <path d="M525 314C565 300.7 605 300.7 645 314C605 310 565 310 525 314Z" className="fill-art-wash" />
      <path d="M618 312H552V338H618V312Z" className="fill-art-wash" fillOpacity="0.8" />
      <path d="M513 354C561 340.7 609 340.7 657 354C609 350 561 350 513 354Z" className="fill-art-wash" />
      <path d="M624.6 352H545.4V378H624.6V352Z" className="fill-art-wash" fillOpacity="0.8" />
      <path d="M501 394C557 380.7 613 380.7 669 394C613 390 557 390 501 394Z" className="fill-art-wash" />
      <path d="M631.2 392H538.8V418H631.2V392Z" className="fill-art-wash" fillOpacity="0.8" />
      </g>
      <circle cx="330" cy="280" r="259.3" fill="none" strokeWidth="1.5" className="stroke-shu" />
      <circle cx="330" cy="280" r="220" className="fill-art-sun" />
      {dots([[555,175,5,"art-sun"],[573,203,3,"art-sun"],[106,364,4,"art-sun"],[122.5,382.5,2.5,"art-sun"],[543.5,293.5,3.5,"art-sun"],[90,312,2,"art-sun"],[567.5,128.5,2.5,"art-sun"]])}
      <ellipse cx="310" cy="510" rx="310" ry="60" className="fill-paper" />
      <g clipPath="url(#hs-c1)">
      <path d="M690 14C630 28 594 18 550 44C520 62 492 58 460 78C436 92 410 94 380 112C360 124 344 140 330 160" className="stroke-art-branch" fill="none" strokeWidth="9" strokeLinecap="round" />
      <path d="M550 44C544 74 554 100 570 122M460 78C470 100 466 124 454 142M610 26C624 12 640 8 660 10M400 104C380 100 360 106 344 118" className="stroke-art-branch" fill="none" strokeWidth="4" strokeLinecap="round" />
      {dots([[579,124,5.3,"art-sun"],[574.2,130.7,5.3,"art-sun"],[566.3,128.1,5.3,"art-sun"],[566.3,119.9,5.3,"art-sun"],[574.2,117.3,5.3,"art-sun"],[572,124,3.1,"art-red-deep"],[562.7,100.2,3.8,"sakura"],[556.8,99.9,3.8,"sakura"],[555.3,94.2,3.8,"sakura"],[560.3,91,3.8,"sakura"],[564.8,94.7,3.8,"sakura"],[560,96,2.3,"art-red-deep"],[607.9,28.5,3.8,"sakura"],[605,23.4,3.8,"sakura"],[609,19.1,3.8,"sakura"],[614.4,21.5,3.8,"sakura"],[613.7,27.4,3.8,"sakura"],[610,24,2.3,"art-red-deep"],[651.1,12.7,3.8,"art-sun"],[653.8,7.5,3.8,"art-sun"],[659.6,8.5,3.8,"art-sun"],[660.4,14.3,3.8,"art-sun"],[655.1,16.9,3.8,"art-sun"],[656,12,2.3,"art-red-deep"],[503.4,58.7,5.3,"sakura"],[511.6,58,5.3,"sakura"],[514.8,65.6,5.3,"sakura"],[508.6,71,5.3,"sakura"],[501.5,66.7,5.3,"sakura"],[508,64,3.1,"art-red-deep"],[457.4,137.2,3.8,"sakura"],[461,141.9,3.8,"sakura"],[457.7,146.7,3.8,"sakura"],[452,145,3.8,"sakura"],[451.9,139.2,3.8,"sakura"],[456,142,2.3,"art-red-deep"],[468.8,102.6,3.8,"art-sun"],[466.8,108.1,3.8,"art-sun"],[460.9,108,3.8,"art-sun"],[459.3,102.3,3.8,"art-sun"],[464.2,99,3.8,"art-sun"],[464,104,2.3,"art-red-deep"],[431.8,93.3,3.8,"sakura"],[426,94.6,3.8,"sakura"],[423,89.6,3.8,"sakura"],[426.9,85.1,3.8,"sakura"],[432.3,87.4,3.8,"sakura"],[428,90,2.3,"art-red-deep"],[369,122.9,5.3,"sakura"],[363.1,117.2,5.3,"sakura"],[366.8,109.8,5.3,"sakura"],[374.9,111,5.3,"sakura"],[376.3,119.1,5.3,"sakura"],[370,116,3.1,"art-red-deep"],[341.4,120.1,3.8,"art-sun"],[342.6,114.3,3.8,"art-sun"],[348.5,113.7,3.8,"art-sun"],[350.9,119,3.8,"art-sun"],[346.6,123,3.8,"art-sun"],[346,118,2.3,"art-red-deep"],[329.8,155.3,3.8,"sakura"],[335.3,153.2,3.8,"sakura"],[339,157.7,3.8,"sakura"],[335.8,162.7,3.8,"sakura"],[330.1,161.2,3.8,"sakura"],[334,158,2.3,"art-red-deep"],[524,47,3.8,"sakura"],[528.8,50.5,3.8,"sakura"],[526.9,56.1,3.8,"sakura"],[521,56,3.8,"sakura"],[519.3,50.4,3.8,"sakura"],[524,52,2.3,"art-red-deep"],[643.9,18.2,5.3,"art-sun"],[643.4,26.5,5.3,"art-sun"],[635.4,28.5,5.3,"art-sun"],[631,21.6,5.3,"art-sun"],[636.3,15.2,5.3,"art-sun"],[638,22,3.1,"art-red-deep"],[492.5,74.1,3.8,"sakura"],[487.4,77,3.8,"sakura"],[483.1,73,3.8,"sakura"],[485.6,67.6,3.8,"sakura"],[491.4,68.3,3.8,"sakura"],[488,72,2.3,"art-red-deep"],[398.7,113,3.8,"sakura"],[393.5,110.2,3.8,"sakura"],[394.5,104.4,3.8,"sakura"],[400.4,103.6,3.8,"sakura"],[402.9,108.9,3.8,"sakura"],[398,108,2.3,"art-red-deep"]])}
      </g>
      <g transform="translate(70 140)">
        <SamuraiBody />
      </g>
      <path d="M20 624C130 608 250 616 340 612C440 608 550 618 640 626C530 636 410 642 310 640C190 638 90 636 20 624Z" className="fill-art-ink" fillOpacity="0.85" />
      <path d="M70 630L62 616M94 628L90 612M570 628L578 614M594 630L598 618M310 636L308 624" className="stroke-art-wash" fill="none" strokeWidth="2" />
      <ellipse cx="164.1" cy="157" rx="7" ry="4" transform="rotate(30 164.1 157)" className="fill-sakura" />
      <ellipse cx="112.8" cy="261.2" rx="6" ry="3.5" transform="rotate(-20 112.8 261.2)" className="fill-sakura" />
      <ellipse cx="597.9" cy="358.6" rx="7" ry="4" transform="rotate(-40 597.9 358.6)" className="fill-sakura" />
      <ellipse cx="623.7" cy="454.5" rx="5" ry="3" transform="rotate(20 623.7 454.5)" className="fill-sakura" />
      <ellipse cx="217.8" cy="552.1" rx="7" ry="4" transform="rotate(-15 217.8 552.1)" className="fill-sakura" />
      <ellipse cx="482.9" cy="596.3" rx="6" ry="3.5" transform="rotate(35 482.9 596.3)" className="fill-sakura" />
      <ellipse cx="55.8" cy="450.6" rx="5" ry="3" transform="rotate(-25 55.8 450.6)" className="fill-sakura" />
      <ellipse cx="396.5" cy="52.4" rx="6" ry="3.5" transform="rotate(-10 396.5 52.4)" className="fill-sakura" />
      </svg>
      {showMotto && (
        <div className="absolute top-[8%] left-0 flex flex-col items-center gap-3">
          <span className="kanji text-[clamp(1rem,2.6vw,1.375rem)] leading-[1.35] text-ink-2 [writing-mode:vertical-rl]">
            {pageGlyphs.motto}
          </span>
          <span className="kanji flex size-[clamp(1.5rem,3.4vw,1.875rem)] items-center justify-center rounded-[3px] bg-shu text-[clamp(0.9rem,2vw,1.125rem)] text-white">
            {pageGlyphs.about}
          </span>
        </div>
      )}
    </div>
  );
}
