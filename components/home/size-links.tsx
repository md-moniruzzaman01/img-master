import Link from 'next/link';

/** "Compress to a size" row: big chips that link to the size pages. */
export function SizeLinks({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="type-h3 text-text">{heading}</h2>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex min-h-14 items-center justify-center rounded-full border border-border bg-surface-2 px-3 text-lg font-bold tabular-nums text-text no-underline transition-colors duration-150 ease-out hover:border-primary hover:bg-primary hover:text-on-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
