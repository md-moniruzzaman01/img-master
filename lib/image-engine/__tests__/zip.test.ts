import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { zipFiles } from '../zip';

describe('zipFiles', () => {
  it('stores every file and dedupes names', async () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5]);
    const zip = await zipFiles([
      { name: 'photo-50kb.jpg', blob: new Blob([a]) },
      { name: 'photo-50kb.jpg', blob: new Blob([b]) },
    ]);
    expect(zip.type).toBe('application/zip');
    const out = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    expect(Object.keys(out).sort()).toEqual(['photo-50kb-2.jpg', 'photo-50kb.jpg']);
    expect(Array.from(out['photo-50kb.jpg'])).toEqual([1, 2, 3]);
    expect(Array.from(out['photo-50kb-2.jpg'])).toEqual([4, 5]);
  });
});
