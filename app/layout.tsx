import type { Viewport } from 'next';
import { Noto_Serif } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { getNavGroups } from '@/lib/tools';
import './globals.css';

export const metadata = buildRootMetadata();

/** Headings and logo only (DESIGN.md §2). Self-hosted at build: no runtime request to Google. */
const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-serif',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf8f4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = getNavGroups();
  return (
    <html lang="en" className={notoSerif.variable}>
      <body>
        <SiteHeader groups={groups} />
        <main id="main">{children}</main>
        <SiteFooter groups={groups} />
      </body>
    </html>
  );
}
