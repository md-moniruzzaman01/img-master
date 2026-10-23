import { LockIcon } from '@/components/ui/icons';

/** Home H1 and subtitle (DESIGN.md §3.2). */
export function HomeHero({ h1, subtitle }: { h1: string; subtitle: string }) {
  return (
    <div className="pt-6 pb-2 lg:pt-12">
      <h1 className="type-h1 max-w-[22ch] text-balance text-text">{h1}</h1>
      <p className="mt-2 flex max-w-[60ch] items-start gap-2 text-muted">
        <LockIcon size={20} className="mt-0.5 shrink-0 text-success" />
        <span>{subtitle}</span>
      </p>
    </div>
  );
}
