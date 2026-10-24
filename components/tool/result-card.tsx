'use client';

import { useLayoutEffect, useRef } from 'react';
import type { EngineErrorCode, EngineErrorDetail, EngineNote, EngineResult } from '@/lib/types';
import { buttonClasses } from '@/components/ui/button-styles';
import { Button } from '@/components/ui/button';
import { cx } from '@/components/ui/cx';
import { AlertIcon, InfoIcon } from '@/components/ui/icons';
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
  /** The Share button (only where the browser can share files). */
  share: boolean;
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
          'absolute left-0 animate-pulse rounded bg-surface',
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

  // The skeleton is drawn at the expected final height. Keep that height as a
  // floor so a shorter result never pulls the content below it upward.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !busy) return;
    const h = el.offsetHeight;
    if (h > (parseFloat(el.style.minHeight) || 0)) el.style.minHeight = `${h}px`;
  }, [busy, reserve?.note, reserve?.share]);

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
        'min-w-0 rounded-card border bg-card p-4',
        status === 'failed' ? 'border-danger' : 'border-border',
      )}
    >
      <div className="flex gap-3">
        <div
          className={cx(
            'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-border',
            busy ? 'animate-pulse bg-surface' : transparent ? 'checkerboard' : 'bg-surface',
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
            className="truncate leading-6 font-semibold text-text"
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
                <p className="min-h-12 leading-6 tabular-nums text-text">{summary}</p>
              ) : (
                <>
                  <p className="leading-6 font-bold tabular-nums text-text">
                    {formatBytes(r.inputBytes)} <span className="text-primary">→</span>{' '}
                    {formatBytes(r.outputBytes)}
                  </p>
                  <p className="leading-6 font-semibold tabular-nums text-primary">
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
            <p className="mt-1 flex items-start gap-1.5 text-danger">
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
        <div className="mt-3 grid gap-1">
          {notes.map(({ n, text, warn }) => (
            <p
              key={n}
              className={cx(
                'flex items-start gap-1.5 type-small',
                warn ? 'text-text' : 'text-muted',
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
        <div aria-hidden="true" className="mt-4 grid gap-2">
          <div className="h-[52px]" />
          {reserve?.share && <div className="h-12" />}
        </div>
      )}

      {status === 'success' && r && item.url && (
        <div className="mt-4 grid gap-2">
          <a
            href={item.url}
            download={name}
            data-testid="download"
            onClick={onDownload}
            className={buttonClasses('primary', 'lg')}
          >
            {copy.download(r.outputBytes)}
          </a>
          <ShareButton
            supported={shareSupported}
            getFiles={() => [
              new File([r.blob], name, { type: FORMAT_MIME[r.format] ?? r.blob.type }),
            ]}
            onShared={onShared}
            className="w-full"
          />
        </div>
      )}

      {status === 'failed' && actions && actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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
