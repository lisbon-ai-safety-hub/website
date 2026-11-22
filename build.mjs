// LAISH website build. No dependencies: run `node build.mjs`.
// Reads src/, writes the static site to dist/ (the Cloudflare Pages output folder).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { layout, SCRIPT } from './src/templates/layout.mjs';
import { setCrowPath, setOrigin } from './src/templates/components.mjs';
import * as P from './src/templates/pages.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const LANGS = ['en', 'pt'];

const readJSON = (p) => JSON.parse(readFileSync(join(SRC, p), 'utf8'));
const write = (rel, content) => {
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

// ---------- Content ----------
const site = readJSON('content/site.json');
const data = {
  events: readJSON('data/events.json'),
  people: readJSON('data/people.json'),
  posts: readJSON('data/posts.json'),
  resources: readJSON('data/resources.json'),
};
const pageFiles = ['home', 'programmes', 'fellowship', 'events', 'about', 'whitepaper', 'paths'];
const pages = Object.fromEntries(pageFiles.map((n) => [n, readJSON(`content/pages/${n}.json`)]));
Object.assign(pages, readJSON('content/pages/other.json'));

// ---------- Routes ----------
// id: used by templates (ctx.href(id)); path: URL without the language prefix.
// section: which main-menu item shows as current.
const ROUTES = [
  { id: 'home', path: '', render: P.home },
  { id: 'programmes', path: 'programmes', section: 'programmes', render: P.programmes },
  { id: 'fellowship', path: 'fellowship', section: 'programmes', render: P.fellowship },
  { id: 'events', path: 'events', section: 'events', render: P.events },
  { id: 'resources', path: 'resources', section: 'resources', render: P.resources },
  { id: 'writing', path: 'writing', section: 'writing', render: P.writing },
  { id: 'about', path: 'about', section: 'about', render: P.about },
  { id: 'vision', path: 'about/vision', section: 'about', render: P.vision },
  { id: 'whitepaper', path: 'about/white-paper', section: 'about', render: P.whitepaper },
  { id: 'getinvolved', path: 'get-involved', section: 'getinvolved', render: P.getInvolved },
  { id: 'contact', path: 'contact', render: P.contact },
  { id: 'conduct', path: 'code-of-conduct', render: P.conduct },
  { id: 'privacy', path: 'privacy', render: P.privacy },
];
const routeById = Object.fromEntries(ROUTES.map((r) => [r.id, r]));

function urlFor(id, lang) {
  const r = routeById[id];
  if (!r) throw new Error(`Unknown page id "${id}"`);
  if (lang === 'en') return '/' + r.path;
  return r.path ? '/pt/' + r.path : '/pt/';
}

// A page at "/fellowship" is the file "fellowship.html" (Cloudflare Pages serves it without .html).
function fileFor(url) {
  if (url === '/') return 'index.html';
  if (url.endsWith('/')) return url.slice(1) + 'index.html';
  return url.slice(1) + '.html';
}

// ---------- Static files ----------
function copyDir(from, to) {
  if (!existsSync(from)) return;
  for (const name of readdirSync(from)) {
    if (name === '.DS_Store' || name === 'README.md') continue;
    const a = join(from, name), b = join(to, name);
    if (statSync(a).isDirectory()) { mkdirSync(b, { recursive: true }); copyDir(a, b); }
    else copyFileSync(a, b);
  }
}

// ---------- Build ----------
const started = Date.now();
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
copyDir(join(SRC, 'static'), DIST);

const css = readFileSync(join(SRC, 'styles/site.css'), 'utf8');
write('site.css', css);
const cssVersion = createHash('sha256').update(css).digest('hex').slice(0, 10);

const crowSvg = readFileSync(join(SRC, 'static/laish-crow.svg'), 'utf8');
setCrowPath(crowSvg.match(/ d="([^"]+)"/)[1]);
setOrigin(site.siteUrl);

const has = (p) => existsSync(join(SRC, 'static', p));
const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

function makeCtx(lang, route) {
  return {
    lang,
    site,
    data,
    today,
    cssVersion,
    t: site[lang],
    draft: site.draft === true,
    section: route?.section,
    hasWordmark: has('laish-wordmark.svg'),
    hasFont: has('fonts/archivo.woff2'),
    hasTouchIcon: has('apple-touch-icon.png'),
    hasShareImage: has('laish-share.png'),
    href: (id) => urlFor(id, lang),
    page: (name) => {
      const c = pages[name]?.[lang];
      if (!c) throw new Error(`Missing content: ${name}.${lang}`);
      return c;
    },
    doc: (name) => readFileSync(join(SRC, `content/docs/${name}.${lang}.md`), 'utf8'),
    alternates: route
      ? { en: urlFor(route.id, 'en'), pt: urlFor(route.id, 'pt') }
      : { en: '/', pt: '/pt/' },
  };
}

let count = 0;
for (const lang of LANGS) {
  for (const route of ROUTES) {
    const ctx = makeCtx(lang, route);
    const out = route.render(ctx);
    write(fileFor(urlFor(route.id, lang)), layout(ctx, out));
    count++;
  }
  // 404 pages: Cloudflare Pages serves the nearest 404.html.
  const ctx = makeCtx(lang, null);
  ctx.noindex = true;
  write(lang === 'en' ? '404.html' : 'pt/404.html', layout(ctx, P.notFound(ctx)));
  count++;
}

// ---------- sitemap.xml and robots.txt ----------
const abs = (u) => site.siteUrl + u;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ROUTES.flatMap((r) => LANGS.map((lang) => `  <url>
    <loc>${abs(urlFor(r.id, lang))}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(urlFor(r.id, 'en'))}"/>
    <xhtml:link rel="alternate" hreflang="pt-PT" href="${abs(urlFor(r.id, 'pt'))}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(urlFor(r.id, 'en'))}"/>
  </url>`)).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);

// ---------- _headers (Cloudflare Pages) ----------
// The inline script is allowed by its hash, so the Content-Security-Policy can block all other inline scripts.
const scriptHash = createHash('sha256').update(SCRIPT).digest('base64');
const csp = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${scriptHash}' https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  `form-action ${new URL(site.links.substackSubscribe).origin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');
write('_headers', `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: DENY

/site.css
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
`);

// ---------- _redirects (Cloudflare Pages) ----------
write('_redirects', `# Old routes from the Lovable site
/admin-login  /  301
/vision  /about/vision  301
/team  /about#team  301
`);

console.log(`Built ${count} pages in ${Date.now() - started} ms → dist/ (date used for events: ${today})`);
