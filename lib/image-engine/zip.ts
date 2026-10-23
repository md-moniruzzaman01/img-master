// ZIP of results with fflate. Images are already compressed, so entries are
// stored (level 0): fast, and the zip is no bigger than the files.
import { zipSync, type Zippable } from 'fflate';
import { dedupeNames } from './names';

export async function zipFiles(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const names = dedupeNames(files.map((f) => f.name));
  const entries: Zippable = {};
  for (let i = 0; i < files.length; i++) {
    entries[names[i]] = [new Uint8Array(await files[i].blob.arrayBuffer()), { level: 0 }];
  }
  return new Blob([zipSync(entries)], { type: 'application/zip' });
}
