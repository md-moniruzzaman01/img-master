import { siteConfig } from '@/lib/site-config';

/**
 * Reserved ad space (DESIGN.md §4.5). Renders nothing while ads are off.
 * When on, it holds a fixed min-height so nothing shifts when the ad loads.
 */
export function AdSlot({ position }: { position: 'below-results' | 'before-footer' }) {
  const ads: { enabled: boolean; positions: readonly string[] } = siteConfig.ads;
  if (!ads.enabled || !ads.positions.includes(position)) return null;
  return (
    <aside
      aria-label="Advertisement"
      data-ad-position={position}
      className="mt-8 flex min-h-[250px] items-start justify-center rounded-card bg-surface lg:min-h-[280px]"
    >
      <span className="pt-2 type-caption text-muted">Advertisement</span>
    </aside>
  );
}
