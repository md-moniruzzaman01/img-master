import type { FaqItem } from '@/lib/types';
import { ChevronDownIcon } from '@/components/ui/icons';
import { InlineText } from './inline-text';

/** Native <details>/<summary> accordion: works without JavaScript. */
export function FaqList({
  faqs,
  heading = 'Frequently asked questions',
}: {
  faqs: FaqItem[];
  heading?: string;
}) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-8 lg:mt-12">
      <h2 className="type-h2 text-text">{heading}</h2>
      <div className="mt-4 divide-y divide-border rounded-card border border-border">
        {faqs.map((f, i) => (
          <details key={i} className="group">
            <summary className="flex min-h-12 list-none items-center justify-between gap-3 rounded-card px-4 py-3">
              <h3 className="type-h3 text-text">{f.q}</h3>
              <ChevronDownIcon
                size={20}
                className="shrink-0 text-muted transition-transform duration-150 ease-out group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-text">
              <InlineText text={f.a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
