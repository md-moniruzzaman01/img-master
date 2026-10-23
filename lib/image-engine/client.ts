// Worker pool, job queue, progress, cancellation and main-thread fallback
// (ENGINE.md §10). Main-thread code: keep it small. The job runner is only
// imported here dynamically, for the fallback.
import type { Capabilities, JobHandle, ProgressFn } from '../types';
import { canShareFiles, hasOffscreenCanvas, maxPixels, poolSize } from './capabilities';
import { EngineError, cancelled, fromWire, toWire } from './errors';
import type { MainToWorker, ProbeResult, WorkerToMain } from './protocol';
import type { JobType } from './run-job';

type Mode = 'worker' | 'main';

interface Job {
  id: number;
  type: JobType;
  file: File | null;
  options: unknown;
  onProgress?: ProgressFn;
  resolve(v: unknown): void;
  reject(e: unknown): void;
  settled: boolean;
  cancelled: boolean;
}

interface Slot {
  worker: Worker;
  job: Job | null;
}

const PROBE_TIMEOUT_MS = 10_000;

let nextId = 1;
let mode: Mode = 'main';
let probe: ProbeResult = { workerCanvas: false, encodeWebp: false };
let initPromise: Promise<void> | null = null;
let capsPromise: Promise<Capabilities> | null = null;
let mainBusy = false;
const queue: Job[] = [];
const slots: Slot[] = [];

function spawnWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

function send(w: Worker, msg: MainToWorker): void {
  w.postMessage(msg);
}

function settle(job: Job, outcome: { ok: unknown } | { err: unknown }): void {
  if (job.settled) return;
  job.settled = true;
  if ('ok' in outcome) job.resolve(outcome.ok);
  else job.reject(outcome.err);
}

function probeWorker(w: Worker): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error('Worker probe timed out')), PROBE_TIMEOUT_MS);
    w.onmessage = (ev: MessageEvent<WorkerToMain>) => {
      if (ev.data.id === id && ev.data.type === 'done') {
        clearTimeout(timer);
        resolve(ev.data.result as ProbeResult);
      }
    };
    w.onerror = (ev) => {
      ev.preventDefault();
      clearTimeout(timer);
      reject(new Error('Worker failed to start'));
    };
    send(w, { id, type: 'probe' });
  });
}

/** Starts the first worker and checks it can use OffscreenCanvas; otherwise uses the fallback. */
function init(): Promise<void> {
  initPromise ??= (async () => {
    if (typeof Worker === 'undefined' || !hasOffscreenCanvas()) return;
    let w: Worker | null = null;
    try {
      w = spawnWorker();
      const p = await probeWorker(w);
      if (p.workerCanvas) {
        probe = p;
        mode = 'worker';
        slots.push(attach(w));
        return;
      }
    } catch {
      // fall through to the main-thread fallback
    }
    w?.terminate();
  })();
  return initPromise;
}

function attach(worker: Worker): Slot {
  const slot: Slot = { worker, job: null };
  worker.onmessage = (ev: MessageEvent<WorkerToMain>) => onWorkerMessage(slot, ev.data);
  worker.onerror = (ev) => {
    ev.preventDefault();
    onWorkerCrash(slot);
  };
  worker.onmessageerror = () => onWorkerCrash(slot);
  return slot;
}

function onWorkerMessage(slot: Slot, msg: WorkerToMain): void {
  const job = slot.job;
  if (!job || msg.id !== job.id) return;
  if (msg.type === 'progress') {
    if (!job.settled) job.onProgress?.({ stage: msg.stage, ratio: msg.ratio });
    return;
  }
  slot.job = null;
  if (msg.type === 'done') settle(job, { ok: msg.result });
  else settle(job, { err: fromWire(msg) });
  pump();
}

/** A worker died (usually out of memory). Fail its job, replace the worker on demand. */
function onWorkerCrash(slot: Slot): void {
  const i = slots.indexOf(slot);
  if (i < 0) return;
  slots.splice(i, 1);
  slot.worker.terminate();
  if (slot.job) {
    settle(slot.job, {
      err: new EngineError('OUT_OF_MEMORY', 'The browser stopped while processing this image'),
    });
  }
  pump();
}

function pump(): void {
  if (mode === 'main') {
    void pumpMain();
    return;
  }
  while (queue.length > 0) {
    let slot = slots.find((s) => !s.job);
    if (!slot && slots.length < poolSize()) {
      try {
        slot = attach(spawnWorker());
        slots.push(slot);
      } catch {
        slot = undefined;
      }
    }
    if (!slot) {
      if (slots.length === 0) {
        mode = 'main'; // no worker can be started any more
        void pumpMain();
      }
      return;
    }
    const job = queue.shift() as Job;
    if (job.settled) continue;
    slot.job = job;
    send(slot.worker, {
      id: job.id,
      type: job.type,
      file: job.file,
      options: job.options,
      maxPixels: maxPixels(),
    });
  }
}

/** Main-thread fallback: same runner, one job at a time, yielding between encodes. */
async function pumpMain(): Promise<void> {
  if (mainBusy) return;
  mainBusy = true;
  try {
    while (queue.length > 0) {
      const job = queue.shift() as Job;
      if (job.settled) continue;
      try {
        const { runJob } = await import('./run-job');
        const result = await runJob(job.type, job.file, job.options, {
          maxPixels: maxPixels(),
          onProgress: (stage, ratio) => {
            if (!job.settled) job.onProgress?.({ stage, ratio });
          },
          isCancelled: () => job.cancelled,
          yieldBetween: true,
        });
        settle(job, { ok: result });
      } catch (e) {
        settle(job, { err: fromWire(toWire(e)) });
      }
      await new Promise((r) => setTimeout(r));
    }
  } finally {
    mainBusy = false;
  }
}

export function submit<T>(
  type: JobType,
  file: File | null,
  options: unknown,
  onProgress?: ProgressFn,
): JobHandle<T> {
  let job!: Job;
  const promise = new Promise<T>((resolve, reject) => {
    job = {
      id: nextId++,
      type,
      file,
      options,
      onProgress,
      resolve: resolve as (v: unknown) => void,
      reject,
      settled: false,
      cancelled: false,
    };
  });
  void init().then(() => {
    if (job.settled) return;
    queue.push(job);
    pump();
  });
  return {
    promise,
    cancel() {
      if (job.settled) return;
      job.cancelled = true;
      const i = queue.indexOf(job);
      if (i >= 0) queue.splice(i, 1);
      const slot = slots.find((s) => s.job === job);
      if (slot) send(slot.worker, { id: job.id, type: 'cancel' });
      settle(job, { err: cancelled() });
    },
  };
}

/** A handle that has already failed (used for tools that aren't built yet). */
export function rejectedHandle<T>(error: EngineError): JobHandle<T> {
  const promise = Promise.reject<T>(error);
  promise.catch(() => {}); // avoid an unhandled rejection if the caller never awaits
  return { promise, cancel() {} };
}

export function capabilities(): Promise<Capabilities> {
  capsPromise ??= (async () => {
    await init();
    let encodeWebp = probe.encodeWebp;
    if (mode === 'main') {
      const { canEncodeWebp } = await import('./encode');
      encodeWebp = await canEncodeWebp();
    }
    return {
      offscreenCanvas: hasOffscreenCanvas(),
      workerCanvas: mode === 'worker',
      encodeWebp,
      shareFiles: canShareFiles(),
      maxPixels: maxPixels(),
    };
  })();
  return capsPromise;
}

/** Diagnostics: where jobs run ('worker' or 'main'). */
export async function engineMode(): Promise<Mode> {
  await init();
  return mode;
}
