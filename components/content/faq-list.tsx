import type { FaqItem } from '@/lib/types';
import { ChevronDownIcon } from '@/components/ui/icons';
import { InlineText } from './inline-text';

/**
 * Native <details>/<summary> accordion: works without JavaScript.
 * `glyph` switches to the home-page style from the design: a kanji beside the
 * heading, the first answer open, and a plus/minus marker.
 */
export function FaqList({
  faqs,
  heading = 'Frequently asked questions',
  glyph,
}: {
  faqs: FaqItem[];
  heading?: string;
  glyph?: string;
}) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <h2 className={glyph ? 'flex items-baseline gap-3 type-h2' : 'type-h2'}>
        {glyph && (
          <span aria-hidden="true" className="kanji text-shu">
            {glyph}
          </span>
        )}
        {heading}
      </h2>
      <div className="mt-4 border-t border-line">
        {faqs.map((f, i) => (
          <details key={i} open={glyph && i === 0 ? true : undefined} className="group border-b border-line">
            <summary className="flex min-h-12 list-none items-center justify-between gap-3 py-3">
              <h3 className="font-display text-[1.0625rem] leading-6 font-semibold text-ink">
                {f.q}
              </h3>
              {glyph ? (
                <span aria-hidden="true" className="shrink-0 text-2xl leading-none text-ink">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">&minus;</span>
                </span>
              ) : (
                <ChevronDownIcon
                  size={20}
                  className="shrink-0 text-muted transition-transform duration-150 ease-out group-open:rotate-180"
                />
              )}
            </summary>
            <p className="pb-4 text-ink">
              <InlineText text={f.a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
