import { cx } from '@/components/ui/cx';

/** Crimson hanko seal with 刃 ("blade"). Decorative: the logo text is the name. */
export function BrandSeal({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'kanji inline-flex size-8 shrink-0 items-center justify-center rounded-[3px] bg-shu text-[1.1875rem] leading-none text-white lg:size-[34px] lg:text-xl',
        className,
      )}
    >
      刃
    </span>
  );
}
