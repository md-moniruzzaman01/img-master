import type { Metadata, Viewport } from 'next';
import { siteConfig } from '@/lib/site-config';
import './globals.css';

// Phase 0 shell. The lead builds the full layout (header, footer) in Phase 1.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.tagline,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
