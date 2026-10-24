import Link from 'next/link';
import { HeroScene } from './hero-scene';

/** Home H1, one subtitle line, category chips and the brand scene (spec §12.3). */
export function HomeHero({
  h1,
  subtitle,
  categories,
}: {
  h1: string;
  subtitle: string;
  categories: { label: string; href: string }[];
}) {
  return (
    <div className="grid items-center gap-2 pt-6 pb-2 lg:grid-cols-2 lg:gap-8 lg:pt-12">
      <div className="text-center lg:text-left">
        <h1 className="type-h1 mx-auto max-w-[24ch] text-balance text-text lg:mx-0">{h1}</h1>
        <p className="mx-auto mt-2 max-w-[60ch] type-subtitle text-muted lg:mx-0">{subtitle}</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
          {categories.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="inline-flex min-h-12 items-center rounded-full border border-gold px-4 text-sm font-medium text-text"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <HeroScene />
    </div>
  );
}
