'use client';

import { useId } from 'react';
import type { FaviconPackage } from '@/lib/types';
import { cx } from '@/components/ui/cx';
import { XIcon } from '@/components/ui/icons';
import { faviconCopy as t } from './copy';

type Previews = FaviconPackage['previews'];

/** A square image slot: the icon when ready, an empty tile while there is none. */
function Icon({
  src,
  size,
  loading,
  className,
}: {
  src: string | undefined;
  size: number;
  loading: boolean;
  className?: string;
}) {
  const box = { width: size, height: size };
  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={box}
        className={cx(
          'block shrink-0 rounded-[3px] bg-border',
          loading && 'animate-pulse',
          className,
        )}
      />
    );
  }
  // Object URL from the engine; next/image adds nothing here.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={box}
      className={cx('block shrink-0', className)}
    />
  );
}

/** One browser tab, pinned to the light or dark scheme whatever the visitor uses. */
function TabMock({
  scheme,
  src,
  loading,
}: {
  scheme: 'light' | 'dark';
  src: string | undefined;
  loading: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        data-scheme={scheme}
        className={cx(
          'overflow-hidden rounded-[8px] border border-border bg-surface text-text',
          scheme === 'light' ? 'pin-light' : 'pin-dark',
        )}
      >
        <div className="px-2 pt-2">
          <div className="flex h-9 items-center gap-2 rounded-t-[8px] bg-bg px-2.5">
            <Icon src={src} size={16} loading={loading} />
            <span className="min-w-0 flex-1 truncate type-small text-text">{t.siteTitle}</span>
            <XIcon size={20} className="size-3.5 shrink-0 text-muted" />
          </div>
        </div>
        <div className="h-4 bg-bg" />
      </div>
      <p className="mt-1 type-caption text-muted">{scheme === 'light' ? t.tabLight : t.tabDark}</p>
    </div>
  );
}

const SIZES = [16, 32, 48, 180, 512] as const;
/** Shown size in CSS px: small icons at their real size, big ones scaled to fit. */
const SHOWN: Record<(typeof SIZES)[number], number> = { 16: 16, 32: 32, 48: 48, 180: 40, 512: 40 };

/**
 * Live preview (DESIGN.md §4.4): browser tabs in light and dark, a phone
 * home-screen tile and the real pixel sizes. Fixed heights, so a new package
 * replaces the old one in place with no layout shift.
 */
export function FaviconPreview({
  previews,
  busy,
  empty,
  emptyText,
}: {
  /** Latest package previews; kept on screen while the next one renders. */
  previews: Previews | null;
  busy: boolean;
  /** Nothing to draw yet (image mode before a file is chosen). */
  empty: boolean;
  /** Overrides the default empty-state sentence (text and emoji modes). */
  emptyText?: string;
}) {
  const headingId = useId();
  const descId = useId();
  const p = empty ? null : previews;
  const loading = !empty && !p;

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={descId}
      data-testid="favicon-preview"
      data-state={empty ? 'empty' : busy ? 'busy' : p ? 'ready' : 'loading'}
      className="rounded-card border border-border bg-bg p-3 sm:p-4"
    >
      <div className="flex h-6 items-center justify-between gap-3">
        <h2 id={headingId} className="type-h3 text-text">
          {t.previewHeading}
        </h2>
        <span
          aria-hidden="true"
          className={cx('type-small text-muted', !(busy && p) && 'invisible')}
        >
          {t.updating}
        </span>
      </div>
      <p id={descId} className="sr-only">
        {t.previewDescription}
      </p>

      <div className="mt-3">
        <div className="grid gap-3">
          {/* The tabs stay drawn (with an empty icon slot) so the box reads as a preview. */}
          <div className="grid grid-cols-2 gap-2">
            <TabMock scheme="light" src={p?.[16]} loading={loading} />
            <TabMock scheme="dark" src={p?.[16]} loading={loading} />
          </div>

          {/* Until there is an icon, this row is held empty (same height) and the
              hint sits in its place, so nothing overlaps and nothing moves later. */}
          <div className="relative">
            <div className={cx('flex items-end gap-3', empty && 'invisible')}>
              <div className="shrink-0">
                <div className="flex size-[72px] items-center justify-center rounded-[14px] bg-surface">
                  <Icon
                    src={p?.[180]}
                    size={52}
                    loading={loading}
                    className="rounded-[22%] object-cover"
                  />
                </div>
                <p className="mt-1 type-caption text-muted">{t.homeScreen}</p>
              </div>
              <div className="min-w-0 flex-1">
                <ul
                  aria-label={t.realSizes}
                  className="flex h-[72px] items-end justify-between gap-1.5"
                >
                  {SIZES.map((s) => (
                    <li key={s} className="flex flex-col items-center gap-1">
                      <span className="checkerboard block rounded-[4px] border border-border">
                        <Icon src={p?.[s]} size={SHOWN[s]} loading={loading} />
                      </span>
                      <span className="type-caption tabular-nums text-muted">{s}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 type-caption text-muted">{t.realSizes}</p>
              </div>
            </div>
            {empty && (
              <p
                data-testid="favicon-preview-empty"
                className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-surface px-4 text-center text-text"
              >
                {emptyText ?? t.previewEmpty}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
