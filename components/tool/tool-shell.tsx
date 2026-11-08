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
import { SamuraiStage, type SamuraiState, type StageText } from '@/components/samurai/samurai';
import { playSound } from '@/components/sound/sound';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { cx } from '@/components/ui/cx';
import { AlertIcon, ArrowRightIcon, CheckIcon } from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { Toast, type ToastMessage } from '@/components/ui/toast';
import { AdvancedOptions } from './advanced-options';
import { copy, errorMessage } from './copy';
import { ErrorBanner } from './error-banner';
import { FilePicker } from './file-picker';
import { targetText, uniqueNames } from './format';
import { FormatSelect } from './format-select';
import { HERO_FILES_EVENT, HERO_PICK_EVENT, HERO_TOOL_ID } from './hero-bus';
import { PrivacyNote } from './privacy-note';
import { ProgressBar } from './progress-bar';
import { QualitySlider } from './quality-slider';
import { ResizeFormat, ResizePrimary } from './resize-controls';
import { ResultCard, type CardAction, type ResultItem } from './result-card';
import { ResultList } from './result-list';
import { ResultsPlaceholder } from './results-placeholder';
import { canShareFiles } from './share-button';
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
  resizeProblem,
  saveOptions,
  type ToolOptions,
} from './tool-options';

const IMAGE_KINDS: readonly ToolDefinition['kind'][] = ['compress-to-size', 'compress', 'convert', 'resize'];

/**
 * The interactive island on every tool page (DESIGN.md §4.3). Picks its
 * behavior from `tool.kind` and `tool.preset`.
 *
 * `sideTip` — one-line tip shown below the SamuraiStage in the right column (desktop).
 * `variant` — `'hero'` is the compact, single-column card embedded in the home
 * hero (spec §5.1 item 1, §6): no samurai panel, no advanced options. It also
 * answers the home page's hero-bus events (hero-bus.ts) so a CTA or a
 * page-wide drop target can open its picker / feed it files from outside.
 */
export function ToolShell({
  tool,
  sideTip,
  variant = 'page',
}: {
  tool: ToolDefinition;
  sideTip?: string;
  variant?: 'page' | 'hero';
}) {
  if (!IMAGE_KINDS.includes(tool.kind)) {
    return (
      <div
        data-testid="tool-shell"
        data-kind={tool.kind}
        className="rounded-card border border-line bg-paper p-4 text-muted"
      >
        {copy.comingSoon}
      </div>
    );
  }
  return <ImageTool tool={tool} sideTip={sideTip} variant={variant} />;
}

type ShellState = 'idle' | 'processing' | 'done' | 'partial' | 'error';
type Notice = 'too-many' | 'webp' | 'engine' | null;
type Verb = 'compress' | 'convert' | 'resize';

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

/** Inputs that may have transparency (flattened onto a color when saved as JPG). */
function mayHaveAlpha(file: File): boolean {
  return /^image\/(png|webp|gif|avif)$/.test(file.type);
}

function isIOS(): boolean {
  const n = navigator;
  return /iP(hone|ad|od)/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
}

function ImageTool({
  tool,
  sideTip,
  variant = 'page',
}: {
  tool: ToolDefinition;
  sideTip?: string;
  variant?: 'page' | 'hero';
}) {
  const slug = tool.slug;
  const kind = tool.kind;
  const hero = variant === 'hero';
  const verb: Verb = kind === 'convert' ? 'convert' : kind === 'resize' ? 'resize' : 'compress';
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
  // Resize: a file was picked while the size fields were not valid yet.
  const [waiting, setWaiting] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [zipping, setZipping] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
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
    if (kind === 'resize') {
      const common = { format: o.resizeFormat, quality: 0.9, background: o.background };
      return engine.resize(
        file,
        o.resizeBy === 'percent'
          ? { ...common, percent: o.percent }
          : {
              ...common,
              width: o.width > 0 ? o.width : undefined,
              height: o.height > 0 ? o.height : undefined,
              keepRatio: o.keepRatio,
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
    setWaiting(false);
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
          ? kind === 'resize'
            ? copy.resizeDoneLive(ok[0].width, ok[0].height, ok[0].outputBytes)
            : copy.doneSingle(ok[0].outputBytes, ok[0].inputBytes)
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
    if (kind === 'resize' && resizeProblem(options)) {
      // Keep the files; the hint under the size fields says what to fix.
      setWaiting(true);
      return;
    }
    track('tool_start', { tool: slug, files: files.length });
    void run(files, options, 'new');
  }

  /** "No image? Try a sample": draws a sample photo on-device, then runs it like a real pick. */
  async function trySample() {
    if (running || sampleLoading) return;
    setSampleLoading(true);
    try {
      const { makeSampleImage } = await import('@/lib/image-engine/sample');
      const file = await makeSampleImage();
      handleFiles([file]);
    } catch {
      setToast({ id: nextToastId(), text: copy.sampleFailed, tone: 'info' });
    } finally {
      setSampleLoading(false);
    }
  }

  // Always-fresh ref so the hero-bus listeners below call the latest handleFiles
  // (closing over the current `running`/`options`) without re-subscribing.
  const handleFilesRef = useRef(handleFiles);
  useEffect(() => {
    handleFilesRef.current = handleFiles;
  });

  // Hero card only: let the home page's CTA band and page-wide drop target feed
  // this tool from outside React (hero-bus.ts).
  useEffect(() => {
    if (!hero) return;
    function onPick() {
      // Scroll the card into view first (the CTA band and page-wide drop target
      // can both be scrolled away from it), then open the picker.
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      document
        .getElementById(HERO_TOOL_ID)
        ?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      document.getElementById(inputId)?.click();
    }
    function onFiles(e: Event) {
      const files = (e as CustomEvent<File[]>).detail;
      if (files && files.length > 0) handleFilesRef.current(files);
    }
    window.addEventListener(HERO_PICK_EVENT, onPick);
    window.addEventListener(HERO_FILES_EVENT, onFiles);
    return () => {
      window.removeEventListener(HERO_PICK_EVENT, onPick);
      window.removeEventListener(HERO_FILES_EVENT, onFiles);
    };
  }, [hero, inputId]);

  /** Change options; re-run now for 1–5 files, or offer "Apply" for bigger batches. */
  function updateOptions(patch: Partial<ToolOptions>, immediate = false) {
    const next = { ...options, ...patch };
    setUserOptions(next);
    saveOptions(tool, next);
    const files = sourceRef.current;
    if (files.length === 0) return;
    window.clearTimeout(timerRef.current);
    if (kind === 'resize' && resizeProblem(next)) {
      setNeedsApply(false);
      return;
    }
    if (!immediate && files.length > 5) {
      setNeedsApply(true);
      return;
    }
    const again = items.length === 0 ? 'new' : 'rerun';
    timerRef.current = window.setTimeout(() => void run(files, next, again), immediate ? 0 : 250);
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
    if (error.code === 'INVALID_OPTIONS' && error.detail?.width && error.detail.height) {
      return copy.resizeTooBig(error.detail.width, error.detail.height);
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
        if (kind === 'resize') return null;
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
  const totalOut = success.reduce((s, it) => s + it.result.outputBytes, 0);
  const totalIn = success.reduce((s, it) => s + it.result.inputBytes, 0);
  const state: ShellState = running
    ? 'processing'
    : items.length === 0
      ? 'idle'
      : failedCount === 0
        ? 'done'
        : success.length === 0
          ? 'error'
          : 'partial';
  // Sword sounds follow the shell's state (no-ops unless the visitor turned sound on).
  useEffect(() => {
    if (state === 'processing') playSound('start');
    else if (state === 'done' || state === 'partial') playSound('success');
    else if (state === 'error') playSound('error');
  }, [state]);

  const flattened = success.some((it) => it.result.notes.includes('transparency-flattened'));

  // Space held from the moment processing starts, so nothing below the tool
  // moves when results land (DESIGN.md §8, CLS < 0.05).
  const outputsJpegFor = (o: ToolOptions) =>
    usesTarget(o)
      ? o.sizeFormat === 'jpeg'
      : kind === 'resize'
        ? o.resizeFormat === 'jpeg'
        : kind === 'convert' && o.convertTo === 'jpeg';
  const outputsJpeg = outputsJpegFor(runOpts);
  const mayFlatten = outputsJpeg && items.some((it) => mayHaveAlpha(it.file));
  const reserveFor = (it: ResultItem) => ({
    // Size targets usually add a note ("Resized to…", "Already under…").
    note: usesTarget(runOpts) || (outputsJpeg && mayHaveAlpha(it.file)),
  });

  async function downloadAll() {
    setZipping(true);
    try {
      const engine = await loadEngine();
      const zip = await engine.zip(
        success.map((it) => ({ name: outName(it), blob: it.result.blob })),
      );
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

  const hideToast = useCallback(() => setToast(null), []);

  // ── Option controls per tool kind ───────────────────────────────────
  const sizeMode = usesTarget(options);
  const isHubConverter = kind === 'convert' && tool.preset.from === 'any';

  const targetChips = (
    <TargetSizeChips
      targetKB={options.targetKB}
      custom={options.custom}
      onChange={(kb, custom) => updateOptions({ targetKB: kb, custom })}
      hideLabel={hero}
    />
  );

  let primary: React.ReactNode = null;
  if (kind === 'resize') {
    primary = <ResizePrimary options={options} onChange={updateOptions} waiting={waiting} />;
  } else if (kind === 'compress-to-size') {
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
          <QualitySlider
            value={options.quality}
            onChange={(quality) => updateOptions({ quality })}
          />
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
  if (kind === 'resize') {
    advanced.push(
      <ResizeFormat
        key="rformat"
        value={options.resizeFormat}
        onChange={(resizeFormat) => updateOptions({ resizeFormat })}
      />,
    );
  } else if (sizeMode) {
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
      <ErrorBanner
        message={copy.webpUnsupported}
        action={{ label: copy.useJpg, onClick: switchToJpg }}
      />
    ) : notice === 'engine' ? (
      <ErrorBanner
        message={copy.engineLoadFailed}
        action={{ label: copy.reload, onClick: () => window.location.reload() }}
      />
    ) : null;

  const m = items.length;
  const statusLine = running ? (
    <ProgressBar
      label={copy.processing(verb, Math.min(progress.index + 1, m), m)}
      value={m ? (progress.index + progress.ratio) / m : 0}
    />
  ) : state === 'error' ? (
    <p className="flex items-center gap-2 font-semibold text-accent-strong">
      <AlertIcon size={20} />
      {m === 1 ? copy.failedOne : copy.noneWorked}
    </p>
  ) : m > 0 ? (
    <p className="flex items-center gap-2 font-semibold text-ink">
      <CheckIcon size={20} />
      {state === 'done' ? copy.doneBang(m) : copy.doneMany(success.length, m)}
    </p>
  ) : null;
  // Batches: one "Download all (ZIP)" under the heading. Its slot is held from
  // the start of processing, so the button appearing moves nothing.
  const statusSlot =
    m > 1 ? (
      <>
        <div className="min-h-11">{statusLine}</div>
        <div className="mt-3 min-h-[52px]">
          {!running && multi && (
            <Button
              size="lg"
              data-testid="download-all"
              loading={zipping}
              loadingText={copy.preparingZip}
              onClick={() => void downloadAll()}
            >
              {copy.downloadAll(totalOut)}
            </Button>
          )}
        </div>
      </>
    ) : (
      statusLine
    );
  const onShared = () => {
    savedRef.current = true;
    track('share', { tool: slug });
  };

  const smallerKB = sizeMode
    ? [...SIZE_PRESETS].reverse().find((p) => p < options.targetKB)
    : undefined;

  const stageState: SamuraiState =
    state === 'processing'
      ? 'cutting'
      : state === 'done' || state === 'partial'
        ? 'done'
        : state === 'error'
          ? 'error'
          : 'idle';

  const stageText: StageText = (() => {
    switch (stageState) {
      case 'cutting':
        return {
          ...copy.stage.cutting,
          line: copy.stage.cuttingLine(usesTarget(runOpts) ? targetText(runOpts.targetKB) : undefined),
        };
      case 'done':
        return { ...copy.stage.done, line: copy.stage.doneLine(success.length, totalIn, totalOut) };
      case 'error':
        return copy.stage.error;
      default:
        return kind === 'convert' ? copy.stage.idleConvert : copy.stage.idle;
    }
  })();

  // "1 Target size" above the chips, step 2 is the drop zone's own `step` prop.
  const stepLabel = hero && usesTarget(options) ? (
    <p className="flex items-center gap-2 type-small font-bold text-ink">
      <span aria-hidden="true" className="text-muted">
        1
      </span>
      {copy.stepTarget}
    </p>
  ) : null;

  return (
    <div
      id={hero ? HERO_TOOL_ID : undefined}
      data-testid="tool-shell"
      data-kind={kind}
      data-state={state}
      className={
        hero
          ? 'relative grid gap-3 overflow-clip rounded-card border border-line bg-card p-4 sm:p-5 [&>*]:min-w-0'
          : // Two columns only from lg (spec §5.2: "Two columns ≥ lg"); below that,
            // everything stacks in document order (samurai row, chips, drop zone),
            // matching the mobile anatomy, which has no separate tablet treatment.
            'relative -mx-4 grid gap-3 overflow-clip border-y border-line bg-card px-4 py-3 lg:mx-0 lg:grid-cols-[1fr_auto] lg:gap-5 lg:rounded-card lg:border lg:p-5 [&>*]:min-w-0'
      }
    >
      {!hero && (
        // lg:max-w caps this column's own intrinsic (max-content) width: without
        // it, the Tip card's unwrapped sentence forces the "auto" grid track to
        // blow up and take width the chips/drop-zone column needs.
        <div className="lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:max-w-[320px] lg:self-start grid gap-3">
          <SamuraiStage
            state={stageState}
            text={stageText}
          />
          {/* Spec §5.2's mobile anatomy has no Tip card — only the compact status row. */}
          {sideTip && (
            <div className="hidden rounded-card border border-line bg-card p-4 lg:block">
              <p className="type-eyebrow text-kin-text font-bold mb-1">TIP</p>
              <p className="type-body text-muted">{sideTip}</p>
            </div>
          )}
        </div>
      )}

      <div
        className={cx(
          'grid gap-3 lg:gap-4 [&>*]:min-w-0',
          !hero && 'lg:col-start-1 lg:row-start-1',
        )}
      >
        {primary !== null && (
          <div className={running ? 'opacity-25 transition-opacity' : undefined}>
            {hero ? (
              <div className="grid gap-2">
                {stepLabel}
                {primary}
              </div>
            ) : (
              primary
            )}
          </div>
        )}

        {noticeBanner}

        {needsApply && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-card border border-shu bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-ink">{copy.optionsChanged}</p>
            <Button onClick={() => void run(sourceRef.current, options, 'rerun')}>
              {copy.applyTo(items.length)}
            </Button>
          </div>
        )}

        {/* Results replace the picker as soon as a run starts (no layout shift when it ends); the file input stays mounted (hidden) for "Compress another". */}
        <div className={m > 0 ? 'hidden' : undefined}>
          <FilePicker
            inputId={inputId}
            disabled={running}
            onFiles={handleFiles}
            onWarmUp={() => void loadEngine().catch(() => {})}
            label={kind === 'convert' ? copy.pickerButtonFormat('images') : copy.pickerButton}
            title={kind === 'convert' ? copy.dropHereFormat('images') : copy.dropHere}
            mobileTitle={copy.tapToChoose}
            hint={copy.pickerHintDesktop(siteConfig.maxFiles)}
            mobileHint={copy.pickerHintMobile(siteConfig.maxFiles)}
            step={hero ? '2' : undefined}
            variant={hero ? 'hero' : 'page'}
          />
        </div>

        <div className={m > 0 ? 'hidden' : undefined}>
          <PrivacyNote />
        </div>

        {/* Spec order (§5.2, both mobile and desktop): drop zone, then "More
            options", then the privacy line. Stays visible after a run (not
            inside the picker's hidden wrapper) so options stay editable. */}
        {!hero && advanced.length > 0 && (
          <div className={running ? 'opacity-25 transition-opacity' : undefined}>
            <AdvancedOptions>{advanced}</AdvancedOptions>
          </div>
        )}

        <div className={m > 0 ? 'hidden' : undefined}>
          <SampleLink loading={sampleLoading} onClick={() => void trySample()} />
        </div>

        <div className="grid gap-4 [&>*]:min-w-0">
          {m > 0 ? (
            <>
              <div className="im-anim animate-[im-fade-in_150ms_ease-out]">
                <ResultList
                  headingRef={headingRef}
                  status={statusSlot}
                  tone={state === 'processing' ? 'processing' : state === 'error' ? 'error' : state === 'partial' ? 'partial' : 'done'}
                >
                  {items.map((it) => (
                    <li key={`${it.id}-${it.file.name}`}>
                      <ResultCard
                        item={it}
                        fileName={nameOf.get(it.id)}
                        noteText={noteText}
                        errorText={it.error ? errorText(it.error, runOpts) : undefined}
                        actions={suggestionsFor(it, runOpts)}
                        onAction={onSuggestion}
                        onDownload={() => onDownloaded('single')}
                        shareSupported={shareSupported}
                        onShared={onShared}
                        reserve={reserveFor(it)}
                        resize={kind === 'resize'}
                      />
                    </li>
                  ))}
                </ResultList>
              </div>
              {(flattened || mayFlatten) && (
                <BackgroundField
                  value={options.background}
                  onChange={(background) => updateOptions({ background })}
                />
              )}
              {/* Present (but hidden) while processing, so it doesn't push content down when done. */}
              <div
                className={cx(
                  'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4',
                  running && 'invisible',
                )}
                aria-hidden={running || undefined}
              >
                <Button
                  variant="outline"
                  disabled={running}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  {copy.again(verb)}
                </Button>
                {smallerKB !== undefined && (
                  <p className="type-small text-muted">
                    Need it even smaller?{' '}
                    <button
                      type="button"
                      disabled={running}
                      onClick={() => updateOptions({ targetKB: smallerKB, custom: false })}
                      className="min-h-12 font-bold text-accent underline-offset-4 hover:underline"
                    >
                      Try {targetText(smallerKB)} →
                    </button>
                  </p>
                )}
              </div>
            </>
          ) : (
            <ResultsPlaceholder />
          )}
        </div>

        <AdSlot position="below-results" />

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announce}
        </div>
        <Toast message={toast} onDone={hideToast} />
      </div>
    </div>
  );
}

/** "No image? Try a sample →" (copy.sample / copy.sampleMobile). Disables itself while loading. */
function SampleLink({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="try-sample"
      disabled={loading}
      onClick={onClick}
      className="inline-flex min-h-12 items-center gap-1.5 self-start font-bold text-accent underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="md:hidden">{copy.sampleMobile}</span>
      <span className="hidden md:inline">{copy.sample}</span>
      <ArrowRightIcon size={16} aria-hidden="true" />
    </button>
  );
}

/** Fill color for transparent areas when saving as JPG (shown only when needed). */
function BackgroundField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-paper p-4">
      <label htmlFor={id} className="text-ink">
        <span className="block font-semibold">{copy.backgroundLabel}</span>
        <span className="block type-small text-muted">{copy.backgroundHint}</span>
      </label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-16 shrink-0 cursor-pointer rounded-control border border-line-strong bg-paper p-1"
      />
    </div>
  );
}
