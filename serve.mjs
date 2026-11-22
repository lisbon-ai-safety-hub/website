// Local preview of dist/ with the same clean URLs as Cloudflare Pages.
// Run `npm run dev`, then open http://localhost:8788
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 8788);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const base = join(DIST, clean);
  if (!base.startsWith(DIST)) return null;
  if (isFile(base)) return base;
  if (isFile(base + '.html')) return base + '.html';
  if (isFile(join(base, 'index.html'))) return join(base, 'index.html');
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  let file = resolve(pathname);
  let status = 200;
  if (!file) {
    status = 404;
    file = pathname.startsWith('/pt/') ? join(DIST, 'pt/404.html') : join(DIST, '404.html');
  }
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`LAISH preview: http://localhost:${PORT}  (Ctrl+C to stop)`));
