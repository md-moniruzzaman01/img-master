import type { RichSection } from '@/lib/types';
import { InlineText } from './inline-text';

/** Content sections: H2, paragraphs, optional list and table (DESIGN.md §4.5). */
export function RichText({ sections }: { sections: RichSection[] }) {
  return (
    <>
      {sections.map((s, si) => (
        <section key={`${s.heading}-${si}`} className="mt-8 lg:mt-12">
          <h2 className="type-h2 text-balance">{s.heading}</h2>
          {s.paragraphs.map((p, pi) => (
            <p key={pi} className="mt-3 text-text">
              <InlineText text={p} />
            </p>
          ))}
          {s.list && s.list.length > 0 && (
            <ul className="mt-3 grid list-disc gap-2 pl-6 text-text marker:text-muted">
              {s.list.map((item, li) => (
                <li key={li}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          )}
          {s.table && (
            <div
              role="region"
              aria-label={s.table.caption}
              tabIndex={0}
              className="mt-4 overflow-x-auto rounded-card border border-border"
            >
              <table className="w-full border-collapse text-left type-small tabular-nums">
                <caption className="border-b border-border bg-surface px-3 py-2 text-left font-semibold text-text">
                  {s.table.caption}
                </caption>
                <thead>
                  <tr>
                    {s.table.headers.map((h, hi) => (
                      <th
                        key={hi}
                        scope="col"
                        className="border-b border-border bg-surface px-3 py-2 font-semibold whitespace-nowrap text-text"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border last:border-b-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 align-top text-text">
                          <InlineText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
