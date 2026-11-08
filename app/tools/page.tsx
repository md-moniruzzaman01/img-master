// "Every tool" page (/tools, spec §5.5). Owned by the lead.
import type { Metadata } from 'next';
import { FaqList } from '@/components/content/faq-list';
import { PageIntro } from '@/components/content/page-intro';
import { RichText } from '@/components/content/rich-text';
import { ToolGrid } from '@/components/content/tool-grid';
import { Container } from '@/components/layout/container';
import { toolsIndexContent, fillCount } from '@/content/pages/tools-index';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getNavGroups, getLiveToolCount } from '@/lib/tools';

export const metadata: Metadata = buildPageMetadata({
  title: toolsIndexContent.title,
  description: toolsIndexContent.description,
  path: '/tools',
});

export default function ToolsPage() {
  const count = getLiveToolCount();
  const subtitle = fillCount(toolsIndexContent.subtitle, count);
  return (
    <>
      <Container size="wide">
        <PageIntro h1={toolsIndexContent.h1} subtitle={subtitle} />
        <ToolGrid groups={getNavGroups()} variant="index" />
      </Container>
      <Container size="text">
        <RichText sections={toolsIndexContent.sections} />
        {toolsIndexContent.faqs && <FaqList faqs={toolsIndexContent.faqs} />}
      </Container>
    </>
  );
}
