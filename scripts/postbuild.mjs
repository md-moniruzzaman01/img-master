// Runs after `next build`. Fixes route-prefetch 404s in the static export.
//
// Next 16 writes segment prefetch data as  out/x/__next.$d$slug/__PAGE__.txt
// but the browser requests                  /x/__next.$d$slug.__PAGE__.txt
// We copy every file inside a `__next.*` folder to the flat dotted name next to
// the folder, so any static host (local server, Cloudflare) serves it directly.
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = join(process.cwd(), 'out');
if (!existsSync(root)) {
  console.error('postbuild: out/ not found (run next build first)');
  process.exit(1);
}

let copied = 0;

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesIn(p) : [p];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith('__next.')) {
      for (const file of filesIn(p)) {
        const flat = [name, ...relative(p, file).split(sep)].join('.');
        const target = join(dir, flat);
        if (!existsSync(target)) {
          copyFileSync(file, target);
          copied += 1;
        }
      }
    } else if (name !== '_next') {
      walk(p);
    }
  }
}

walk(root);
console.log(`postbuild: wrote ${copied} flat prefetch files`);
