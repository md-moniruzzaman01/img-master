// HEIC/HEIF pages: file picker rules, the first-use decoder wait and error text.
// Pure helpers (no React, no engine import) so the HEIC decoder stays lazy in the engine.
import type { EngineErrorCode, ToolDefinition } from '@/lib/types';
import { copy } from './copy';

/** Picker filter for the HEIC pages. Dropping or pasting other images still works. */
export const HEIC_ACCEPT = '.heic,.heif,image/heic,image/heif';

/** After this long in the decode stage we explain the one-time reader download. */
export const SLOW_DECODE_MS = 1500;

/** The HEIC pages are fixed-format converters, never the hub (`from: 'any'`). */
export function isHeicTool(tool: ToolDefinition): boolean {
  return tool.kind === 'convert' && tool.preset.from === 'heic';
}

/** Only the hub converter shows a format chooser. */
export function isHubConverterTool(tool: ToolDefinition): boolean {
  return tool.kind === 'convert' && tool.preset.from === 'any';
}

/** HEIC/HEIF by MIME type or extension (Chrome and Windows often give an empty type). */
export function isHeicFile(file: { name: string; type: string }): boolean {
  if (/^image\/hei[cf](-sequence)?$/i.test(file.type)) return true;
  return /\.(heic|heif|hif)$/i.test(file.name);
}

/** Short, plain message for a failed HEIC file; null = use the normal message. */
export function heicErrorText(
  code: EngineErrorCode | 'UNKNOWN',
  file: { name: string; type: string },
): string | null {
  if (code === 'UNSUPPORTED_FORMAT') {
    return isHeicFile(file) ? copy.heic.unsupported : copy.heic.notHeic;
  }
  if (code === 'DECODE_FAILED' && isHeicFile(file)) return copy.heic.decodeFailed;
  return null;
}

export type DecodeWait = 'none' | 'opening' | 'slow';

/**
 * Tracks the engine's decode stage. `opening` while decoding; `slow` once decoding
 * has lasted longer than `delay`. Leaving the decode stage (or `reset`) clears it.
 */
export function createDecodeWatch(onChange: (wait: DecodeWait) => void, delay = SLOW_DECODE_MS) {
  let wait: DecodeWait = 'none';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const set = (next: DecodeWait) => {
    if (next === wait) return;
    wait = next;
    onChange(next);
  };
  return {
    /** Call with every progress report's stage. */
    stage(stage: 'decode' | 'search' | 'encode') {
      if (stage !== 'decode') return this.reset();
      if (wait !== 'none') return;
      set('opening');
      timer = setTimeout(() => set('slow'), delay);
    },
    reset() {
      clearTimeout(timer);
      timer = undefined;
      set('none');
    },
  };
}

/** Status line for the decode stage (several files: "photo 2 of 5"). */
export function decodeLabel(n: number, m: number): string {
  return m === 1 ? copy.heic.opening : copy.heic.openingMany(n, m);
}
