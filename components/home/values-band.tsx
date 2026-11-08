import type { ValueItem } from '@/lib/types';

/**
 * Dark band with 3 value items (無 精 速). Full-width bg-band, no Container wrapper.
 * Used on home and About pages.
 */
export function ValuesBand({ items }: { items: ValueItem[] }) {
  return (
    <div className="bg-band">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
        <ul className="grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.glyph}>
              <span
                aria-hidden="true"
                className="kanji block text-3xl font-extrabold text-accent"
              >
                {item.glyph}
              </span>
              <p className="mt-3 font-bold text-lg text-on-band">{item.title}</p>
              <p className="mt-1 type-body text-on-band-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
