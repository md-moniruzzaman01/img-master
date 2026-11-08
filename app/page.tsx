import { homeContent } from '@/content/home';
import { FaqList } from '@/components/content/faq-list';
import { JsonLd } from '@/components/content/json-ld';
import { ToolCard } from '@/components/content/tool-card';
import { ToolGrid } from '@/components/content/tool-grid';
import { CompareDemo } from '@/components/home/compare-demo';
import { CtaBand } from '@/components/home/cta-band';
import { HomeHero } from '@/components/home/home-hero';
import { ValuesBand } from '@/components/home/values-band';
import { Container } from '@/components/layout/container';
import { SectionHeading } from '@/components/layout/section-heading';
import { ToolShell } from '@/components/tool/tool-shell';
import { homeJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { categoryGlyphs, getNavGroups, getTool, getToolCards } from '@/lib/tools';

export const metadata = buildPageMetadata({
  title: homeContent.title,
  description: homeContent.description,
  path: '/',
});

// Home-page crest tiles (spec §5.1 item 6): not grouped by category, so these
// come from fixed slugs rather than getNavGroups().
const CREST_SLUGS = ['favicon-generator', 'resize-image', 'png-to-ico'];

export default function HomePage() {
  const navGroups = getNavGroups();
  const compressGroup = navGroups.find((g) => g.category === 'compress');
  const convertGroup = navGroups.find((g) => g.category === 'convert');
  const crestTools = getToolCards(CREST_SLUGS);
  const heroTool = getTool('compress-image-to-50kb');

  return (
    <>
      <Container size="wide">
        <HomeHero
          eyebrow={homeContent.eyebrow}
          h1={homeContent.h1}
          h1Accent={homeContent.h1Accent}
          subtitle={homeContent.subtitle}
          trustItems={homeContent.trustItems}
        >
          {heroTool && <ToolShell tool={heroTool} variant="hero" />}
        </HomeHero>
      </Container>

      {compressGroup && compressGroup.tools.length > 0 && (
        <Container size="wide" className="mt-12 lg:mt-16">
          <SectionHeading
            glyph={categoryGlyphs.compress}
            heading={homeContent.compress.heading}
            intro={homeContent.compress.intro}
          />
          <div className="mt-6">
            <ToolGrid groups={[compressGroup]} variant="home" />
          </div>
        </Container>
      )}

      {convertGroup && convertGroup.tools.length > 0 && (
        <div className="mt-12 bg-paper-2 py-10 lg:mt-16 lg:py-14">
          <Container size="wide">
            <SectionHeading
              glyph={categoryGlyphs.convert}
              heading={homeContent.convert.heading}
              intro={homeContent.convert.intro}
            />
            <div className="mt-6">
              <ToolGrid groups={[convertGroup]} variant="home" />
            </div>
          </Container>
        </div>
      )}

      <Container size="wide" className="mt-12 lg:mt-16">
        <CompareDemo
          heading={homeContent.compare.heading}
          intro={homeContent.compare.intro}
          originalLabel={homeContent.compare.originalLabel}
          resultLabel={homeContent.compare.resultLabel}
        />
      </Container>

      <div className="mt-12 lg:mt-16">
        <ValuesBand items={homeContent.values} />
      </div>

      {crestTools.length > 0 && (
        <Container size="wide" className="mt-12 lg:mt-16">
          <SectionHeading
            glyph={categoryGlyphs.favicon}
            heading={homeContent.favicon.heading}
            intro={homeContent.favicon.intro}
          />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crestTools.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} variant="tile" />
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container size="wide" className="mt-12 lg:mt-16">
        <FaqList faqs={homeContent.faqs} heading={homeContent.faqHeading} glyph="問" />
      </Container>

      <div className="mt-12 lg:mt-16">
        <CtaBand
          heading={homeContent.cta.heading}
          text={homeContent.cta.text}
          button={homeContent.cta.button}
        />
      </div>

      <JsonLd data={homeJsonLd()} />
    </>
  );
}
