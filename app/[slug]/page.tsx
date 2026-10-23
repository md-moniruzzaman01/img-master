import type { Metadata } from 'next';
import { AdSlot } from '@/components/content/ad-slot';
import { FaqList } from '@/components/content/faq-list';
import { HowToSteps } from '@/components/content/how-to-steps';
import { JsonLd } from '@/components/content/json-ld';
import { LastUpdated } from '@/components/content/last-updated';
import { PageIntro } from '@/components/content/page-intro';
import { RelatedTools } from '@/components/content/related-tools';
import { RichText } from '@/components/content/rich-text';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Container } from '@/components/layout/container';
import { ToolShell } from '@/components/tool/tool-shell';
import { toolJsonLd } from '@/lib/seo/jsonld';
import { buildToolMetadata } from '@/lib/seo/metadata';
import {
  assertLiveToolsHaveContent,
  getBreadcrumbs,
  getLiveToolPage,
  getLiveTools,
  getToolCards,
} from '@/lib/tools';

// Every tool page comes from the registry + its content file.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  assertLiveToolsHaveContent(); // fails the build if a live tool has no content
  return getLiveTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const { tool, content } = getLiveToolPage(slug);
  return buildToolMetadata(tool, content);
}

export default async function ToolPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params;
  const { tool, content } = getLiveToolPage(slug);
  return (
    <>
      <Container size="tool">
        <Breadcrumbs items={getBreadcrumbs(slug)} />
        <PageIntro h1={content.h1} subtitle={content.subtitle} />
        <ToolShell tool={tool} />
      </Container>
      <Container size="text">
        <HowToSteps steps={content.howTo} />
        <RichText sections={content.sections} />
        {content.tips?.length ? (
          <RichText sections={[{ heading: 'Tips', paragraphs: [], list: content.tips }]} />
        ) : null}
        <RelatedTools tools={getToolCards(content.related)} />
        <FaqList faqs={content.faqs} />
        <LastUpdated date={content.updatedAt} />
        <AdSlot position="before-footer" />
      </Container>
      <JsonLd data={toolJsonLd(tool, content)} />
    </>
  );
}
