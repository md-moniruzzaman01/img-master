// Web Worker entry: runs jobs with OffscreenCanvas, one at a time.
import { toWire } from './errors';
import { canEncodeWebp, probeOffscreen } from './encode';
import type { MainToWorker, ProbeResult, WorkerToMain } from './protocol';
import { runJob } from './run-job';

interface WorkerScope {
  onmessage: ((ev: MessageEvent<MainToWorker>) => void) | null;
  postMessage(msg: WorkerToMain): void;
}

const scope = self as unknown as WorkerScope;
const cancelledIds = new Set<number>();

const post = (msg: WorkerToMain) => scope.postMessage(msg);

scope.onmessage = (ev) => {
  const msg = ev.data;
  if (msg.type === 'cancel') {
    cancelledIds.add(msg.id);
    return;
  }
  if (msg.type === 'probe') {
    void (async () => {
      const workerCanvas = await probeOffscreen();
      const result: ProbeResult = {
        workerCanvas,
        encodeWebp: workerCanvas && (await canEncodeWebp()),
      };
      post({ id: msg.id, type: 'done', result });
    })();
    return;
  }
  const { id } = msg;
  void runJob(msg.type, msg.file, msg.options, {
    maxPixels: msg.maxPixels,
    onProgress: (stage, ratio) => post({ id, type: 'progress', stage, ratio }),
    isCancelled: () => cancelledIds.has(id),
  })
    .then(
      (result) => post({ id, type: 'done', result }),
      (e: unknown) => post({ id, type: 'error', ...toWire(e) }),
    )
    .finally(() => cancelledIds.delete(id));
};
