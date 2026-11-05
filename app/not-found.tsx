import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { SamuraiStage } from '@/components/samurai/samurai';
import { buttonClasses } from '@/components/ui/button-styles';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata = buildPageMetadata({
  title: 'Page not found | Img Master',
  description: "This page doesn't exist. Pick one of the free image tools instead.",
  path: '/404',
  noindex: true,
});

const popular = [
  { label: '50 KB', href: '/compress-image-to-50kb' },
  { label: '100 KB', href: '/compress-image-to-100kb' },
  { label: 'WebP to JPG', href: '/webp-to-jpg' },
  { label: 'Favicon', href: '/favicon-generator' },
];

export default function NotFound() {
  return (
    <Container size="wide" className="py-10 lg:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16 lg:px-[72px]">
        <SamuraiStage
          layout="panel"
          state="error"
          text={{
            label: 'Error',
            title: 'That one resisted',
            line: "This file isn't an image we can read. Try JPG, PNG or WebP.",
          }}
        />
        <div>
          <p className="type-eyebrow text-shu">404 · 道なし</p>
          <h1 className="mt-4 font-display text-[2.5rem] leading-[1.1] font-extrabold text-ink lg:text-[3.5rem]">
            This path leads nowhere.
          </h1>
          <p className="mt-4 type-body text-ink-2">
            The page may have moved. The tools are all still here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className={buttonClasses('primary', 'md')}>
              Go to the home page
            </Link>
            <Link href="/tools" className={buttonClasses('secondary', 'md')}>
              See all tools
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="type-small font-bold text-ink-2">Popular:</span>
            {popular.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="inline-flex min-h-12 items-center rounded-control border border-line bg-card px-4 font-bold text-ink no-underline hover:border-line-strong"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
