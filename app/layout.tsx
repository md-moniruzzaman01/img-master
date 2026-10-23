import type { Viewport } from 'next';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { getNavGroups } from '@/lib/tools';
import './globals.css';

export const metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d12' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = getNavGroups();
  return (
    <html lang="en">
      <body>
        <SiteHeader groups={groups} />
        <main id="main">{children}</main>
        <SiteFooter groups={groups} />
      </body>
    </html>
  );
}
