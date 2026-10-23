import type { Metadata } from 'next';
import { assertLiveToolsHaveContent, getLiveToolPage, getLiveTools } from '@/lib/tools';

// Phase 0 placeholder tool page. Phase 1 renders ToolShell and content sections.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  assertLiveToolsHaveContent(); // fails the build if a live tool has no content
  return getLiveTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const { content } = getLiveToolPage(slug);
  return { title: content.title, description: content.description };
}

export default async function ToolPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params;
  const { content } = getLiveToolPage(slug);
  return (
    <main id="main">
      <h1>{content.h1}</h1>
      <p>{content.subtitle}</p>
    </main>
  );
}
