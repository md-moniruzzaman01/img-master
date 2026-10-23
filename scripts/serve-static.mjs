// Serves `out/` the way Cloudflare does: /slug -> slug.html, missing -> 404.html.
// No dependencies. Usage: node scripts/serve-static.mjs  (PORT and HOST env vars optional)
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'out');
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? 'localhost';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const base = join(root, clean);
  if (base !== root && !base.startsWith(root + sep)) return null; // path traversal
  const candidates = [base, `${base}.html`, join(base, 'index.html')];
  return candidates.find(isFile) ?? null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://x');
  let file = resolveFile(pathname);
  let status = 200;
  if (!file) {
    file = join(root, '404.html');
    status = 404;
    if (!isFile(file)) {
      res.writeHead(404).end('Not found');
      return;
    }
  }
  res.writeHead(status, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}).listen(port, host, () => {
  console.log(`Serving out/ at http://${host}:${port}`);
});
