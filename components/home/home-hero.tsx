// Home-page hero (Figma desktop-home-01.png).
// Desktop ≥ lg: two columns — left: eyebrow, H1, subtitle, children (hero tool card), trust row.
//               right: HeroScene with motto.
// Mobile: eyebrow, H1, subtitle, children, HeroScene (crop), trust row.
import { HeroScene } from '@/components/home/hero-scene';

interface HomeHeroProps {
  h1: string;
  eyebrow?: string;
  h1Accent?: string;
  subtitle?: string;
  trustItems?: string[];
  children?: React.ReactNode;
  /**
   * @deprecated No longer used; kept for backward compat with old app/page.tsx.
   * The lead will remove this once the page is updated.
   */
  categories?: { label: string; href: string }[];
}

export function HomeHero({
  eyebrow,
  h1,
  h1Accent,
  subtitle,
  trustItems,
  children,
}: HomeHeroProps) {
  const h1Node = buildH1(h1, h1Accent);

  return (
    <div className="pt-6 pb-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-8 lg:pt-10 lg:pb-8">
      {/* Left column */}
      <div className="min-w-0">
        {/* Eyebrow */}
        {eyebrow && <p className="type-eyebrow font-bold text-accent mb-4">{eyebrow}</p>}

        {/* H1 */}
        <h1 className="type-hero text-ink">{h1Node}</h1>

        {/* Subtitle */}
        {subtitle && <p className="mt-2 type-subtitle text-muted">{subtitle}</p>}

        {/* Hero tool card (passed from page) */}
        {children && <div className="mt-4">{children}</div>}

        {/* Hero scene on mobile (between tool and trust row) */}
        <HeroScene
          crop
          showMotto={false}
          className="mt-6 lg:hidden"
        />

        {/* Trust row */}
        {trustItems && trustItems.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1" aria-label="Why choose Img Master">
            {trustItems.map((item, i) => (
              <li key={item} className="flex items-center gap-1.5 type-small text-muted">
                <TrustIcon index={i} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right column: hero scene (desktop only) */}
      <div
        aria-hidden="true"
        className="hidden lg:block lg:self-end"
      >
        <HeroScene crop={false} showMotto />
      </div>
    </div>
  );
}

function buildH1(h1: string, h1Accent?: string): React.ReactNode {
  if (!h1Accent) return h1;
  const idx = h1.indexOf(h1Accent);
  if (idx === -1) return h1;
  const before = h1.slice(0, idx);
  const after = h1.slice(idx + h1Accent.length);
  return (
    <>
      {before}
      <span className="text-accent">{h1Accent}</span>
      {after}
    </>
  );
}

/** Small inline icon for each trust item (SVG inline, no library). */
function TrustIcon({ index }: { index: number }) {
  if (index === 0) {
    // Lightning bolt: "Works in your browser"
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-muted"
      >
        <path
          d="M11 2L4 11h6l-1 7 7-9h-6l1-7z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (index === 1) {
    // Phone: "Built for phones first"
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0 text-muted"
      >
        <rect
          x="5"
          y="2"
          width="10"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
      </svg>
    );
  }
  // Check mark: "No sign-up, no watermark"
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0 text-muted"
    >
      <path
        d="M4 10l4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
