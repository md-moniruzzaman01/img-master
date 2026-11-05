// About page (spec §5.7, Figma desktop-about-*). Owned by the lead.
import type { Metadata } from 'next';
import { RichText } from '@/components/content/rich-text';
import { HeroScene } from '@/components/home/hero-scene';
import { BrandSeal } from '@/components/layout/brand-seal';
import { Container } from '@/components/layout/container';
import { aboutContent } from '@/content/legal/about';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = buildPageMetadata({
  title: aboutContent.title,
  description: aboutContent.description,
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      {/* Hero: eyebrow + H1 + intro + hero scene */}
      <Container size="wide">
        <div className="pt-6 pb-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-end lg:pb-0">
          <div className="lg:pb-10">
            {aboutContent.eyebrow && (
              <p className="type-eyebrow font-bold text-accent mb-4 tracking-widest uppercase">
                {aboutContent.eyebrow}
              </p>
            )}
            <h1 className="type-hero text-ink text-balance">{aboutContent.h1}</h1>
            {aboutContent.intro?.map((p, i) => (
              <p key={i} className="mt-4 type-body text-ink max-w-prose">
                {p}
              </p>
            ))}
          </div>
          <HeroScene crop={false} showMotto={true} className="mt-6 lg:mt-0" />
        </div>
      </Container>

      {/* Values band */}
      {aboutContent.values && (
        <div className="mt-8 bg-band text-on-band">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
            <div className="grid gap-8 sm:grid-cols-3">
              {aboutContent.values.map((v) => (
                <div key={v.glyph}>
                  <p aria-hidden="true" className="kanji font-display font-extrabold text-5xl text-accent">
                    {v.glyph}
                  </p>
                  <h2 className="mt-3 font-display font-bold text-xl text-on-band">{v.title}</h2>
                  <p className="mt-1 type-body text-on-band-muted">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Built by card + rest of sections */}
      <Container size="text">
        <div className="mt-10 flex items-center gap-4 rounded-card border border-line bg-card p-5">
          <BrandSeal className="!size-12 !text-2xl flex-shrink-0" />
          <div>
            <p className="font-display font-extrabold text-lg text-ink">
              Built by {siteConfig.owner.company} in Dhaka
            </p>
            <p className="type-small text-muted">
              Questions or ideas:{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>
        </div>
        <RichText sections={aboutContent.sections} />
      </Container>
    </>
  );
}
