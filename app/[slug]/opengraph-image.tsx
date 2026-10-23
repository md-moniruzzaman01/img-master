// Open Graph image for every live tool page, generated at build time.
// Owned by seo-content. Design: brand background, white H1, small logo.
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
    <OgCard heading={content.h1} tagline="Free · No upload · Works on your phone" />,
    { ...OG_SIZE },
  );
}
