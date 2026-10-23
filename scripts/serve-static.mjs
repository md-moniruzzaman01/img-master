// Serves `out/` the way Cloudflare does: /slug -> slug.html, missing -> 404.html,
// gzip for text, and the rules in out/_headers.
// No dependencies. Usage: node scripts/serve-static.mjs  (PORT and HOST env vars optional)
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createGzip } from 'node:zlib';

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

const escapeRegExp = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

// Cloudflare-style _headers: an unindented "/path" line (`*` matches anything)
// followed by indented "Name: value" lines. Every matching rule applies.
function loadHeaderRules() {
  let text = '';
  try {
    text = readFileSync(join(root, '_headers'), 'utf8');
  } catch {
    return [];
  }
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = trimmed.split('*').map(escapeRegExp).join('.*');
      rules.push({ re: new RegExp(`^${pattern}$`), headers: {} });
    } else if (rules.length) {
      const i = trimmed.indexOf(':');
      if (i > 0) rules.at(-1).headers[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
    }
  }
  return rules;
}
const headerRules = loadHeaderRules();

function headersFor(pathname) {
  return Object.assign({}, ...headerRules.filter((r) => r.re.test(pathname)).map((r) => r.headers));
}

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null; // malformed URL: treat as not found instead of crashing
  }
  const clean = normalize(decoded).replace(/^([/\\])+/, '');
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
  // Next writes OG images without an extension (out/{slug}/opengraph-image).
  const isOg = /(^|[/\\])opengraph-image$/.test(file);
  const type = isOg ? 'image/png' : (types[extname(file)] ?? 'application/octet-stream');
  // Compress text like Cloudflare does, so local Lighthouse numbers are realistic.
  const gzip =
    /^(text\/|application\/(json|xml|manifest))|svg/.test(type) &&
    /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  res.writeHead(status, {
    ...headersFor(pathname),
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
  });
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  if (gzip) stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
}).listen(port, host, () => {
  console.log(`Serving out/ at http://${host}:${port}`);
});
