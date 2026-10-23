'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  EngineNote,
  EngineResult,
  ImageEngine,
  JobHandle,
  ProgressFn,
  ToolDefinition,
} from '@/lib/types';
import { isEngineError } from '@/lib/types';
import { loadEngine } from '@/lib/engine';
import { track } from '@/lib/analytics';
import { siteConfig } from '@/lib/site-config';
import { AdSlot } from '@/components/content/ad-slot';
import { Button } from '@/components/ui/button';
import { buttonClasses } from '@/components/ui/button-styles';
import { ChipGroup } from '@/components/ui/chip-group';
import { AlertIcon, CheckIcon, DownloadIcon, ZipIcon } from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { Toast, type ToastMessage } from '@/components/ui/toast';
import { AdvancedOptions } from './advanced-options';
import { copy, errorMessage } from './copy';
import { ErrorBanner } from './error-banner';
import { FilePicker } from './file-picker';
import { FORMAT_MIME, uniqueNames } from './format';
import { FormatSelect } from './format-select';
import { PrivacyNote } from './privacy-note';
import { ProgressBar } from './progress-bar';
import { QualitySlider } from './quality-slider';
import { ResultCard, type CardAction, type ResultItem } from './result-card';
import { ResultList } from './result-list';
import { ShareButton, canShareFiles } from './share-button';
import { StickyActionBar } from './sticky-action-bar';
import { TargetSizeChips } from './target-size-chips';
import { makeThumbnail } from './thumbnail';
import {
  MAX_WIDTHS,
  SIZE_PRESETS,
  defaultOptions,
  isLossy,
  mergeStored,
  nextTarget,
  readStoredRaw,
  saveOptions,
  type ToolOptions,
} from './tool-options';

const IMAGE_KINDS: readonly ToolDefinition['kind'][] = ['compress-to-size', 'compress', 'convert'];

/**
 * The interactive island on every tool page (DESIGN.md §4.3). Picks its
 * behavior from `tool.kind` and `tool.preset`.
 */
export function ToolShell({ tool }: { tool: ToolDefinition }) {
  if (!IMAGE_KINDS.includes(tool.kind)) {
    return (
      <div
        data-testid="tool-shell"
        data-kind={tool.kind}
        className="rounded-card border border-border bg-surface p-4 text-muted"
      >
        {copy.comingSoon}
      </div>
    );
  }
  return <ImageTool tool={tool} />;
}

type ShellState = 'idle' | 'processing' | 'done' | 'partial' | 'error';
type Notice = 'too-many' | 'webp' | 'engine' | null;
type Verb = 'compress' | 'convert';

const noopSubscribe = () => () => {};

/** Next-step buttons for a failed card (data only; the shell handles the ids). */
function suggestionsFor(item: ResultItem, o: ToolOptions): CardAction[] | undefined {
  const error = item.error;
  if (!error) return undefined;
  if (error.code === 'TARGET_UNREACHABLE') {
    const next = nextTarget(o.targetKB, error.detail?.smallestBytes);
    const actions: CardAction[] = [{ id: `target:${next}`, label: copy.tryTarget(next) }];
    if (o.keepDimensions) actions.push({ id: 'allow-smaller', label: copy.allowSmaller });
    return actions;
  }
  if (error.code === 'ENCODE_UNSUPPORTED') return [{ id: 'use-jpg', label: copy.useJpg }];
  return undefined;
}

let toastSeq = 0;
const nextToastId = () => ++toastSeq;

function isNotImage(file: File): boolean {
  return file.type !== '' && !file.type.startsWith('image/');
}

function isIOS(): boolean {
  const n = navigator;
  return /iP(hone|ad|od)/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
}

function ImageTool({ tool }: { tool: ToolDefinition }) {
  const slug = tool.slug;
  const kind = tool.kind;
  const verb: Verb = kind === 'convert' ? 'convert' : 'compress';
  const maxFiles = siteConfig.maxFiles;
  const inputId = useId();

  // Options: page preset, then remembered values (read after hydration), then user changes.
  const defaults = useMemo(() => defaultOptions(tool), [tool]);
  const storedRaw = useSyncExternalStore(
    noopSubscribe,
    () => readStoredRaw(tool),
    () => null,
  );
  const remembered = useMemo(
    () => mergeStored(tool, defaults, storedRaw),
    [tool, defaults, storedRaw],
  );
  const [userOptions, setUserOptions] = useState<ToolOptions | null>(null);
  const options = userOptions ?? remembered;

  const [items, setItems] = useState<ResultItem[]>([]);
  const [runOpts, setRunOpts] = useState<ToolOptions>(options);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ index: 0, ratio: 0 });
  const [notice, setNotice] = useState<Notice>(null);
  const [needsApply, setNeedsApply] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [zipping, setZipping] = useState(false);
  const shareSupported = useSyncExternalStore(noopSubscribe, canShareFiles, () => false);

  const sourceRef = useRef<File[]>([]);
  const runIdRef = useRef(0);
  const handleRef = useRef<JobHandle<EngineResult> | null>(null);
  const urlsRef = useRef<string[]>([]);
  const savedRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const revokeAll = useCallback(() => {
    for (const u of urlsRef.current) URL.revokeObjectURL(u);
    urlsRef.current = [];
  }, []);

  // Leaving the page: stop work and free memory (never block navigation).
  useEffect(() => {
    const runId = runIdRef;
    const handle = handleRef;
    const timer = timerRef;
    return () => {
      runId.current += 1;
      handle.current?.cancel();
      window.clearTimeout(timer.current);
      revokeAll();
    };
  }, [revokeAll]);

  const usesTarget = (o: ToolOptions) =>
    kind === 'compress-to-size' || (kind === 'compress' && o.mode === 'size');

  function startJob(
    engine: ImageEngine,
    file: File,
    o: ToolOptions,
    onProgress: ProgressFn,
  ): JobHandle<EngineResult> {
    if (usesTarget(o)) {
      return engine.compressToSize(
        file,
        {
          targetKB: o.targetKB,
          format: o.sizeFormat,
          keepDimensions: o.keepDimensions,
          background: o.background,
        },
        onProgress,
      );
    }
    if (kind === 'compress') {
      return engine.compress(
        file,
        { quality: o.quality / 100, format: 'same', maxWidth: o.maxWidth || undefined },
        onProgress,
      );
    }
    return engine.convert(
      file,
      {
        to: o.convertTo,
        quality: isLossy(o.convertTo) ? o.convertQuality / 100 : undefined,
        background: o.background,
      },
      onProgress,
    );
  }

  async function run(files: File[], o: ToolOptions, reason: 'new' | 'rerun') {
    const id = ++runIdRef.current;
    window.clearTimeout(timerRef.current);
    handleRef.current?.cancel();
    handleRef.current = null;
    revokeAll();
    savedRef.current = false;
    setNeedsApply(false);
    setRunOpts(o);

    const initial: ResultItem[] = files.map((file, i) =>
      isNotImage(file)
        ? { id: i, file, status: 'failed', error: { code: 'UNSUPPORTED_FORMAT' } }
        : { id: i, file, status: 'queued' },
    );
    setItems(initial);
    setRunning(true);
    setProgress({ index: 0, ratio: 0 });
    setAnnounce(copy.processing(verb, 1, files.length));

    const update = (i: number, patch: Partial<ResultItem>) =>
      setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));
    const results: (EngineResult | null)[] = files.map(() => null);
    let lastError: ResultItem['error'];

    for (const it of initial) {
      if (it.error) {
        lastError = it.error;
        track('tool_error', { tool: slug, code: it.error.code });
      }
    }

    let engine: ImageEngine;
    try {
      engine = await loadEngine();
    } catch {
      if (id !== runIdRef.current) return;
      setItems([]);
      setRunning(false);
      setNotice('engine');
      setAnnounce(copy.engineLoadFailed);
      track('tool_error', { tool: slug, code: 'ENGINE_LOAD_FAILED' });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      if (id !== runIdRef.current) return;
      if (initial[i].status === 'failed') continue;
      update(i, { status: 'processing' });
      setProgress({ index: i, ratio: 0 });
      const handle = startJob(engine, files[i], o, (p) => {
        if (id === runIdRef.current) setProgress({ index: i, ratio: p.ratio });
      });
      handleRef.current = handle;
      try {
        const r = await handle.promise;
        if (id !== runIdRef.current) return;
        const url = URL.createObjectURL(r.blob);
        urlsRef.current.push(url);
        results[i] = r;
        update(i, { status: 'success', result: r, url });
        void makeThumbnail(r.blob, r.format !== 'jpeg').then((thumb) => {
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
        const error = { code, detail: isEngineError(e) ? e.detail : undefined };
        lastError = error;
        update(i, { status: 'failed', error });
        track('tool_error', { tool: slug, code });
        if (code === 'ENCODE_UNSUPPORTED') setNotice('webp');
      }
    }

    handleRef.current = null;
    setRunning(false);
    setProgress({ index: files.length, ratio: 1 });

    const ok = results.filter((r): r is EngineResult => r !== null);
    if (ok.length > 0) {
      track('tool_success', {
        tool: slug,
        target: usesTarget(o) ? o.targetKB : undefined,
        outcome: ok.length === files.length ? 'success' : 'partial',
      });
    }
    if (files.length === 1) {
      setAnnounce(
        ok[0]
          ? copy.doneSingle(ok[0].outputBytes, ok[0].inputBytes)
          : lastError
            ? errorText(lastError, o)
            : copy.noneWorked,
      );
    } else {
      setAnnounce(ok.length > 0 ? copy.doneMany(ok.length, files.length) : copy.noneWorked);
    }
    if (reason === 'new') {
      const h = headingRef.current;
      h?.focus({ preventScroll: true });
      // Bring the first result into view (heading at the top of the screen).
      h?.scrollIntoView({ block: 'start' });
    }
  }

  function handleFiles(list: File[]) {
    if (running || list.length === 0) return;
    const unsaved = items.some((it) => it.status === 'success') && !savedRef.current;
    if (unsaved && !window.confirm(copy.confirmReplace)) return;
    let files = list;
    if (files.length > maxFiles) {
      files = files.slice(0, maxFiles);
      setNotice('too-many');
    } else {
      setNotice(null);
    }
    sourceRef.current = files;
    track('tool_start', { tool: slug, files: files.length });
    void run(files, options, 'new');
  }

  /** Change options; re-run now for 1–5 files, or offer "Apply" for bigger batches. */
  function updateOptions(patch: Partial<ToolOptions>, immediate = false) {
    const next = { ...options, ...patch };
    setUserOptions(next);
    saveOptions(tool, next);
    const files = sourceRef.current;
    if (files.length === 0) return;
    window.clearTimeout(timerRef.current);
    if (!immediate && files.length > 5) {
      setNeedsApply(true);
      return;
    }
    timerRef.current = window.setTimeout(() => void run(files, next, 'rerun'), immediate ? 0 : 250);
  }

  function switchToJpg() {
    setNotice(null);
    updateOptions(kind === 'convert' ? { convertTo: 'jpeg' } : { sizeFormat: 'jpeg' }, true);
  }

  function errorText(error: NonNullable<ResultItem['error']>, o: ToolOptions): string {
    if (error.code === 'TARGET_UNREACHABLE') {
      const next = nextTarget(o.targetKB, error.detail?.smallestBytes);
      const base = copy.unreachable(o.targetKB, next, o.keepDimensions);
      return error.detail?.smallestBytes
        ? `${base} ${copy.smallestReached(error.detail.smallestBytes)}`
        : base;
    }
    return errorMessage(error.code);
  }

  function onSuggestion(id: string) {
    if (id === 'use-jpg') return switchToJpg();
    if (id === 'allow-smaller') return updateOptions({ keepDimensions: false }, true);
    if (id.startsWith('target:')) {
      const kb = Number(id.slice(7));
      updateOptions(
        { targetKB: kb, custom: !(SIZE_PRESETS as readonly number[]).includes(kb), mode: 'size' },
        true,
      );
    }
  }

  const noteText = (n: EngineNote, r: EngineResult): string | null => {
    switch (n) {
      case 'resized':
        return usesTarget(runOpts)
          ? copy.resizedToTarget(r.width, r.height, runOpts.targetKB)
          : copy.resized(r.width, r.height);
      case 'already-small':
        return copy.alreadySmall(runOpts.targetKB);
      case 'downscaled-for-memory':
        return copy.bigImage;
      case 'transparency-flattened':
        return copy.flattened;
      case 'animation-dropped':
        return copy.animationDropped;
      case 'not-smaller':
        return copy.notSmaller;
      default:
        return null;
    }
  };

  function onDownloaded(kindOf: 'single' | 'zip') {
    savedRef.current = true;
    track('download', { tool: slug, kind: kindOf });
    const ios = isIOS();
    setToast({
      id: nextToastId(),
      text: ios && shareSupported ? copy.savedIos : copy.saved,
      tone: ios ? 'info' : 'success',
    });
  }

  // Unique output names in item order (earlier names never change as later ones arrive).
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
  const state: ShellState = running
    ? 'processing'
    : items.length === 0
      ? 'idle'
      : failedCount === 0
        ? 'done'
        : success.length === 0
          ? 'error'
          : 'partial';
  const flattened = success.some((it) => it.result.notes.includes('transparency-flattened'));

  async function downloadAll() {
    setZipping(true);
    try {
      const engine = await loadEngine();
      const zip = await engine.zip(success.map((it) => ({ name: outName(it), blob: it.result.blob })));
      const url = URL.createObjectURL(zip);
      urlsRef.current.push(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `img-master-${slug}.zip`;
      document.body.append(a);
      a.click();
      a.remove();
      onDownloaded('zip');
    } catch {
      setToast({ id: nextToastId(), text: copy.zipFailed, tone: 'info' });
    } finally {
      setZipping(false);
    }
  }

  const shareFiles = () =>
    success.map(
      (it) => new File([it.result.blob], outName(it), { type: FORMAT_MIME[it.result.format] }),
    );

  const hideToast = useCallback(() => setToast(null), []);

  // ── Option controls per tool kind ───────────────────────────────────
  const sizeMode = usesTarget(options);
  const isHubConverter = kind === 'convert' && tool.preset.from === 'any';

  const targetChips = (
    <TargetSizeChips
      targetKB={options.targetKB}
      custom={options.custom}
      onChange={(kb, custom) => updateOptions({ targetKB: kb, custom })}
    />
  );

  let primary: React.ReactNode = null;
  if (kind === 'compress-to-size') {
    primary = targetChips;
  } else if (kind === 'compress') {
    primary = (
      <div className="grid gap-3">
        <ChipGroup
          label="How to compress"
          hideLabel
          variant="segmented"
          className="[&>div]:flex"
          options={[
            { value: 'size', label: 'Pick a size' },
            { value: 'quality', label: 'Pick a quality' },
          ]}
          value={options.mode}
          onChange={(mode) => updateOptions({ mode })}
        />
        {options.mode === 'size' ? (
          targetChips
        ) : (
          <QualitySlider value={options.quality} onChange={(quality) => updateOptions({ quality })} />
        )}
      </div>
    );
  } else if (isHubConverter) {
    primary = (
      <FormatSelect
        label="Convert to"
        formats={['jpeg', 'png', 'webp'] as const}
        value={options.convertTo}
        onChange={(convertTo) => updateOptions({ convertTo })}
      />
    );
  }

  const advanced: React.ReactNode[] = [];
  if (sizeMode) {
    advanced.push(
      <FormatSelect
        key="format"
        label="Format"
        formats={['jpeg', 'webp'] as const}
        value={options.sizeFormat}
        onChange={(sizeFormat) => updateOptions({ sizeFormat })}
      />,
      <Switch
        key="keep"
        label="Keep original dimensions"
        description="Only lower the quality. The width and height stay the same." // invented
        checked={options.keepDimensions}
        onChange={(keepDimensions) => updateOptions({ keepDimensions })}
      />,
    );
  } else if (kind === 'compress') {
    advanced.push(
      <ChipGroup
        key="maxw"
        label="Max width"
        options={MAX_WIDTHS.map((w) => ({
          value: String(w),
          label: w === 0 ? 'Original' : `${w} px`,
        }))}
        value={String(options.maxWidth)}
        onChange={(v) => updateOptions({ maxWidth: Number(v) })}
      />,
    );
  } else if (kind === 'convert' && isLossy(options.convertTo)) {
    advanced.push(
      <QualitySlider
        key="q"
        value={options.convertQuality}
        onChange={(convertQuality) => updateOptions({ convertQuality })}
      />,
    );
  }

  const noticeBanner =
    notice === 'too-many' ? (
      <ErrorBanner tone="warning" message={copy.tooMany(maxFiles)} />
    ) : notice === 'webp' ? (
      <ErrorBanner message={copy.webpUnsupported} action={{ label: copy.useJpg, onClick: switchToJpg }} />
    ) : notice === 'engine' ? (
      <ErrorBanner
        message={copy.engineLoadFailed}
        action={{ label: copy.reload, onClick: () => window.location.reload() }}
      />
    ) : null;

  const m = items.length;
  const statusSlot = running ? (
    <ProgressBar
      label={copy.processing(verb, Math.min(progress.index + 1, m), m)}
      value={m ? (progress.index + progress.ratio) / m : 0}
    />
  ) : state === 'error' ? (
    <p className="flex items-center gap-2 font-semibold text-danger">
      <AlertIcon size={20} />
      {m === 1 ? copy.failedOne : copy.noneWorked}
    </p>
  ) : m > 0 ? (
    <p className="flex items-center gap-2 font-semibold text-success">
      <CheckIcon size={20} />
      {state === 'done' ? copy.doneBang(m) : copy.doneMany(success.length, m)}
    </p>
  ) : null;

  return (
    <div data-testid="tool-shell" data-kind={kind} data-state={state} className="grid gap-4">
      <FilePicker
        inputId={inputId}
        maxFiles={maxFiles}
        disabled={running}
        onFiles={handleFiles}
        onWarmUp={() => void loadEngine().catch(() => {})}
      />

      {primary}

      <PrivacyNote />

      {noticeBanner}

      {needsApply && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-card border border-primary bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-text">{copy.optionsChanged}</p>
          <Button onClick={() => void run(sourceRef.current, options, 'rerun')}>
            {copy.applyTo(items.length)}
          </Button>
        </div>
      )}

      {m > 0 && (
        <ResultList headingRef={headingRef} status={statusSlot}>
          {items.map((it) => (
            <li key={`${it.id}-${it.file.name}`}>
              <ResultCard
                item={it}
                fileName={nameOf.get(it.id)}
                noteText={noteText}
                errorText={it.error ? errorText(it.error, runOpts) : undefined}
                actions={suggestionsFor(it, runOpts)}
                onAction={onSuggestion}
                showDownload={multi}
                onDownload={() => onDownloaded('single')}
              />
            </li>
          ))}
        </ResultList>
      )}

      <StickyActionBar visible={!running && success.length > 0} reserve={m > 0}>
        {multi ? (
          <Button
            size="lg"
            data-testid="download-all"
            icon={<ZipIcon size={20} />}
            loading={zipping}
            loadingText={copy.preparingZip}
            onClick={() => void downloadAll()}
          >
            {copy.downloadAll(totalOut)}
          </Button>
        ) : single ? (
          <a
            href={single.url}
            download={single.result.fileName}
            data-testid="download"
            onClick={() => onDownloaded('single')}
            className={buttonClasses('primary', 'lg')}
          >
            <DownloadIcon size={20} />
            {copy.download(single.result.outputBytes)}
          </a>
        ) : null}
        <ShareButton
          supported={shareSupported}
          getFiles={shareFiles}
          onShared={() => {
            savedRef.current = true;
            track('share', { tool: slug });
          }}
        />
      </StickyActionBar>

      {flattened && (
        <BackgroundField
          value={options.background}
          onChange={(background) => updateOptions({ background })}
        />
      )}

      {!running && m > 0 && (
        <div>
          <Button
            variant="secondary"
            onClick={() => document.getElementById(inputId)?.click()}
            className="w-full sm:w-auto"
          >
            {copy.again(verb)}
          </Button>
        </div>
      )}

      {advanced.length > 0 && <AdvancedOptions>{advanced}</AdvancedOptions>}

      <AdSlot position="below-results" />


      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}

/** Fill color for transparent areas when saving as JPG (shown only when needed). */
function BackgroundField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4">
      <label htmlFor={id} className="text-text">
        <span className="block font-semibold">{copy.backgroundLabel}</span>
        <span className="block type-small text-muted">{copy.backgroundHint}</span>
      </label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-16 shrink-0 cursor-pointer rounded-control border border-border-strong bg-bg p-1"
      />
    </div>
  );
}
