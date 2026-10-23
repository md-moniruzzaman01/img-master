import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { FIXTURE_VERSION, generateFixtures } from './generate-fixtures';

export const ROOT = resolve(__dirname, '..', '..');
export const GENERATED_DIR = join(ROOT, 'e2e', 'fixtures', 'generated');
export const REAL_DIR = join(ROOT, 'e2e', 'fixtures', 'real');
export const OUT_DIR = join(ROOT, 'out');

const MARKER = join(GENERATED_DIR, '.done');
const LOCK = join(GENERATED_DIR, '.lock');

function isReady(): boolean {
  try {
    return readFileSync(MARKER, 'utf8').trim() === FIXTURE_VERSION;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generates the edge-case fixtures once (safe with parallel Playwright workers).
 * Files are written to e2e/fixtures/generated/ (git-ignored by its own .gitignore).
 */
export async function ensureFixtures(): Promise<void> {
  if (isReady()) return;
  mkdirSync(GENERATED_DIR, { recursive: true });
  const deadline = Date.now() + 5 * 60_000;
  while (!isReady()) {
    let mine = false;
    try {
      mkdirSync(LOCK); // atomic: only one process wins
      mine = true;
    } catch {
      // Someone else is generating. Break stale locks older than 6 minutes.
      try {
        if (Date.now() - statSync(LOCK).mtimeMs > 6 * 60_000) rmSync(LOCK, { recursive: true });
      } catch {
        /* ignore */
      }
    }
    if (mine) {
      try {
        await generateFixtures(GENERATED_DIR);
        writeFileSync(MARKER, FIXTURE_VERSION);
      } finally {
        rmSync(LOCK, { recursive: true, force: true });
      }
      return;
    }
    if (Date.now() > deadline) throw new Error('Timed out waiting for fixture generation');
    await sleep(500);
  }
}

export function fixture(name: string): string {
  return join(GENERATED_DIR, name);
}

export function fixtureBytes(name: string): Buffer {
  return readFileSync(fixture(name));
}

/** Real photos the owner dropped into e2e/fixtures/real/ (empty until then). */
export function realFixtures(): { name: string; path: string }[] {
  if (!existsSync(REAL_DIR)) return [];
  return readdirSync(REAL_DIR)
    .filter((f) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(f))
    .map((f) => ({ name: f, path: join(REAL_DIR, f) }));
}
