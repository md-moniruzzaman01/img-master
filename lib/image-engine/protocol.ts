// Worker message shapes (ENGINE.md §10). Types only; no runtime code.
import type { EngineResult } from '../types';
import type { WireError } from './errors';
import type { JobType, Stage } from './run-job';

export type MainToWorker =
  | { id: number; type: JobType; file: File | null; options: unknown; maxPixels: number }
  | { id: number; type: 'cancel' }
  /** Engine addition: capability self-test run once when the worker starts. */
  | { id: number; type: 'probe' };

/** What the favicon job returns across the worker boundary. Previews are Blobs; the main thread makes the object URLs. */
export interface FaviconWire {
  files: { name: string; blob: Blob }[];
  snippet: string;
  previews: Record<16 | 32 | 48 | 180 | 512, Blob>;
}

export type JobOutput = EngineResult | FaviconWire;

export interface ProbeResult {
  workerCanvas: boolean;
  encodeWebp: boolean;
}

export type WorkerToMain =
  | { id: number; type: 'progress'; stage: Stage; ratio: number }
  | { id: number; type: 'done'; result: JobOutput | ProbeResult }
  | ({ id: number; type: 'error' } & WireError);
