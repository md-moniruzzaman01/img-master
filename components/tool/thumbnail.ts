// Small preview images (DESIGN.md §8): never render a full-resolution photo,
// draw a copy at most 256px on its longest side and use that.
const MAX = 256;

export async function makeThumbnail(blob: Blob, keepAlpha: boolean): Promise<string | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let bmp: ImageBitmap | null = null;
  try {
    try {
      // Ask the browser to decode at a reduced size where supported (less memory).
      bmp = await createImageBitmap(blob, { resizeWidth: MAX * 2, resizeQuality: 'medium' });
    } catch {
      bmp = await createImageBitmap(blob);
    }
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepAlpha ? 'image/png' : 'image/jpeg', 0.8),
    );
    canvas.width = 0;
    canvas.height = 0;
    return out ? URL.createObjectURL(out) : null;
  } catch {
    return null;
  } finally {
    bmp?.close();
  }
}
