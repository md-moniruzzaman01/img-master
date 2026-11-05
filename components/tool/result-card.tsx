'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { EngineErrorCode, EngineErrorDetail, EngineNote, EngineResult } from '@/lib/types';
import { buttonClasses } from '@/components/ui/button-styles';
import { Button } from '@/components/ui/button';
import { cx } from '@/components/ui/cx';
import { AlertIcon, CompareIcon, InfoIcon } from '@/components/ui/icons';
import { Compare } from './compare';
import { copy, errorMessage, WARNING_NOTES } from './copy';
import { FORMAT_LABEL, FORMAT_MIME, formatBytes } from './format';
import { ShareButton } from './share-button';

export type ItemStatus = 'queued' | 'processing' | 'success' | 'failed';

export interface ResultItem {
  id: number;
  file: File;
  status: ItemStatus;
  result?: EngineResult;
  /** Object URL of the output, for download. */
  url?: string;
  /** Object URL of a ≤256px preview. */
  thumb?: string;
  error?: { code: EngineErrorCode | 'UNKNOWN'; detail?: EngineErrorDetail };
}

/** Space a waiting card holds for parts that may appear in the result. */
export interface CardReserve {
  /** One note (two short lines on phones). */
  note: boolean;
}

export interface CardAction {
  id: string;
  label: string;
}

/** Pulsing bar that stands in for one line of text (same line box as the real text). */
function SkeletonLine({ width, small }: { width: string; small?: boolean }) {
  return (
    <p aria-hidden="true" className={cx('relative', small ? 'type-small' : 'leading-6')}>
      &nbsp;
      <span
        className={cx(
          'absolute left-0 animate-pulse rounded bg-paper-2',
          small ? 'top-1 h-3' : 'top-1 h-4',
          width,
        )}
      />
    </p>
  );
}

/**
 * One file's result (DESIGN.md §4.3): white bordered card with an 80px
 * thumbnail, name, before → after in bold, "% smaller", dimensions and notes,
 * then a full-width Download and (where supported) Share. A skeleton of the
 * same height while waiting; a plain error with suggestion buttons on failure.
 * Carries the QA data-* hooks.
 */
export function ResultCard({
  item,
  fileName,
  noteText,
  errorText,
  actions,
  onAction,
  onDownload,
  shareSupported = false,
  onShared,
  reserve,
  summary,
  meta,
}: {
  item: ResultItem;
  /** Replaces the "before → after" lines (for outputs where savings make no sense). */
  summary?: string;
  /** Replaces the "W × H px · FORMAT" line. */
  meta?: string;
  /** Output name, unique within the batch (defaults to the engine's name). */
  fileName?: string;
  /** Turns an engine note into a sentence (needs the tool's target). */
  noteText: (note: EngineNote, r: EngineResult) => string | null;
  /** Overrides the default error sentence (e.g. TARGET_UNREACHABLE). */
  errorText?: string;
  actions?: CardAction[];
  onAction?: (id: string) => void;
  onDownload: () => void;
  /** Show a Share button on the finished card (decided once by the parent). */
  shareSupported?: boolean;
  onShared?: () => void;
  /** What the skeleton should hold space for (DESIGN.md §8: no shift when results land). */
  reserve?: CardReserve;
}) {
  const { status, result: r, file } = item;
  const busy = status === 'queued' || status === 'processing';
  const transparent = r && r.format !== 'jpeg';
  const name = fileName ?? r?.fileName ?? file.name;
  const ref = useRef<HTMLElement>(null);

  // "Compare": the original's object URL is ours to manage — created when the
  // dialog opens, revoked when it closes (or the card unmounts) so nothing leaks.
  const [compareOpen, setCompareOpen] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  function openCompare() {
    setOriginalUrl(URL.createObjectURL(file));
    setCompareOpen(true);
  }
  function closeCompare() {
    setCompareOpen(false);
    setOriginalUrl(null);
  }
  useEffect(() => {
    if (!originalUrl) return;
    return () => URL.revokeObjectURL(originalUrl);
  }, [originalUrl]);

  // The skeleton is drawn at the expected final height. Keep that height as a
  // floor so a shorter result never pulls the content below it upward.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !busy) return;
    const h = el.offsetHeight;
    if (h > (parseFloat(el.style.minHeight) || 0)) el.style.minHeight = `${h}px`;
  }, [busy, reserve?.note]);

  const notes =
    status === 'success' && r
      ? r.notes.flatMap((n) => {
          const text = noteText(n, r);
          return text ? [{ n, text, warn: WARNING_NOTES.includes(n) }] : [];
        })
      : [];

  return (
    <article
      ref={ref}
      data-testid="result-card"
      data-status={status}
      data-input-bytes={file.size}
      data-output-bytes={r?.outputBytes}
      data-width={r?.width}
      data-height={r?.height}
      data-format={r?.format}
      data-file-name={r ? name : undefined}
      data-quality={r?.quality}
      data-ms={r?.ms}
      data-notes={r && r.notes.length > 0 ? r.notes.join(' ') : undefined}
      data-error={item.error?.code}
      aria-busy={busy || undefined}
      className={cx(
        'min-w-0 rounded-card border bg-card p-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-6',
        status === 'failed' ? 'border-shu' : 'border-line',
      )}
    >
      <div className="flex gap-3 md:col-start-1">
        <div
          className={cx(
            'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-line',
            busy ? 'animate-pulse bg-paper-2' : transparent ? 'checkerboard' : 'bg-paper-2',
          )}
        >
          {item.thumb && (
            // Downscaled preview (≤ 256px) from an object URL; next/image adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumb} alt={name} className="size-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            data-testid="file-name"
            className="truncate leading-6 font-semibold text-ink"
            title={name}
          >
            {name}
          </p>

          {busy && (
            // Same line boxes as the result below, so the card doesn't grow when it lands.
            <>
              <SkeletonLine width="w-3/4" />
              <SkeletonLine width="w-1/3" />
              <SkeletonLine width="w-1/2" small />
              <span className="sr-only">{status === 'queued' ? copy.waiting : copy.working}</span>
            </>
          )}

          {status === 'success' && r && (
            <>
              {summary ? (
                <p className="min-h-12 leading-6 tabular-nums text-ink">{summary}</p>
              ) : (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2 leading-7 tabular-nums text-ink">
                    <span className="text-muted line-through">{formatBytes(r.inputBytes)}</span>
                    <span aria-hidden="true" className="text-muted">
                      →
                    </span>
                    <span className="font-display text-xl font-extrabold">
                      {formatBytes(r.outputBytes)}
                    </span>
                  </p>
                  <p className="leading-6 font-semibold tabular-nums text-accent">
                    {copy.change(r.inputBytes, r.outputBytes)}
                  </p>
                </>
              )}
              <p className="type-small tabular-nums text-muted">
                {meta ?? `${r.width} × ${r.height} px · ${FORMAT_LABEL[r.format]}`}
              </p>
            </>
          )}

          {status === 'failed' && item.error && (
            <p className="mt-1 flex items-start gap-1.5 text-accent-strong">
              <AlertIcon size={20} className="mt-0.5 shrink-0" />
              <span className="min-w-0 font-display text-lg [overflow-wrap:anywhere]">
                {errorText ?? errorMessage(item.error.code)}
              </span>
            </p>
          )}
        </div>
      </div>

      {busy && reserve?.note && (
        // A note is usually two lines on phones, one on wider screens.
        <p aria-hidden="true" className="mt-3 type-small">
          &nbsp;
          <br className="sm:hidden" />
          &nbsp;
        </p>
      )}
      {notes.length > 0 && (
        <div className="mt-3 grid gap-1 md:col-start-1">
          {notes.map(({ n, text, warn }) => (
            <p
              key={n}
              className={cx(
                'flex items-start gap-1.5 type-small',
                warn ? 'text-ink' : 'text-muted',
              )}
            >
              {warn ? (
                <AlertIcon size={20} className="size-4 shrink-0 translate-y-0.5" />
              ) : (
                <InfoIcon size={20} className="size-4 shrink-0 translate-y-0.5" />
              )}
              <span>{text}</span>
            </p>
          ))}
        </div>
      )}

      {busy && (
        <div aria-hidden="true" className="mt-4 md:col-start-2 md:row-start-1 md:row-span-2 md:mt-0">
          {/* Compare + Download row. */}
          <div className="h-12 md:w-72" />
        </div>
      )}

      {status === 'success' && r && item.url && (
        <div className="mt-4 grid grid-cols-2 gap-2 md:col-start-2 md:row-start-1 md:row-span-2 md:mt-0 md:flex">
          <Button variant="secondary" data-testid="compare" onClick={openCompare} className="md:order-1">
            <CompareIcon size={18} aria-hidden="true" />
            {copy.compare}
          </Button>
          <a
            href={item.url}
            download={name}
            data-testid="download"
            onClick={onDownload}
            className={buttonClasses('solid', 'md', 'whitespace-nowrap !px-3 md:order-2 md:!px-5')}
          >
            {copy.download(r.outputBytes)}
          </a>
          {shareSupported && (
            <ShareButton
              supported={shareSupported}
              getFiles={() => [
                new File([r.blob], name, { type: FORMAT_MIME[r.format] ?? r.blob.type }),
              ]}
              onShared={onShared}
              className="col-span-2 w-full md:order-3 md:col-span-1 md:w-auto"
            />
          )}
          <Compare
            open={compareOpen}
            onClose={closeCompare}
            fileName={name}
            originalUrl={originalUrl ?? ''}
            resultUrl={item.url}
          />
        </div>
      )}

      {status === 'failed' && actions && actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 md:col-start-1">
          {actions.map((a) => (
            <Button key={a.id} variant="secondary" onClick={() => onAction?.(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
