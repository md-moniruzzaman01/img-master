// Shared Open Graph card design (1200×630), "Ink Samurai" palette: washi paper
// background, ink heading with an optional crimson accent, a crimson sun.
// Rendered by next/og ImageResponse at build time. Owned by seo-content.
// No kanji here: the default next/og font has no Japanese glyphs.
import { siteConfig } from '@/lib/site-config';

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Figma "Washi" tokens (docs/superpowers/specs/2026-10-25-figma-redesign.md §3). */
export const OG_COLORS = {
  paper: '#F2ECE1',
  ink: '#17120F',
  muted: '#6E6357',
  shu: '#C3301C',
  white: '#FFFFFF',
} as const;

/** Small logo mark: a crimson rounded square with a simple "picture" glyph. */
function LogoMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        background: OG_COLORS.shu,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke={OG_COLORS.white} strokeWidth="2" />
        <circle cx="9" cy="10" r="2" fill={OG_COLORS.white} />
        <path
          d="M4 18l5-5 4 4 3-3 4 4"
          stroke={OG_COLORS.white}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Split the heading so the accent (an exact substring) can be drawn in crimson. */
function headingParts(heading: string, accent?: string): { text: string; accent: boolean }[] {
  const at = accent ? heading.indexOf(accent) : -1;
  if (!accent || at < 0) return [{ text: heading, accent: false }];
  return [
    { text: heading.slice(0, at), accent: false },
    { text: accent, accent: true },
    { text: heading.slice(at + accent.length), accent: false },
  ].filter((p) => p.text.length > 0);
}

export function OgCard({
  heading,
  accent,
  tagline,
}: {
  heading: string;
  /** Exact substring of heading drawn in crimson (content.h1Accent). */
  accent?: string;
  tagline: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: OG_COLORS.paper,
        color: OG_COLORS.ink,
        fontFamily: 'serif',
        overflow: 'hidden',
      }}
    >
      {/* The red sun, partly off the right edge. */}
      <div
        style={{
          position: 'absolute',
          right: -140,
          top: 90,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: OG_COLORS.shu,
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          width: 860,
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LogoMark size={64} />
          <div style={{ fontSize: 38, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: heading.length > 24 ? 80 : 96,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          {headingParts(heading, accent).map((p, i) => (
            <span
              key={i}
              style={{
                color: p.accent ? OG_COLORS.shu : OG_COLORS.ink,
                whiteSpace: 'pre-wrap',
              }}
            >
              {p.text}
            </span>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: OG_COLORS.muted,
            fontFamily: 'sans-serif',
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  );
}
