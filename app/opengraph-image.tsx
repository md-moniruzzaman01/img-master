// Open Graph image for the home page (and pages without their own), generated
// at build time. Owned by seo-content.
import { ImageResponse } from 'next/og';
import { homeContent } from '@/content/home';
import { OG_SIZE, OgCard } from '@/lib/seo/og-card';

export const alt = 'Img Master: free image tools that work on your phone';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default async function Image() {
  return new ImageResponse(
    <OgCard heading={homeContent.h1} tagline="Compress · Convert · No upload" />,
    { ...OG_SIZE },
  );
}
