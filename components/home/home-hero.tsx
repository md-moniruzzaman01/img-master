/** Home H1 and one subtitle line (DESIGN.md §3.2). No background or illustration. */
export function HomeHero({ h1, subtitle }: { h1: string; subtitle: string }) {
  return (
    <div className="pt-8 pb-2 text-center lg:pt-14">
      <h1 className="type-h1 mx-auto max-w-[24ch] text-balance text-text">{h1}</h1>
      <p className="mx-auto mt-2 max-w-[60ch] type-subtitle text-muted">{subtitle}</p>
    </div>
  );
}
