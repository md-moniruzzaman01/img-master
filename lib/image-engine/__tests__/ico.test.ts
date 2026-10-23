import { describe, expect, it } from 'vitest';
import { writeIco } from '../favicon/ico';

const png = (n: number, fill: number) => new Uint8Array(n).fill(fill);

function parse(out: Uint8Array) {
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
  const count = dv.getUint16(4, true);
  const entries = Array.from({ length: count }, (_, i) => {
    const e = 6 + 16 * i;
    return {
      w: out[e],
      h: out[e + 1],
      colors: out[e + 2],
      reserved: out[e + 3],
      planes: dv.getUint16(e + 4, true),
      bpp: dv.getUint16(e + 6, true),
      size: dv.getUint32(e + 8, true),
      offset: dv.getUint32(e + 12, true),
    };
  });
  return { reserved: dv.getUint16(0, true), type: dv.getUint16(2, true), count, entries };
}

describe('writeIco', () => {
  it.each([1, 3, 4])('writes a correct header and directory for %i images', (n) => {
    const sizes = [16, 32, 48, 256].slice(0, n);
    const images = sizes.map((size, i) => ({ size, png: png(100 + i * 10, i + 1) }));
    const out = writeIco(images);
    const p = parse(out);
    expect(p.reserved).toBe(0);
    expect(p.type).toBe(1);
    expect(p.count).toBe(n);
    let offset = 6 + 16 * n;
    p.entries.forEach((e, i) => {
      expect(e.w).toBe(sizes[i] === 256 ? 0 : sizes[i]);
      expect(e.h).toBe(e.w);
      expect(e.colors).toBe(0);
      expect(e.reserved).toBe(0);
      expect(e.planes).toBe(1);
      expect(e.bpp).toBe(32);
      expect(e.size).toBe(images[i].png.length);
      expect(e.offset).toBe(offset);
      expect(Array.from(out.subarray(e.offset, e.offset + e.size))).toEqual(
        Array.from(images[i].png),
      );
      offset += e.size;
    });
    expect(out.length).toBe(offset);
  });

  it('stores 256 as 0', () => {
    const out = writeIco([{ size: 256, png: png(10, 7) }]);
    expect(out[6]).toBe(0);
    expect(out[7]).toBe(0);
  });

  it('rejects bad input', () => {
    expect(() => writeIco([])).toThrow();
    expect(() => writeIco([{ size: 300, png: png(1, 0) }])).toThrow();
  });
});
