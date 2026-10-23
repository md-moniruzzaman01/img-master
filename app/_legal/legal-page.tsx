// Shared renderer for About, Privacy, Terms and Contact.
import type { Metadata } from 'next';
import { legalContent } from '@/content/legal';
import { LastUpdated } from '@/components/content/last-updated';
import { PageIntro } from '@/components/content/page-intro';
import { RichText } from '@/components/content/rich-text';
import { Container } from '@/components/layout/container';
import { buildPageMetadata } from '@/lib/seo/metadata';
import type { LegalSlug } from '@/lib/types';

export function legalMetadata(slug: LegalSlug): Metadata {
  const c = legalContent[slug];
  return buildPageMetadata({ title: c.title, description: c.description, path: `/${slug}` });
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const c = legalContent[slug];
  return (
    <Container size="text">
      <PageIntro h1={c.h1} />
      <LastUpdated date={c.updatedAt} />
      <RichText sections={c.sections} />
    </Container>
  );
}
