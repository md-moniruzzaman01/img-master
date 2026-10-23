import Link from 'next/link';
import type { ReactNode } from 'react';

// Inline syntax for content strings: **bold**, [text](/path), [text](mailto:x),
// [text](https://...). Nothing else, and no markdown library.
const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

const linkClass =
  'inline-block py-[13.5px] -my-[13.5px] font-medium text-primary underline underline-offset-4 [overflow-wrap:anywhere] hover:text-primary-hover';

function parse(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) {
      out.push(
        <strong key={key} className="font-semibold">
          {parse(m[1], key)}
        </strong>,
      );
    } else {
      const label = m[2];
      const href = m[3];
      if (href.startsWith('/')) {
        out.push(
          <Link key={key} href={href} className={linkClass}>
            {label}
          </Link>,
        );
      } else if (href.startsWith('mailto:')) {
        out.push(
          <a key={key} href={href} className={linkClass}>
            {label}
          </a>,
        );
      } else if (href.startsWith('https://') || href.startsWith('http://')) {
        out.push(
          <a key={key} href={href} rel="noopener noreferrer" className={linkClass}>
            {label}
          </a>,
        );
      } else {
        // Unknown scheme: show the text only, never a risky link.
        out.push(label);
      }
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Renders one content string with the inline syntax above. */
export function InlineText({ text }: { text: string }) {
  return <>{parse(text, 'i')}</>;
}
