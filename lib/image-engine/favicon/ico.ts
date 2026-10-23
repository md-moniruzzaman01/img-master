// ICO container with embedded PNGs (ENGINE.md §9).

export interface IcoImage {
  /** Square size in pixels (1–256). 256 is stored as 0 in the directory. */
  size: number;
  png: Uint8Array;
}

/**
 * Header (6 bytes): reserved 0, type 1, count. Directory entry (16 bytes) per
 * image: width, height (0 = 256), colors 0, reserved 0, planes 1, bit count 32,
 * PNG byte size, PNG byte offset. Then the PNG blocks in order.
 */
export function writeIco(images: readonly IcoImage[]): Uint8Array {
  const n = images.length;
  if (n < 1 || n > 0xffff) throw new RangeError('ICO needs between 1 and 65535 images');
  let total = 6 + 16 * n;
  for (const img of images) {
    if (!(img.size >= 1 && img.size <= 256)) throw new RangeError('ICO image size must be 1–256');
    total += img.png.length;
  }
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, n, true);
  let offset = 6 + 16 * n;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    const dim = img.size >= 256 ? 0 : img.size;
    out[e] = dim;
    out[e + 1] = dim;
    out[e + 2] = 0;
    out[e + 3] = 0;
    dv.setUint16(e + 4, 1, true);
    dv.setUint16(e + 6, 32, true);
    dv.setUint32(e + 8, img.png.length, true);
    dv.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}
