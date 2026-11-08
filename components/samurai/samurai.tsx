// The Figma vector samurai (docs/figma-export/svg/kamae.svg) over the red sun, with
// state overlays drawn in SVG and animated in CSS (app/globals.css, .sam-*).
// No JavaScript: a server component, also rendered inside the tool island.
// Under prefers-reduced-motion every state is a still pose.
import { cx } from '@/components/ui/cx';

export type SamuraiState = 'idle' | 'ready' | 'cutting' | 'done' | 'error' | 'confused';

/** Samurai body, in kamae.svg coordinates (520 × 480). Class = token fill. */
const BODY: [string, string][] = [
  ['M308 94H412L434 142H286Z', 'fill-art-ink'],
  ['M303 108h114v2H303zM297 122h126v2H297z', 'fill-art-red'],
  ['M320 92C316 44 404 44 400 92Z', 'fill-art-ink-2'],
  ['M318 88h84v3h-84z', 'fill-art-gold'],
  ['M332 52C342 6 378 6 388 52 378 28 342 28 332 52Z', 'fill-art-gold'],
  ['M360 46a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'fill-art-gold'],
  ['M360 144c16.6 0 30-11.6 30-26s-13.4-26-30-26-30 11.6-30 26 13.4 26 30 26Z', 'fill-art-ink'],
  ['M341 113l13 3v2l-13-2zM379 113l-13 3v2l13-2z', 'fill-art-eye'],
  ['M334 124h52l-8 26h-36z', 'fill-art-ink-2'],
  ['M318 146h84l18 46-6 112H306l-6-112z', 'fill-art-ink'],
  ['M308 196h104v2H308zM308 222h104v2H308zM308 248h104v2H308zM308 274h104v2H308z', 'fill-art-red'],
  ['M360 179a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'fill-art-gold'],
  ['M360 174.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z', 'fill-art-ink'],
  ['M272 150h46l2 68h-52zM402 150h46l4 68h-52z', 'fill-art-ink-3'],
  ['M271 172h48v2h-48zM270 196h50v2h-50zM401 172h50v2h-50zM400 196h52v2h-52z', 'fill-art-red'],
  ['M304 304h112l12 52H292z', 'fill-art-ink-3'],
  ['M296 350h128v3H296z', 'fill-art-red'],
  ['M294 356h132l58 106h-92l-32-58-32 58h-92z', 'fill-art-ink'],
  ['M230 462h100l10 12H224zM390 462h100l8 12H386z', 'fill-art-shadow'],
];

const ARMS: [string, string][] = [
  ['M251.6 257.8l51.5 19.3-3.2 8.4-51.5-19.3z', 'fill-art-ink-2'],
  ['M276 190l26 14-32 68-24-14zM408 208l24 18-154 58-16-20z', 'fill-art-ink-3'],
  ['M254 272c5.5 0 10-4 10-9s-4.5-9-10-9-10 4-10 9 4.5 9 10 9Z', 'fill-art-ink'],
];

/** The samurai alone, in kamae.svg coordinates (also drawn by the hero scene). */
export function SamuraiBody() {
  return (
    <>
      {BODY.map(([d, c], i) => (
        <path key={i} d={d} className={c} />
      ))}
      {/* Blade, then the arms and hands over its hilt. */}
      <path
        d="M243.2 255.7 18 175l222.8 87.3z"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="fill-art-blade stroke-art-ink"
      />
      {ARMS.map(([d, c], i) => (
        <path key={i} d={d} className={c} />
      ))}
      <circle cx="240" cy="257" r="7" strokeWidth="1.2" className="fill-art-gold stroke-art-ink" />
    </>
  );
}

/** Art box: 340 × 320, sun centred at (170, 136), radius 110. */
export const SAMURAI_VIEWBOX = '0 0 340 320';

/**
 * The samurai on the sun with the overlay for `state`:
 * idle (breathing), ready (dotted ring), cutting (two slash lines sweep),
 * done (済 seal stamps on), error (grey sun, red X),
 * confused (grey sun, red ?, used on the 404 page).
 */
export function SamuraiArt({
  state,
  className,
}: {
  state: SamuraiState;
  className?: string;
}) {
  return (
    <svg
      viewBox={SAMURAI_VIEWBOX}
      width="340"
      height="320"
      aria-hidden="true"
      focusable="false"
      data-state={state}
      className={className}
    >
      <circle
        cx="170"
        cy="136"
        r="110"
        className={cx(
          'transition-[fill] duration-300',
          state === 'error' || state === 'confused' ? 'fill-art-grey-sun' : 'fill-art-sun',
        )}
      />
      {state === 'ready' && (
        <circle
          cx="170"
          cy="136"
          r="124"
          fill="none"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          className="sam-ring stroke-shu"
        />
      )}
      <g transform="translate(24 46) scale(.56)">
        <g className="sam-body">
          <SamuraiBody />
        </g>
      </g>
      {state === 'cutting' && (
        <g fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-shu">
          <path pathLength={1} d="M20 268 318 42" className="sam-sweep" />
          <path pathLength={1} d="M40 300 330 88" className="sam-sweep sam-sweep-2" />
        </g>
      )}
      {state === 'done' && (
        <g className="sam-seal">
          <g transform="rotate(10 262 208)">
            <rect
              x="232"
              y="178"
              width="60"
              height="60"
              rx="4"
              strokeWidth="3.5"
              className="fill-card stroke-shu"
            />
            <text
              x="262"
              y="221"
              textAnchor="middle"
              fontSize="38"
              className="kanji fill-shu"
            >
              済
            </text>
          </g>
        </g>
      )}
      {state === 'error' && (
        <path
          d="M232 194l40 40M272 194l-40 40"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-shu"
        />
      )}
      {state === 'confused' && (
        <text
          x="262"
          y="232"
          textAnchor="middle"
          fontSize="64"
          fontWeight="800"
          className="font-display fill-shu"
        >
          ?
        </text>
      )}
    </svg>
  );
}

const DOT: Record<SamuraiState, string> = {
  idle: 'bg-ink-2',
  ready: 'bg-shu',
  cutting: 'bg-shu',
  done: 'bg-matcha',
  error: 'bg-shu',
  confused: 'bg-shu',
};

export interface StageText {
  /** "IDLE", "READY", "CUTTING", "DONE", "ERROR". */
  label: string;
  title: string;
  line?: string;
  /** Shorter label and title for the compact row below lg (the design words them differently). */
  compact?: { label: string; title: string };
}

function Responsive({ full, compact }: { full: string; compact?: string }) {
  if (!compact) return <>{full}</>;
  return (
    <>
      <span className="lg:hidden">{compact}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}

/**
 * The samurai status ("Sensei") card. `responsive`: a compact row (round crop
 * of the samurai on the sun + label + title) below lg, the full card from lg.
 * Test hooks: data-testid="samurai-stage", data-state.
 */
export function SamuraiStage({
  state,
  text,
  layout = 'responsive',
  className,
}: {
  state: SamuraiState;
  text: StageText;
  layout?: 'responsive' | 'panel';
  className?: string;
}) {
  const panel = layout === 'panel';
  return (
    <div
      data-testid="samurai-stage"
      data-state={state}
      className={cx(
        'rounded-card border border-line bg-card',
        panel
          ? 'flex flex-col p-6'
          : 'flex items-center gap-4 p-2 lg:flex-col lg:items-stretch lg:gap-0 lg:p-6',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cx(
          panel
            ? 'w-full'
            : 'relative size-14 shrink-0 overflow-hidden rounded-full lg:static lg:size-auto lg:w-full lg:overflow-visible lg:rounded-none',
        )}
      >
        <SamuraiArt
          state={state}
          className={cx(
            'h-auto max-w-none',
            panel
              ? 'w-full'
              : 'absolute top-[-6.6px] left-[-15.3px] w-[86.5px] lg:static lg:w-full',
          )}
        />
      </div>
      <div className={cx('min-w-0', panel ? 'mt-4' : 'lg:mt-4')}>
        <p className="flex items-center gap-2 type-eyebrow text-ink-2">
          <span aria-hidden="true" className={cx('size-2 shrink-0 rounded-full', DOT[state])} />
          <Responsive full={text.label} compact={text.compact?.label} />
        </p>
        <p
          className={cx(
            'mt-1 font-display font-extrabold text-ink',
            panel ? 'text-[1.625rem] leading-8' : 'text-lg leading-6 lg:text-[1.625rem] lg:leading-8',
          )}
        >
          <Responsive full={text.title} compact={text.compact?.title} />
        </p>
        {text.line && (
          <p
            className={cx(
              'mt-1 type-small text-muted tabular-nums',
              !panel && 'hidden lg:block',
            )}
          >
            {text.line}
          </p>
        )}
      </div>
    </div>
  );
}
