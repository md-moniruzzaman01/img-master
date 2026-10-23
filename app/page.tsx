import Link from 'next/link';
import { homeContent } from '@/content/home';
import { getLiveTools, getToolContent } from '@/lib/tools';

// Phase 0 placeholder home. Replaced in Phase 1 with ui-builder's sections.
export default function HomePage() {
  return (
    <main id="main">
      <h1>{homeContent.h1}</h1>
      <p>{homeContent.subtitle}</p>
      <ul>
        {getLiveTools().map((t) => (
          <li key={t.slug}>
            <Link href={`/${t.slug}`}>{getToolContent(t.slug)?.h1 ?? t.slug}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
