import { CheckIcon } from '@/components/ui/icons';

/** No upload · No signup · No watermark · Free. */
export function TrustStrip({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label="Why Img Master"
      className="mt-8 grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-4 lg:mt-12 lg:p-5"
    >
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2 font-semibold text-text">
          <CheckIcon size={20} className="shrink-0 text-success" />
          {t}
        </li>
      ))}
    </ul>
  );
}
