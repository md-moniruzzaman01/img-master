// Worker message shapes (ENGINE.md §10). Types only; no runtime code.
import type { EngineResult } from '../types';
import type { WireError } from './errors';
import type { JobType, Stage } from './run-job';

export type MainToWorker =
  | { id: number; type: JobType; file: File; options: unknown; maxPixels: number }
  | { id: number; type: 'cancel' }
  /** Engine addition: capability self-test run once when the worker starts. */
  | { id: number; type: 'probe' };

export interface ProbeResult {
  workerCanvas: boolean;
  encodeWebp: boolean;
}

export type WorkerToMain =
  | { id: number; type: 'progress'; stage: Stage; ratio: number }
  | { id: number; type: 'done'; result: EngineResult | ProbeResult }
  | ({ id: number; type: 'error' } & WireError);
