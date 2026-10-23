'use client';

import type { EngineErrorCode, EngineErrorDetail, EngineNote, EngineResult } from '@/lib/types';
import { buttonClasses } from '@/components/ui/button-styles';
import { Button } from '@/components/ui/button';
import { cx } from '@/components/ui/cx';
import { AlertIcon, CheckIcon, DownloadIcon, ImageIcon, InfoIcon } from '@/components/ui/icons';
import { copy, errorMessage, WARNING_NOTES } from './copy';
import { FORMAT_LABEL, percentSmaller } from './format';

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

export interface CardAction {
  id: string;
  label: string;
}

/**
 * One file's result (DESIGN.md §4.3): skeleton while waiting, then before →
 * after, dimensions and notes, or a plain error with suggestion buttons.
 * Carries the QA data-* hooks.
 */
export function ResultCard({
  item,
  fileName,
  noteText,
  errorText,
  actions,
  onAction,
  showDownload,
  onDownload,
}: {
  item: ResultItem;
  /** Output name, unique within the batch (defaults to the engine's name). */
  fileName?: string;
  /** Turns an engine note into a sentence (needs the tool's target). */
  noteText: (note: EngineNote, r: EngineResult) => string | null;
  /** Overrides the default error sentence (e.g. TARGET_UNREACHABLE). */
  errorText?: string;
  actions?: CardAction[];
  onAction?: (id: string) => void;
  showDownload: boolean;
  onDownload: () => void;
}) {
  const { status, result: r, file } = item;
  const busy = status === 'queued' || status === 'processing';
  const p = r ? percentSmaller(r.inputBytes, r.outputBytes) : 0;
  const transparent = r && r.format !== 'jpeg';
  const name = fileName ?? r?.fileName ?? file.name;

  return (
    <article
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
        'flex min-h-[104px] gap-3 rounded-card border bg-surface p-3 lg:p-4',
        status === 'failed' ? 'border-danger' : 'border-border',
      )}
    >
      <div
        className={cx(
          'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] lg:size-20',
          busy ? 'animate-pulse bg-surface-2' : transparent ? 'checkerboard' : 'bg-surface-2',
        )}
      >
        {item.thumb ? (
          // Downscaled preview (≤ 256px) from an object URL; next/image adds nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumb} alt="" className="size-full object-contain" />
        ) : (
          !busy && <ImageIcon className="text-muted" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p data-testid="file-name" className="truncate font-semibold text-text" title={name}>
          {name}
        </p>

        {busy && (
          <div aria-hidden="true" className="mt-2 grid gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        )}
        {busy && (
          <span className="sr-only">{status === 'queued' ? copy.waiting : copy.working}</span>
        )}

        {status === 'success' && r && (
          <>
            <p className="mt-0.5 tabular-nums text-text">
              {p > 0 && (
                <CheckIcon size={20} className="mr-1 inline size-4 align-[-2px] text-success" />
              )}
              {copy.successLine(r.inputBytes, r.outputBytes)}
            </p>
            <p className="type-small tabular-nums text-muted">
              {r.width} × {r.height} px · {FORMAT_LABEL[r.format]}
            </p>
            {r.notes.map((n) => {
              const text = noteText(n, r);
              if (!text) return null;
              const warn = WARNING_NOTES.includes(n);
              return (
                <p
                  key={n}
                  className={cx(
                    'mt-1 flex items-start gap-1.5 type-small',
                    warn ? 'text-warning' : 'text-muted',
                  )}
                >
                  {warn ? (
                    <AlertIcon size={20} className="size-4 shrink-0 translate-y-0.5" />
                  ) : (
                    <InfoIcon size={20} className="size-4 shrink-0 translate-y-0.5" />
                  )}
                  <span>{text}</span>
                </p>
              );
            })}
            {showDownload && item.url && (
              <a
                href={item.url}
                download={name}
                data-testid="download"
                onClick={onDownload}
                className={buttonClasses('secondary', 'md', 'mt-3 w-full sm:w-auto')}
              >
                <DownloadIcon size={20} />
                {copy.download(r.outputBytes)}
              </a>
            )}
          </>
        )}

        {status === 'failed' && item.error && (
          <>
            <p className="mt-1 flex items-start gap-1.5 text-danger">
              <AlertIcon size={20} className="mt-0.5 shrink-0" />
              <span>{errorText ?? errorMessage(item.error.code)}</span>
            </p>
            {actions && actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((a) => (
                  <Button key={a.id} variant="secondary" onClick={() => onAction?.(a.id)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
