import type { Viewport } from 'next';
import { Shippori_Mincho_B1, Yuji_Syuku, Zen_Kaku_Gothic_New } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';
import { getNavGroups, getSearchIndex } from '@/lib/tools';
import './globals.css';

export const metadata = buildRootMetadata();

// Fonts from the Figma file (spec 2026-10-25 §4). Self-hosted at build: no runtime request to Google.

/** Headings, logo, result numbers. */
const mincho = Shippori_Mincho_B1({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  display: 'swap',
  variable: '--font-mincho',
});

/** Body, buttons, labels, inputs. */
const gothic = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-gothic',
});

/**
 * Decorative kanji (圧縮, 五十 …). Not preloaded and not limited to latin, so the
 * browser fetches only the unicode-range slices for glyphs a page actually shows.
 */
const kanji = Shippori_Mincho_B1({
  weight: '800',
  display: 'swap',
  preload: false,
  variable: '--font-kanji',
});

/** Favicon "Brush" typeface. Downloaded only when text uses it (favicon Letters tab). */
const brush = Yuji_Syuku({
  weight: '400',
  display: 'swap',
  preload: false,
  variable: '--font-brush',
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
      className={`${mincho.variable} ${gothic.variable} ${kanji.variable} ${brush.variable}`}
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
