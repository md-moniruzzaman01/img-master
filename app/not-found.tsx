import { PageIntro } from '@/components/content/page-intro';
import { ToolGrid } from '@/components/content/tool-grid';
import { HeroScene } from '@/components/home/hero-scene';
import { Container } from '@/components/layout/container';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getNavGroups } from '@/lib/tools';

export const metadata = buildPageMetadata({
  title: 'Page not found | Img Master',
  description: "This page doesn't exist. Pick one of the free image tools below.",
  path: '/404',
  noindex: true,
});

export default function NotFound() {
  return (
    <Container size="wide">
      <PageIntro
        h1="This page doesn't exist"
        subtitle="The link may be old or mistyped. Pick a tool below instead."
      />
      <HeroScene animate={false} compact />
      <ToolGrid groups={getNavGroups()} />
    </Container>
  );
}
