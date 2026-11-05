// "How it works" page (/how-it-works, spec §5.6). Owned by the lead.
import type { Metadata } from 'next';
import { FaqList } from '@/components/content/faq-list';
import { PageIntro } from '@/components/content/page-intro';
import { RichText } from '@/components/content/rich-text';
import { Container } from '@/components/layout/container';
import { howItWorksContent } from '@/content/pages/how-it-works';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: howItWorksContent.title,
  description: howItWorksContent.description,
  path: '/how-it-works',
});

export default function HowItWorksPage() {
  return (
    <Container size="text">
      <PageIntro h1={howItWorksContent.h1} subtitle={howItWorksContent.subtitle} />
      <RichText sections={howItWorksContent.sections} />
      {howItWorksContent.faqs && <FaqList faqs={howItWorksContent.faqs} />}
    </Container>
  );
}
