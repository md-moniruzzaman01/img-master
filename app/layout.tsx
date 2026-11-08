import type { Viewport } from 'next';
import localFont from 'next/font/local';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { getNavGroups, getSearchIndex } from '@/lib/tools';
import './globals.css';

export const metadata = buildRootMetadata();

// Fonts from the Figma file (spec 2026-10-25 §4), self-hosted as latin-only woff2 (Shippori Mincho B1
// and Zen Kaku Gothic New, both OFL). The full Google builds ship ~120 unicode-range slices per
// weight: ~560 KB of render-blocking @font-face CSS. Japanese glyphs fall back to system fonts.

/** Headings, logo, result numbers. */
const mincho = localFont({
  src: [
    { path: './fonts/mincho-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/mincho-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/mincho-800.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-mincho',
});

/** Body, buttons, labels, inputs. */
const gothic = localFont({
  src: [
    { path: './fonts/gothic-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/gothic-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/gothic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-gothic',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2ece1' },
    { media: '(prefers-color-scheme: dark)', color: '#15110e' },
  ],
};

/**
 * Sets data-theme before first paint so there is no flash of the wrong theme.
 * Saved choice first, else the system preference. Must never throw.
 */
const themeScript = `(function(){try{var k=${JSON.stringify(siteConfig.theme.storageKey)},t=null;try{t=localStorage.getItem(k)}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute(${JSON.stringify(siteConfig.theme.attribute)},t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = getNavGroups();
  const searchIndex = getSearchIndex();
  return (
    <html
      lang="en"
      className={`${mincho.variable} ${gothic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader groups={groups} searchIndex={searchIndex} />
        <main id="main">{children}</main>
        <SiteFooter groups={groups} />
      </body>
    </html>
  );
}
