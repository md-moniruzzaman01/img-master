import { homeContent } from '@/content/home';
import { FaqList } from '@/components/content/faq-list';
import { JsonLd } from '@/components/content/json-ld';
import { RichText } from '@/components/content/rich-text';
import { ToolGrid } from '@/components/content/tool-grid';
import { HomeHero } from '@/components/home/home-hero';
import { Container } from '@/components/layout/container';
import { homeJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getNavGroups } from '@/lib/tools';

export const metadata = buildPageMetadata({
  title: homeContent.title,
  description: homeContent.description,
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <Container size="wide">
        <HomeHero h1={homeContent.h1} subtitle={homeContent.subtitle} />
        <ToolGrid groups={getNavGroups()} />
      </Container>
      <Container size="text">
        <RichText sections={[homeContent.howItWorks]} />
        <FaqList faqs={homeContent.faqs} />
      </Container>
      <JsonLd data={homeJsonLd()} />
    </>
  );
}
