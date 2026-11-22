// Makes preview/, a copy of dist/ that opens from your disk (double-click preview/index.html).
// Links become relative and point to the .html files. No server needed.
// Run `npm run preview`. preview/ is not committed (see .gitignore).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'preview');
const isFile = (p) => existsSync(p) && statSync(p).isFile();

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

// "/fellowship" → "fellowship.html", "/pt/" → "pt/index.html", "/site.css?v=1" → "site.css"
function target(url) {
  const [pathAndQuery, hash = ''] = url.split('#');
  const path = pathAndQuery.split('?')[0];
  let file = path.slice(1);
  if (path === '/' || path.endsWith('/')) file += 'index.html';
  else if (!isFile(join(DIST, file)) && isFile(join(DIST, file + '.html'))) file += '.html';
  return { file, hash: hash ? '#' + hash : '' };
}

rmSync(OUT, { recursive: true, force: true });
for (const f of walk(DIST)) {
  const rel = relative(DIST, f).split('\\').join('/');
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  if (rel.endsWith('.html')) {
    const fromDir = posix.dirname(rel);
    let html = readFileSync(f, 'utf8').replace(/(href|src)="(\/[^"/][^"]*|\/)"/g, (_, attr, url) => {
      const { file, hash } = target(url);
      let r = posix.relative(fromDir, file) || posix.basename(file);
      return `${attr}="${r}${hash}"`;
    });
    html = html.replace('<body>', '<body data-preview>');
    writeFileSync(dest, html);
  } else if (rel === 'site.css') {
    writeFileSync(dest, readFileSync(f, 'utf8').replace(/url\("\/fonts\//g, 'url("fonts/'));
  } else {
    copyFileSync(f, dest);
  }
}
console.log('Preview ready: open preview/index.html in your browser.');
