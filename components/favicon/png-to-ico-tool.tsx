'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { EngineResult, ImageEngine, JobHandle, ToolDefinition } from '@/lib/types';
import { isEngineError } from '@/lib/types';
import { loadEngine } from '@/lib/engine';
import { track } from '@/lib/analytics';
import { siteConfig } from '@/lib/site-config';
import { AdSlot } from '@/components/content/ad-slot';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-styles';
import { AlertIcon, CheckIcon, DownloadIcon, ZipIcon } from '@/components/ui/icons';
import { Toast, type ToastMessage } from '@/components/ui/toast';
import { copy as toolCopy } from '@/components/tool/copy';
import { ErrorBanner } from '@/components/tool/error-banner';
import { FilePicker } from '@/components/tool/file-picker';
import { formatBytes, uniqueNames } from '@/components/tool/format';
import { PrivacyNote } from '@/components/tool/privacy-note';
import { ProgressBar } from '@/components/tool/progress-bar';
import { ResultCard, type ResultItem } from '@/components/tool/result-card';
import { ResultList } from '@/components/tool/result-list';
import { StickyActionBar } from '@/components/tool/sticky-action-bar';
import { makeThumbnail } from '@/components/tool/thumbnail';
import { faviconCopy as t } from './copy';
import { isIOS, saveBlob } from './save-blob';

type Notice = 'too-many' | 'engine' | null;

let toastSeq = 0;

const isPng = (f: File) => f.type === 'image/png' || (f.type === '' && /\.png$/i.test(f.name));

/** PNG → .ico converter (CONTRACTS.md §5): one result card per file, same pattern as converters. */
export function PngToIcoTool({ tool }: { tool: ToolDefinition }) {
  const slug = tool.slug;
  const maxFiles = siteConfig.maxFiles;
  const inputId = useId();

  const [items, setItems] = useState<ResultItem[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ index: 0, ratio: 0 });
  const [notice, setNotice] = useState<Notice>(null);
  const [announce, setAnnounce] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [zipping, setZipping] = useState(false);

  const runIdRef = useRef(0);
  const handleRef = useRef<JobHandle<EngineResult> | null>(null);
  const urlsRef = useRef<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const revokeAll = useCallback(() => {
    for (const u of urlsRef.current) URL.revokeObjectURL(u);
    urlsRef.current = [];
  }, []);

  // Leaving the page: stop work and free memory.
  useEffect(() => {
    const runId = runIdRef;
    const handle = handleRef;
    return () => {
      runId.current += 1;
      handle.current?.cancel();
      revokeAll();
    };
  }, [revokeAll]);

  async function run(files: File[]) {
    const id = ++runIdRef.current;
    handleRef.current?.cancel();
    handleRef.current = null;
    revokeAll();

    const initial: ResultItem[] = files.map((file, i) =>
      isPng(file)
        ? { id: i, file, status: 'queued' }
        : { id: i, file, status: 'failed', error: { code: 'UNSUPPORTED_FORMAT' } },
    );
    setItems(initial);
    setRunning(true);
    setProgress({ index: 0, ratio: 0 });
    setAnnounce(toolCopy.processing('convert', 1, files.length));
    for (const it of initial) {
      if (it.error) track('tool_error', { tool: slug, code: it.error.code });
    }

    const update = (i: number, patch: Partial<ResultItem>) =>
      setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

    let engine: ImageEngine;
    try {
      engine = await loadEngine();
    } catch {
      if (id !== runIdRef.current) return;
      setItems([]);
      setRunning(false);
      setNotice('engine');
      setAnnounce(toolCopy.engineLoadFailed);
      track('tool_error', { tool: slug, code: 'ENGINE_LOAD_FAILED' });
      return;
    }

    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      if (id !== runIdRef.current) return;
      if (initial[i].status === 'failed') continue;
      update(i, { status: 'processing' });
      setProgress({ index: i, ratio: 0 });
      const handle = engine.pngToIco(files[i]);
      handleRef.current = handle;
      try {
        const r = await handle.promise;
        if (id !== runIdRef.current) return;
        const url = URL.createObjectURL(r.blob);
        urlsRef.current.push(url);
        ok += 1;
        update(i, { status: 'success', result: r, url });
        // ICO files don't decode everywhere, so the thumbnail comes from the source PNG.
        void makeThumbnail(files[i], true).then((thumb) => {
          if (!thumb) return;
          if (id !== runIdRef.current) {
            URL.revokeObjectURL(thumb);
            return;
          }
          urlsRef.current.push(thumb);
          update(i, { thumb });
        });
      } catch (e) {
        if (id !== runIdRef.current) return;
        const code: NonNullable<ResultItem['error']>['code'] = isEngineError(e)
          ? e.code
          : 'UNKNOWN';
        update(i, { status: 'failed', error: { code } });
        track('tool_error', { tool: slug, code });
      }
    }

    handleRef.current = null;
    setRunning(false);
    setProgress({ index: files.length, ratio: 1 });
    if (ok > 0) {
      track('tool_success', {
        tool: slug,
        outcome: ok === files.length ? 'success' : 'partial',
      });
    }
    setAnnounce(
      ok === files.length
        ? t.icoDoneAnnounce(ok)
        : ok > 0
          ? toolCopy.doneMany(ok, files.length)
          : toolCopy.noneWorked,
    );
    const h = headingRef.current;
    h?.focus({ preventScroll: true });
    h?.scrollIntoView({ block: 'start' });
  }

  function handleFiles(list: File[]) {
    if (running || list.length === 0) return;
    let files = list;
    if (files.length > maxFiles) {
      files = files.slice(0, maxFiles);
      setNotice('too-many');
    } else {
      setNotice(null);
    }
    track('tool_start', { tool: slug, files: files.length });
    void run(files);
  }

  function onDownloaded(kind: 'single' | 'zip') {
    track('download', { tool: slug, kind });
    setToast({
      id: ++toastSeq,
      text: isIOS() ? t.savedIos : toolCopy.saved,
      tone: isIOS() ? 'info' : 'success',
    });
  }

  // Unique output names in item order.
  const named = items.filter(
    (it): it is ResultItem & { result: EngineResult } => it.status === 'success' && !!it.result,
  );
  const uniq = uniqueNames(named.map((it) => it.result.fileName));
  const nameOf = new Map(named.map((it, k) => [it.id, uniq[k]]));
  const outName = (it: ResultItem & { result: EngineResult }) =>
    nameOf.get(it.id) ?? it.result.fileName;

  const success = items.filter(
    (it): it is ResultItem & { result: EngineResult; url: string } =>
      it.status === 'success' && !!it.result && !!it.url,
  );
  const failedCount = items.filter((it) => it.status === 'failed').length;
  const multi = success.length > 1;
  const single = success.length === 1 ? success[0] : undefined;
  const totalOut = success.reduce((s, it) => s + it.result.outputBytes, 0);
  const m = items.length;
  const state = running
    ? 'processing'
    : m === 0
      ? 'idle'
      : failedCount === 0
        ? 'done'
        : success.length === 0
          ? 'error'
          : 'partial';

  async function downloadAll() {
    setZipping(true);
    try {
      const engine = await loadEngine();
      const zip = await engine.zip(
        success.map((it) => ({ name: outName(it), blob: it.result.blob })),
      );
      saveBlob(zip, `img-master-${slug}.zip`);
      onDownloaded('zip');
    } catch {
      setToast({ id: ++toastSeq, text: toolCopy.zipFailed, tone: 'info' });
    } finally {
      setZipping(false);
    }
  }

  const hideToast = useCallback(() => setToast(null), []);

  const noteText = () => null;
  const summaryFor = (r: EngineResult) => t.icoSummary(formatBytes(r.outputBytes));
  const metaFor = (r: EngineResult) => t.icoSizes(r.width >= 256);

  const statusSlot = running ? (
    <ProgressBar
      label={toolCopy.processing('convert', Math.min(progress.index + 1, m), m)}
      value={m ? (progress.index + progress.ratio) / m : 0}
    />
  ) : state === 'error' ? (
    <p className="flex items-center gap-2 font-semibold text-danger">
      <AlertIcon size={20} />
      {m === 1 ? toolCopy.failedOne : toolCopy.noneWorked}
    </p>
  ) : m > 0 ? (
    <p className="flex items-center gap-2 font-semibold text-success">
      <CheckIcon size={20} />
      {state === 'done' ? t.icoDone(m) : toolCopy.doneMany(success.length, m)}
    </p>
  ) : null;

  return (
    <div
      data-testid="favicon-shell"
      data-kind={tool.kind}
      data-state={state}
      className="grid gap-4 [&>*]:min-w-0"
    >
      <FilePicker
        inputId={inputId}
        maxFiles={maxFiles}
        disabled={running}
        onFiles={handleFiles}
        onWarmUp={() => void loadEngine().catch(() => {})}
        accept="image/png,.png"
        label={t.icoPick}
        hint={t.icoHint(maxFiles)}
        desktopHint={t.icoHintDesktop}
      />

      <PrivacyNote />

      {notice === 'too-many' && <ErrorBanner tone="warning" message={toolCopy.tooMany(maxFiles)} />}
      {notice === 'engine' && (
        <ErrorBanner
          message={toolCopy.engineLoadFailed}
          action={{ label: toolCopy.reload, onClick: () => window.location.reload() }}
        />
      )}

      {/* Held tall enough for one finished card, so results replace the note in place. */}
      <div className="grid min-h-[300px] content-start gap-4">
        {m > 0 ? (
          <>
            <ResultList headingRef={headingRef} status={statusSlot}>
              {items.map((it) => (
                <li key={`${it.id}-${it.file.name}`}>
                  <ResultCard
                    item={it}
                    fileName={nameOf.get(it.id)}
                    noteText={noteText}
                    summary={it.result ? summaryFor(it.result) : undefined}
                    meta={it.result ? metaFor(it.result) : undefined}
                    errorText={it.error?.code === 'UNSUPPORTED_FORMAT' ? t.icoNeedPng : undefined}
                    showDownload={multi}
                    onDownload={() => onDownloaded('single')}
                    reserve={{ note: false, download: m > 1 }}
                  />
                </li>
              ))}
            </ResultList>
            <StickyActionBar visible={!running && success.length > 0} reserve>
              {multi ? (
                <Button
                  size="lg"
                  data-testid="download-all"
                  icon={<ZipIcon size={20} />}
                  loading={zipping}
                  loadingText={toolCopy.preparingZip}
                  onClick={() => void downloadAll()}
                >
                  {toolCopy.downloadAll(totalOut)}
                </Button>
              ) : single ? (
                <a
                  href={single.url}
                  download={outName(single)}
                  data-testid="download"
                  onClick={() => onDownloaded('single')}
                  className={buttonClasses('primary', 'lg')}
                >
                  <DownloadIcon size={20} />
                  {toolCopy.download(single.result.outputBytes)}
                </a>
              ) : null}
            </StickyActionBar>
            <div className={running ? 'invisible' : undefined} aria-hidden={running || undefined}>
              <Button
                variant="secondary"
                disabled={running}
                onClick={() => document.getElementById(inputId)?.click()}
                className="w-full sm:w-auto"
              >
                {t.icoAnother}
              </Button>
            </div>
          </>
        ) : (
          <div
            data-testid="results-placeholder"
            className="flex min-h-[300px] items-start justify-center rounded-card border border-dashed border-border-strong/60 px-4 pt-10 text-center"
          >
            <p className="text-muted">{t.icoPlaceholder}</p>
          </div>
        )}
      </div>

      <AdSlot position="below-results" />

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
