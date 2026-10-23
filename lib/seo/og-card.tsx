// Shared Open Graph card design (1200×630): brand background, white H1, small logo.
// Rendered by next/og ImageResponse at build time. Owned by seo-content.
import { siteConfig } from '@/lib/site-config';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_BRAND = '#4338CA';

/** Small logo mark: a white rounded square with a simple "picture" glyph. */
function LogoMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke={OG_BRAND} strokeWidth="2" />
        <circle cx="9" cy="10" r="2" fill={OG_BRAND} />
        <path d="M4 18l5-5 4 4 3-3 4 4" stroke={OG_BRAND} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function OgCard({ heading, tagline }: { heading: string; tagline: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: OG_BRAND,
        color: '#FFFFFF',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <LogoMark size={64} />
        <div style={{ fontSize: 36, fontWeight: 700 }}>{siteConfig.name}</div>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: heading.length > 24 ? 84 : 100,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: -1,
        }}
      >
        {heading}
      </div>
      <div style={{ display: 'flex', fontSize: 34, opacity: 0.9 }}>{tagline}</div>
    </div>
  );
}
