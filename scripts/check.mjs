// Checks the built site in dist/. Run `npm run check`.
// 1. Every internal link and asset points to a file that exists.
// 2. Every page has an EN/PT pair with hreflang tags that point to each other.
// 3. Lists the [bracketed] placeholders that still need content.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const files = walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
const fileOf = (url) => {
  const p = join(DIST, url);
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(p + '.html')) return p + '.html';
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
};
const exists = (url) => {
  const p = join(DIST, url);
  return (existsSync(p) && statSync(p).isFile()) || existsSync(p + '.html') || existsSync(join(p, 'index.html'));
};

let errors = 0;
const fail = (msg) => { errors++; console.log('  ✗ ' + msg); };

// ---- 1. Internal links ----
console.log('Internal links');
for (const f of html) {
  const src = readFileSync(f, 'utf8');
  const page = '/' + relative(DIST, f);
  for (const [, attr] of src.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!attr.startsWith('/') || attr.startsWith('//')) continue;
    const [path, anchor] = attr.split('?')[0].split('#');
    if (path && !exists(path)) { fail(`${page} → ${attr}`); continue; }
    // Anchors on other pages, such as /about#team
    if (path && anchor) {
      const target = readFileSync(fileOf(path), 'utf8');
      if (!target.includes(`id="${anchor}"`)) fail(`${page} → ${attr} (no element with this id on ${path})`);
    }
  }
  for (const [, id] of src.matchAll(/href="#([^"]+)"/g)) {
    if (!src.includes(`id="${id}"`)) fail(`${page} → #${id} (no element with this id)`);
  }
}
if (!errors) console.log('  ✓ all internal links resolve');

// ---- 2. hreflang pairs ----
console.log('Language pairs');
const before = errors;
for (const f of html.filter((x) => !x.endsWith('404.html'))) {
  const src = readFileSync(f, 'utf8');
  const page = '/' + relative(DIST, f);
  const en = src.match(/hreflang="en" href="https?:\/\/[^/]+([^"]*)"/)?.[1];
  const pt = src.match(/hreflang="pt-PT" href="https?:\/\/[^/]+([^"]*)"/)?.[1];
  if (!en || !pt) { fail(`${page}: missing hreflang`); continue; }
  if (!exists(en)) fail(`${page}: EN version ${en} does not exist`);
  if (!exists(pt)) fail(`${page}: PT version ${pt} does not exist`);
}
if (errors === before) console.log(`  ✓ ${html.length - 2} pages, each with an EN and a PT version`);

// ---- 3. Placeholders ----
console.log('Placeholders still to fill in (text in [brackets] in src/)');
const found = new Map();
for (const f of walk(SRC).filter((x) => /\.(json|md)$/.test(x))) {
  const text = readFileSync(f, 'utf8');
  // A placeholder starts with a letter, has no quote marks, and is not a markdown link label "[label](url)".
  for (const match of text.matchAll(/\[([A-Za-zÀ-ú][^\]"\n]{2,160})\](?!\()/g)) {
    const m = match[0];
    if (m === "[brackets]" || m === "[parênteses]") continue; // the draft notice itself
    const key = relative(ROOT, f);
    if (!found.has(key)) found.set(key, new Set());
    found.get(key).add(m);
  }
}
let total = 0;
for (const [file, set] of found) {
  console.log(`  ${file}`);
  for (const m of set) { console.log(`    ${m}`); total++; }
}
console.log(`  ${total} unique placeholders`);

console.log(errors ? `\n${errors} problem(s) found.` : '\nNo problems found.');
process.exit(errors ? 1 : 0);
