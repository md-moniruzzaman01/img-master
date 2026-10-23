// Builds the edge-case fixtures in e2e/fixtures/generated/ using a canvas in a
// real browser, plus a few hand-written binary files (GIF, BMP, corrupt, text).
// Run through ensureFixtures() in fixtures.ts; never import this from page code.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const FIXTURE_VERSION = 'v3';

interface CanvasJob {
  file: string;
  width: number;
  height: number;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  kind: 'photo' | 'transparent' | 'noise' | 'photo-alpha';
  noise?: number;
}

const JOBS: CanvasJob[] = [
  // ~3 MB, 12 MP, phone-photo-like (gradients, shapes, mild noise)
  {
    file: 'photo-12mp.jpg',
    width: 4000,
    height: 3000,
    mime: 'image/jpeg',
    quality: 0.92,
    kind: 'photo',
    noise: 0.1,
  },
  {
    file: 'photo-2mp.jpg',
    width: 1600,
    height: 1200,
    mime: 'image/jpeg',
    quality: 0.9,
    kind: 'photo',
    noise: 0.08,
  },
  {
    file: 'photo-small.jpg',
    width: 320,
    height: 240,
    mime: 'image/jpeg',
    quality: 0.3,
    kind: 'photo',
    noise: 0.02,
  },
  {
    file: 'photo-2mp.png',
    width: 1600,
    height: 1200,
    mime: 'image/png',
    kind: 'photo',
    noise: 0.04,
  },
  {
    file: 'photo-2mp.webp',
    width: 1600,
    height: 1200,
    mime: 'image/webp',
    quality: 0.85,
    kind: 'photo',
    noise: 0.06,
  },
  { file: 'transparent.png', width: 800, height: 600, mime: 'image/png', kind: 'transparent' },
  {
    file: 'transparent.webp',
    width: 800,
    height: 600,
    mime: 'image/webp',
    quality: 0.9,
    kind: 'transparent',
  },
  { file: 'tiny-40.png', width: 40, height: 40, mime: 'image/png', kind: 'photo', noise: 0.02 },
  {
    file: 'tiny-40.jpg',
    width: 40,
    height: 40,
    mime: 'image/jpeg',
    quality: 0.9,
    kind: 'photo',
    noise: 0.02,
  },
  {
    file: 'tall-1000x8000.jpg',
    width: 1000,
    height: 8000,
    mime: 'image/jpeg',
    quality: 0.9,
    kind: 'photo',
    noise: 0.06,
  },
  {
    file: 'noise-1200.jpg',
    width: 1200,
    height: 1200,
    mime: 'image/jpeg',
    quality: 0.95,
    kind: 'noise',
  },
  // 48 megapixels (over the 16.7 MP pixel cap)
  {
    file: 'photo-48mp.jpg',
    width: 8000,
    height: 6000,
    mime: 'image/jpeg',
    quality: 0.85,
    kind: 'photo',
    noise: 0.08,
  },
  // wide, short signature-like scan (white paper, dark scribble)
  { file: 'signature.png', width: 900, height: 300, mime: 'image/png', kind: 'photo-alpha' },
];

/** Draws a photo-like scene in the browser and returns file bytes as base64. */
async function renderInBrowser(job: CanvasJob): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    return await page.evaluate(async (j) => {
      const canvas = document.createElement('canvas');
      canvas.width = j.width;
      canvas.height = j.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      const W = j.width;
      const H = j.height;
      let seed = 12345 + W;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      if (j.kind === 'noise') {
        const img = ctx.createImageData(W, H);
        for (let i = 0; i < img.data.length; i += 4) {
          img.data[i] = (rnd() * 256) | 0;
          img.data[i + 1] = (rnd() * 256) | 0;
          img.data[i + 2] = (rnd() * 256) | 0;
          img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      } else if (j.kind === 'photo-alpha') {
        // Scanned signature: off-white paper and a dark scribble.
        ctx.fillStyle = '#f4f1ea';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#1b2a6b';
        ctx.lineWidth = Math.max(2, W / 200);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W * 0.08, H * 0.6);
        for (let i = 0; i < 40; i++) {
          const x = W * (0.08 + i * 0.022);
          ctx.quadraticCurveTo(
            x + W * 0.01,
            H * (0.2 + rnd() * 0.6),
            x + W * 0.02,
            H * (0.4 + rnd() * 0.3),
          );
        }
        ctx.stroke();
      } else if (j.kind === 'transparent') {
        ctx.clearRect(0, 0, W, H);
        const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
        g.addColorStop(0, 'rgba(220,30,60,1)');
        g.addColorStop(0.6, 'rgba(40,90,220,0.6)');
        g.addColorStop(1, 'rgba(40,200,120,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, W * 0.45, H * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,0,0.5)';
        ctx.fillRect(W * 0.05, H * 0.05, W * 0.2, H * 0.2);
        // Fully transparent corners stay untouched on purpose.
      } else {
        // Photo-like: sky, hills, sun, buildings, a face, soft shadows.
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        sky.addColorStop(0, '#2c6fb8');
        sky.addColorStop(1, '#cfe3f2');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);
        const sun = ctx.createRadialGradient(W * 0.8, H * 0.18, 5, W * 0.8, H * 0.18, W * 0.2);
        sun.addColorStop(0, 'rgba(255,248,210,1)');
        sun.addColorStop(1, 'rgba(255,248,210,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, W, H);
        for (let layer = 0; layer < 3; layer++) {
          const hill = ctx.createLinearGradient(0, H * (0.5 + layer * 0.1), 0, H);
          hill.addColorStop(0, ['#6e9a5b', '#4f7c43', '#35592f'][layer]);
          hill.addColorStop(1, ['#3f6a37', '#2a4a26', '#1b3318'][layer]);
          ctx.fillStyle = hill;
          ctx.beginPath();
          ctx.moveTo(0, H);
          for (let x = 0; x <= W; x += W / 12) {
            ctx.lineTo(x, H * (0.55 + layer * 0.12) + Math.sin((x / W) * 6 + layer) * H * 0.05);
          }
          ctx.lineTo(W, H);
          ctx.closePath();
          ctx.fill();
        }
        for (let b = 0; b < 8; b++) {
          const bw = W * (0.04 + rnd() * 0.06);
          const bh = H * (0.1 + rnd() * 0.2);
          const bx = W * (0.05 + b * 0.11);
          const by = H * 0.62 - bh;
          ctx.fillStyle = `hsl(${20 + rnd() * 30}, 25%, ${45 + rnd() * 20}%)`;
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = 'rgba(255,240,170,0.7)';
          for (let wy = by + bh * 0.1; wy < by + bh * 0.85; wy += bh * 0.2) {
            ctx.fillRect(bx + bw * 0.2, wy, bw * 0.2, bh * 0.08);
            ctx.fillRect(bx + bw * 0.6, wy, bw * 0.2, bh * 0.08);
          }
        }
        // A "portrait" in the foreground.
        const cx = W * 0.5;
        const cy = H * 0.62;
        ctx.fillStyle = '#2b2f55';
        ctx.beginPath();
        ctx.ellipse(cx, H * 0.98, W * 0.2, H * 0.28, 0, Math.PI, 0);
        ctx.fill();
        const skin = ctx.createRadialGradient(cx - W * 0.02, cy - H * 0.03, 5, cx, cy, W * 0.1);
        skin.addColorStop(0, '#f1c9a5');
        skin.addColorStop(1, '#c58f68');
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(cx, cy, W * 0.075, H * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1d14';
        ctx.beginPath();
        ctx.ellipse(cx, cy - H * 0.1, W * 0.08, H * 0.06, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#1b1b1b';
        ctx.beginPath();
        ctx.ellipse(cx - W * 0.03, cy - H * 0.02, W * 0.008, H * 0.01, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + W * 0.03, cy - H * 0.02, W * 0.008, H * 0.01, 0, 0, Math.PI * 2);
        ctx.fill();
        // Mild sensor-like noise from a repeated tile (cheap even at 48 MP).
        if (j.noise) {
          const tile = document.createElement('canvas');
          tile.width = 256;
          tile.height = 256;
          const tctx = tile.getContext('2d');
          if (!tctx) throw new Error('no tile context');
          const img = tctx.createImageData(256, 256);
          for (let i = 0; i < img.data.length; i += 4) {
            const v = (rnd() * 256) | 0;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = 255;
          }
          tctx.putImageData(img, 0, 0);
          const pattern = ctx.createPattern(tile, 'repeat');
          if (pattern) {
            ctx.globalAlpha = j.noise;
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
          }
        }
      }

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, j.mime, j.quality));
      if (!blob) throw new Error(`toBlob failed for ${j.mime}`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    }, job);
  } finally {
    await browser.close();
  }
}

/** Minimal EXIF APP1 segment: Make string (the "GPS" marker text) and optional Orientation. */
function exifSegment(orientation?: number): Buffer {
  const make = Buffer.from('IMGMASTER-QA-GPS-TEST\0', 'latin1');
  const entries = orientation ? 2 : 1;
  const tiffLen = 8 + 2 + entries * 12 + 4 + make.length;
  const tiff = Buffer.alloc(tiffLen);
  tiff.write('MM', 0, 'latin1');
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  let p = 8;
  tiff.writeUInt16BE(entries, p);
  p += 2;
  const strOffset = 8 + 2 + entries * 12 + 4;
  tiff.writeUInt16BE(0x010f, p); // Make
  tiff.writeUInt16BE(2, p + 2); // ASCII
  tiff.writeUInt32BE(make.length, p + 4);
  tiff.writeUInt32BE(strOffset, p + 8);
  p += 12;
  if (orientation) {
    tiff.writeUInt16BE(0x0112, p); // Orientation
    tiff.writeUInt16BE(3, p + 2); // SHORT
    tiff.writeUInt32BE(1, p + 4);
    tiff.writeUInt16BE(orientation, p + 8);
    p += 12;
  }
  tiff.writeUInt32BE(0, p); // no next IFD
  make.copy(tiff, strOffset);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const head = Buffer.alloc(4);
  head.writeUInt16BE(0xffe1, 0);
  head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}

function withExif(jpeg: Buffer, orientation?: number): Buffer {
  // Insert right after SOI (FFD8). Canvas JPEGs have no JFIF/EXIF block of their own.
  return Buffer.concat([jpeg.subarray(0, 2), exifSegment(orientation), jpeg.subarray(2)]);
}

/** Tiny GIF89a writer: 3-frame animation, 16-color palette, real LZW. */
function makeGif(width: number, height: number, frames: number): Buffer {
  const palette: [number, number, number][] = [];
  for (let i = 0; i < 16; i++) palette.push([i * 16, 255 - i * 16, (i * 40) % 256]);
  const out: number[] = [];
  const w16 = (n: number) => out.push(n & 255, (n >> 8) & 255);
  out.push(...Buffer.from('GIF89a', 'latin1'));
  w16(width);
  w16(height);
  out.push(0xf3, 0, 0); // global color table, 16 entries (2^(3+1))
  for (const [r, g, b] of palette) out.push(r, g, b);
  out.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0', 'latin1'), 3, 1, 0, 0, 0);
  for (let f = 0; f < frames; f++) {
    out.push(0x21, 0xf9, 4, 0, 10, 0, 0, 0); // graphic control, 100 ms
    out.push(0x2c);
    w16(0);
    w16(0);
    w16(width);
    w16(height);
    out.push(0);
    const minCode = 4;
    out.push(minCode);
    const pixels: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) pixels.push(((x >> 3) + (y >> 3) + f * 5) % 16);
    }
    // LZW; the table is reset before it can overflow 12 bits.
    const clear = 1 << minCode;
    const eoi = clear + 1;
    const codes: { code: number; size: number }[] = [];
    let table = new Map<number, number>();
    let next = eoi + 1;
    let size = minCode + 1;
    codes.push({ code: clear, size });
    let prefix = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
      const key = prefix * 16 + pixels[i];
      const hit = table.get(key);
      if (hit !== undefined) {
        prefix = hit;
        continue;
      }
      codes.push({ code: prefix, size });
      if (next < 4096) {
        table.set(key, next++);
        if (next > 1 << size && size < 12) size++;
      } else {
        codes.push({ code: clear, size });
        table = new Map();
        next = eoi + 1;
        size = minCode + 1;
      }
      prefix = pixels[i];
    }
    codes.push({ code: prefix, size });
    codes.push({ code: eoi, size });
    let bitBuf = 0;
    let bitCount = 0;
    const bytes: number[] = [];
    for (const { code, size: s } of codes) {
      bitBuf |= code << bitCount;
      bitCount += s;
      while (bitCount >= 8) {
        bytes.push(bitBuf & 255);
        bitBuf >>= 8;
        bitCount -= 8;
      }
    }
    if (bitCount > 0) bytes.push(bitBuf & 255);
    for (let i = 0; i < bytes.length; i += 255) {
      const part = bytes.slice(i, i + 255);
      out.push(part.length, ...part);
    }
    out.push(0);
  }
  out.push(0x3b);
  return Buffer.from(out);
}

function makeBmp(width: number, height: number): Buffer {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const data = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = y * rowSize + x * 3;
      data[o] = (x * 255) / width; // B
      data[o + 1] = (y * 255) / height; // G
      data[o + 2] = 128; // R
    }
  }
  const header = Buffer.alloc(54);
  header.write('BM', 0, 'latin1');
  header.writeUInt32LE(54 + data.length, 2);
  header.writeUInt32LE(54, 10);
  header.writeUInt32LE(40, 14);
  header.writeInt32LE(width, 18);
  header.writeInt32LE(height, 22);
  header.writeUInt16LE(1, 26);
  header.writeUInt16LE(24, 28);
  header.writeUInt32LE(data.length, 34);
  return Buffer.concat([header, data]);
}

export async function generateFixtures(dir: string): Promise<void> {
  mkdirSync(dir, { recursive: true });
  const write = (name: string, data: Buffer) => writeFileSync(join(dir, name), data);

  for (const job of JOBS) {
    const data = Buffer.from(await renderInBrowser(job), 'base64');
    write(job.file, data);
  }

  // Needs the 2 MP JPEG as base: EXIF with a GPS-like marker, and a rotated one.
  const { readFileSync } = await import('node:fs');
  const base = readFileSync(join(dir, 'photo-2mp.jpg'));
  write('exif-gps.jpg', withExif(base));
  const small = readFileSync(join(dir, 'photo-small.jpg'));
  write('exif-orientation6.jpg', withExif(small, 6)); // 320x240 stored, shown 240x320

  write('animated.gif', makeGif(96, 64, 3));
  write('sample.bmp', makeBmp(300, 200));

  // Not-an-image files with image names.
  const jpegStart = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
  const garbage = Buffer.alloc(4000);
  let s = 7;
  for (let i = 0; i < garbage.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    garbage[i] = s & 255;
  }
  write('corrupt.jpg', Buffer.concat([jpegStart, garbage]));
  write(
    'not-an-image.png',
    Buffer.from('This is a plain text file renamed to .png.\n'.repeat(40), 'utf8'),
  );
  write('empty.jpg', Buffer.alloc(0));
}
