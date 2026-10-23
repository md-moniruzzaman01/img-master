// EngineError and helpers. Errors cross the worker boundary as plain
// `{ code, message, detail }` objects and are rebuilt with `fromWire`.
import type { EngineErrorCode, EngineErrorDetail, EngineErrorShape } from '../types';

export class EngineError extends Error implements EngineErrorShape {
  override name = 'EngineError' as const;
  code: EngineErrorCode;
  detail?: EngineErrorDetail;

  constructor(code: EngineErrorCode, message: string, detail?: EngineErrorDetail) {
    super(message);
    this.code = code;
    if (detail) this.detail = detail;
  }
}

/** Thrown internally when the browser fails to allocate or encode a canvas. */
export class MemoryError extends Error {
  override name = 'MemoryError';
}

export function isOutOfMemory(e: unknown): boolean {
  return e instanceof MemoryError || e instanceof RangeError;
}

export function cancelled(): EngineError {
  return new EngineError('CANCELLED', 'Cancelled');
}

export interface WireError {
  code: EngineErrorCode;
  message: string;
  detail?: EngineErrorDetail;
}

/** Converts any thrown value into the wire shape (unknown errors become DECODE_FAILED). */
export function toWire(e: unknown): WireError {
  if (e instanceof EngineError) return { code: e.code, message: e.message, detail: e.detail };
  if (isOutOfMemory(e)) return { code: 'OUT_OF_MEMORY', message: 'Not enough memory' };
  const message = e instanceof Error ? e.message : String(e);
  return { code: 'DECODE_FAILED', message: message || 'Processing failed' };
}

export function fromWire(w: WireError): EngineError {
  return new EngineError(w.code, w.message, w.detail);
}
