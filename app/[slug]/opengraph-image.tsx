// Open Graph image for every live tool page, generated at build time.
// Owned by seo-content. Design: lib/seo/og-card.tsx (paper, ink H1 with crimson accent, sun).
import { ImageResponse } from 'next/og';
import { getLiveToolPage, getLiveTools } from '@/lib/tools';
import { OG_SIZE, OgCard } from '@/lib/seo/og-card';

export const alt = 'Img Master: free image tool that runs in your browser';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getLiveTools().map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { content } = getLiveToolPage(slug);
  return new ImageResponse(
    <OgCard
      heading={content.h1}
      accent={content.h1Accent}
      tagline="Free · No upload · Works on your phone"
    />,
    { ...OG_SIZE },
  );
}
