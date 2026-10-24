'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { FaviconPackage, FaviconSource, JobHandle, ToolDefinition } from '@/lib/types';
import { isEngineError } from '@/lib/types';
import { loadEngine } from '@/lib/engine';
import { track } from '@/lib/analytics';
import { AdSlot } from '@/components/content/ad-slot';
import { SamuraiStage } from '@/components/samurai/samurai-stage';
import { Button } from '@/components/ui/button';
import { Toast, type ToastMessage } from '@/components/ui/toast';
import { copy as toolCopy, errorMessage } from '@/components/tool/copy';
import { ErrorBanner } from '@/components/tool/error-banner';
import { FilePicker } from '@/components/tool/file-picker';
import { PrivacyNote } from '@/components/tool/privacy-note';
import { faviconCopy as t } from './copy';
import { cutReducer, initialCut } from './cut-moment';
import { CutMoment } from './cut-moment-overlay';
import { FaviconControls } from './favicon-controls';
import { FaviconModeTabs } from './favicon-mode-tabs';
import {
  buildSource,
  defaultFaviconOptions,
  mergeStored,
  modeForTool,
  readStoredRaw,
  saveOptions,
  type FaviconMode,
  type FaviconOptions,
} from './favicon-options';
import { FaviconPreview } from './favicon-preview';
import { PngToIcoTool } from './png-to-ico-tool';
import { isIOS, revokePackage, saveBlob } from './save-blob';
import { SnippetBlock } from './snippet-block';

const noopSubscribe = () => () => {};
const DEBOUNCE_MS = 150;
const ANNOUNCE_MS = 700;

let toastSeq = 0;

/**
 * The favicon island (DESIGN.md §4.4, CONTRACTS.md §5). Each page opens on its
 * own mode: favicon-image, favicon-text, favicon-emoji; `png-to-ico` is a
 * converter with result cards.
 */
export function FaviconShell({ tool }: { tool: ToolDefinition }) {
  if (tool.kind === 'png-to-ico') return <PngToIcoTool tool={tool} />;
  return <FaviconMaker tool={tool} />;
}

interface Made {
  source: FaviconSource;
  pkg: FaviconPackage;
}
interface Failed {
  source: FaviconSource;
  message: string;
  engine: boolean;
}

function FaviconMaker({ tool }: { tool: ToolDefinition }) {
  const slug = tool.slug;
  const inputId = useId();

  // Options: defaults, then remembered values (read after hydration), then user changes.
  const defaults = useMemo(() => defaultFaviconOptions(), []);
  const storedRaw = useSyncExternalStore(
    noopSubscribe,
    () => readStoredRaw(tool),
    () => null,
  );
  const remembered = useMemo(() => mergeStored(defaults, storedRaw), [defaults, storedRaw]);
  const [userOptions, setUserOptions] = useState<FaviconOptions | null>(null);
  const options = userOptions ?? remembered;

  const [mode, setMode] = useState<FaviconMode>(() => modeForTool(tool));
  const [file, setFile] = useState<File | null>(null);
  const [made, setMade] = useState<Made | null>(null);
  const [failed, setFailed] = useState<Failed | null>(null);
  const [announce, setAnnounce] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [zipping, setZipping] = useState(false);

  const [cut, dispatchCut] = useReducer(cutReducer, mode, initialCut);
  const [donePlays, setDonePlays] = useState(0);

  const startedRef = useRef(false);
  const succeededRef = useRef(false);
  const announceTimer = useRef<number | undefined>(undefined);
  const announceFlip = useRef(false);
  const waitersRef = useRef<((pkg: FaviconPackage | null) => void)[]>([]);

  const source = useMemo(() => buildSource(mode, options, file), [mode, options, file]);

  // Derived state: a result belongs to the source it was made for.
  const shown = made && made.source.mode === mode ? made : null;
  const failure = failed && failed.source === source ? failed : null;
  const busy = source !== null && made?.source !== source && !failure;
  const pkg = source === null ? null : (shown?.pkg ?? null);
  const canDownload = pkg !== null && source !== null;

  // Free the previous package's preview URLs when it is replaced, and on unmount.
  useEffect(() => {
    const p = made?.pkg;
    return () => {
      if (p) revokePackage(p);
    };
  }, [made]);

  useEffect(() => {
    const timer = announceTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  // Live preview: debounce, cancel the previous job, ignore stale results.
  useEffect(() => {
    const flush = (p: FaviconPackage | null) => {
      for (const resolve of waitersRef.current.splice(0)) resolve(p);
    };
    if (!source) {
      flush(null);
      return;
    }
    let live = true;
    let handle: JobHandle<FaviconPackage> | null = null;
    const timer = window.setTimeout(() => {
      void (async () => {
        let engine;
        try {
          engine = await loadEngine();
        } catch {
          if (!live) return;
          setFailed({ source, message: toolCopy.engineLoadFailed, engine: true });
          track('tool_error', { tool: slug, code: 'ENGINE_LOAD_FAILED' });
          flush(null);
          return;
        }
        if (!live) return;
        handle = engine.makeFavicons(source);
        try {
          const next = await handle.promise;
          if (!live) {
            revokePackage(next);
            return;
          }
          setMade({ source, pkg: next });
          flush(next);
          if (startedRef.current && !succeededRef.current) {
            succeededRef.current = true;
            track('tool_success', { tool: slug, outcome: 'success' });
          }
          if (startedRef.current) {
            window.clearTimeout(announceTimer.current);
            announceTimer.current = window.setTimeout(() => {
              announceFlip.current = !announceFlip.current;
              setAnnounce(t.previewUpdated + (announceFlip.current ? '' : ' '));
            }, ANNOUNCE_MS);
          }
        } catch (e) {
          if (!live) return;
          if (isEngineError(e) && e.code === 'CANCELLED') return;
          const code = isEngineError(e) ? e.code : 'UNKNOWN';
          setFailed({
            source,
            message: isEngineError(e) ? errorMessage(e.code) : t.previewFailed,
            engine: false,
          });
          track('tool_error', { tool: slug, code });
          flush(null);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
      handle?.cancel();
    };
  }, [source, slug]);

  // A new package may start the cut moment (the reducer decides).
  useEffect(() => {
    if (made) dispatchCut({ type: 'built' });
  }, [made]);

  // Start loading the engine early on the pages that preview right away.
  useEffect(() => {
    void loadEngine().catch(() => {});
  }, []);

  function markStarted(files: number) {
    if (startedRef.current) return;
    startedRef.current = true;
    track('tool_start', { tool: slug, files });
  }

  function change<M extends FaviconMode>(m: M, patch: Partial<FaviconOptions[M]>) {
    const next: FaviconOptions = { ...options, [m]: { ...options[m], ...patch } };
    setUserOptions(next);
    dispatchCut({ type: 'edit' });
    saveOptions(tool, next);
    markStarted(0);
  }

  function pickFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    dispatchCut({ type: 'file' });
    startedRef.current = false;
    succeededRef.current = false;
    markStarted(1);
  }

  function switchMode(m: FaviconMode) {
    setMode(m);
    dispatchCut({ type: 'mode', mode: m });
  }

  const hideToast = useCallback(() => setToast(null), []);

  function onDownloaded(kind: 'zip' | 'single') {
    track('download', { tool: slug, kind });
    setToast({
      id: ++toastSeq,
      text: isIOS() ? t.savedIos : t.saved,
      tone: isIOS() ? 'info' : 'success',
    });
  }

  /** The newest package; waits for the render in progress so a download is never stale. */
  function freshPackage(): Promise<FaviconPackage | null> {
    if (busy) return new Promise((resolve) => waitersRef.current.push(resolve));
    return Promise.resolve(pkg);
  }

  async function downloadZip() {
    setZipping(true);
    try {
      const p = await freshPackage();
      if (!p) throw new Error('no package');
      const engine = await loadEngine();
      saveBlob(await engine.zip(p.files), 'favicon-package.zip');
      onDownloaded('zip');
    } catch {
      setToast({ id: ++toastSeq, text: t.zipFailed, tone: 'info' });
    } finally {
      setZipping(false);
    }
  }

  async function downloadIco() {
    const p = await freshPackage();
    const ico = p?.files.find((f) => f.name === 'favicon.ico');
    if (!ico) return;
    saveBlob(ico.blob, 'favicon.ico');
    onDownloaded('single');
  }

  const state =
    source === null ? 'idle' : failure ? 'error' : busy ? 'processing' : pkg ? 'done' : 'idle';

  const cutPlaying = cut.plays > 0 && donePlays !== cut.plays;
  const cutDone = cut.plays > 0 && donePlays === cut.plays && pkg !== null;
  const stageState = cutPlaying
    ? 'working'
    : failure
      ? 'error'
      : busy
        ? 'working'
        : cutDone
          ? 'success'
          : 'idle';
  const tileSrc = pkg?.previews[512];

  return (
    <div
      data-testid="favicon-shell"
      data-kind={tool.kind}
      data-mode={mode}
      data-state={state}
      className="relative -mx-4 grid gap-4 overflow-clip border-y border-border bg-card px-4 py-3 sm:mx-0 sm:rounded-card sm:border sm:p-5 [&>*]:min-w-0"
    >
      <SamuraiStage state={stageState} height={126} heightSm={200}>
        <CutMoment
          playKey={cut.plays}
          onDone={() => setDonePlays(cut.plays)}
          tile={
            tileSrc ? (
              // Object URL from the engine; next/image adds nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tileSrc} alt="" className="size-full" />
            ) : null
          }
        />
      </SamuraiStage>

      {mode === 'image' ? (
        <FilePicker
          inputId={inputId}
          multiple={false}
          onFiles={pickFile}
          onWarmUp={() => void loadEngine().catch(() => {})}
          label={file ? t.pickAnother : t.pickImage}
          desktopHint={t.imageHintDesktop}
        />
      ) : (
        <FaviconControls
          mode={mode}
          part="main"
          options={options}
          onChange={change}
          afterInput={<PrivacyNote className="mt-2" />}
        />
      )}

      <FaviconModeTabs mode={mode} onChange={switchMode} />

      {failure && (
        <ErrorBanner
          message={failure.message}
          action={
            failure.engine
              ? { label: toolCopy.reload, onClick: () => window.location.reload() }
              : undefined
          }
        />
      )}

      <FaviconPreview
        previews={pkg?.previews ?? null}
        busy={busy}
        empty={source === null}
        emptyText={
          mode === 'text' ? t.previewEmptyText : mode === 'emoji' ? t.previewEmptyEmoji : undefined
        }
        popKey={cutDone ? donePlays : 0}
      />

      <div className="grid gap-2">
        <Button
          size="lg"
          data-testid="download-zip"
          disabled={!canDownload}
          loading={zipping}
          loadingText={t.preparingZip}
          onClick={() => void downloadZip()}
        >
          {t.downloadZip}
        </Button>
        <Button
          variant="secondary"
          disabled={!canDownload}
          data-testid="download-ico"
          onClick={() => void downloadIco()}
          className="w-full"
        >
          {t.downloadIco}
        </Button>
      </div>

      <FaviconControls mode={mode} part="style" options={options} onChange={change} />

      <SnippetBlock snippet={pkg?.snippet ?? null} />

      <AdSlot position="below-results" />

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
