// The page shell: <head>, header, footer and the small shared script.
import { esc } from '../lib/html.mjs';
import { crow, go, linkAttrs, dateParts } from './components.mjs';

const NAV = ['programmes', 'events', 'resources', 'writing', 'about'];

function brand(ctx) {
  const t = ctx.t;
  const word = ctx.hasWordmark
    ? `<img class="brand__wordmark" src="/laish-wordmark.svg" alt="${esc(t.orgName)}" width="150" height="30">`
    : `<span class="brand__words"><span class="brand__name">L<span class="ai">AI</span>SH</span><span class="brand__sub">${esc(t.orgName)}</span></span>`;
  return `<a class="brand" href="${ctx.href('home')}" aria-label="${esc(t.siteShort)}, ${esc(t.orgName)}">${crow('brand__mark')}${word}</a>`;
}

function langSwitch(ctx) {
  const t = ctx.t.langSwitch;
  const other = ctx.alternates;
  return `<nav class="lang" aria-label="${esc(t.label)}">
    <a href="${esc(other.en)}" hreflang="en" lang="en"${ctx.lang === 'en' ? ' aria-current="true"' : ''}><span aria-hidden="true">${t.en}</span><span class="visually-hidden">${t.enFull}</span></a>
    <a href="${esc(other.pt)}" hreflang="pt-PT" lang="pt-PT"${ctx.lang === 'pt' ? ' aria-current="true"' : ''}><span aria-hidden="true">${t.pt}</span><span class="visually-hidden">${t.ptFull}</span></a>
  </nav>`;
}

function navLinks(ctx) {
  return NAV.map((id) => {
    const current = ctx.section === id ? ' aria-current="page"' : '';
    return `<a href="${ctx.href(id)}"${current}>${esc(ctx.t.nav[id])}</a>`;
  }).join('');
}

/** Items for the dropdown under a main menu item: fixed items from site.json plus items from the data. */
function subItems(ctx, id) {
  const S = ctx.t.submenu;
  const items = [...S[id]];
  if (id === 'resources') {
    for (const cat of ctx.data.resources.categories) {
      const n = ctx.data.resources.items.filter((i) => i.category === cat.id).length;
      items.push({ label: cat[ctx.lang].title, text: S.resourcesCount.replace('{n}', n), href: `resources#cat-${cat.id}` });
    }
  }
  if (id === 'events') {
    const next = ctx.data.events.events.filter((e) => e.date >= ctx.today).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) {
      const p = dateParts(ctx.lang, next.date);
      items.unshift({ label: next[ctx.lang].title, text: `${S.nextEvent}: ${p.weekday} ${p.day} ${p.month}${next.time ? ', ' + next.time : ''}`, href: 'events#upcoming', featured: true });
    }
  }
  return items;
}

/** Desktop menu: each item opens a dropdown on hover or keyboard focus. The main link still works on click. */
function navDesktop(ctx) {
  return NAV.map((id) => {
    const current = ctx.section === id ? ' aria-current="page"' : '';
    const panel = subItems(ctx, id).map((it) => {
      const h = go(ctx, it.href);
      return `<li><a class="subnav__link${it.featured ? ' subnav__link--featured' : ''}" href="${esc(h)}"${linkAttrs(h)}><span class="subnav__label">${esc(it.label)}</span><span class="subnav__text">${esc(it.text)}</span></a></li>`;
    }).join('');
    return `<div class="nav__item">
      <a class="nav__link" href="${ctx.href(id)}"${current}>${esc(ctx.t.nav[id])}<svg class="nav__chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <div class="subnav"><ul class="subnav__list">${panel}</ul></div>
    </div>`;
  }).join('');
}

function header(ctx) {
  const t = ctx.t;
  return `<header class="site-header">
  <div class="wrap site-header__inner">
    ${brand(ctx)}
    <nav class="nav nav--desktop" aria-label="Main">${navDesktop(ctx)}</nav>
    <div class="header-actions">
      ${langSwitch(ctx)}
      <a class="btn btn--primary btn--header" href="${ctx.href('getinvolved')}"${ctx.section === 'getinvolved' ? ' aria-current="page"' : ''}>${esc(t.getInvolved)}</a>
      <details class="menu">
        <summary>${esc(t.menu)}</summary>
        <nav class="menu__panel" aria-label="Main">${navLinks(ctx)}<a href="${ctx.href('getinvolved')}">${esc(t.getInvolved)}</a></nav>
      </details>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const t = ctx.t.footer;
  const L = ctx.site.links;
  const col = (title, links) => `<div class="footer-col"><h2>${esc(title)}</h2>${links.map(([label, href, ext]) => `<a href="${esc(href)}"${ext ? ' rel="noopener"' : ''}>${esc(label)}</a>`).join('')}</div>`;
  return `<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <div class="site-footer__about">
      <span class="brand__name" style="font-size: 20px">L<span class="ai">AI</span>SH</span>
      <p class="muted">${esc(t.tagline)}</p>
      <p class="muted small">${esc(t.volunteer)}</p>
      <a href="mailto:${esc(ctx.site.email)}">${esc(ctx.site.email)}</a>
    </div>
    <div class="footer-cols">
      ${col(t.explore, [[ctx.t.nav.programmes, ctx.href('programmes')], [t.fellowship, ctx.href('fellowship')], [ctx.t.nav.events, ctx.href('events')], [ctx.t.nav.resources, ctx.href('resources')], [ctx.t.nav.writing, ctx.href('writing')], [ctx.t.nav.about, ctx.href('about')]])}
      ${col(t.connect, [[ctx.t.getInvolved, ctx.href('getinvolved')], [t.contact, ctx.href('contact')], ['Discord', L.discord, 1], ['Instagram', L.instagram, 1], ['LinkedIn', L.linkedin, 1], ['Substack', L.substack, 1]])}
      ${col(t.legal, [[t.privacy, ctx.href('privacy')], [t.conduct, ctx.href('conduct')]])}
    </div>
  </div>
</footer>`;
}

export const SCRIPT = `
(function () {
  // Hide upcoming events whose date has passed since the last build.
  var today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('[data-upcoming] [data-date]').forEach(function (el) {
    if (el.getAttribute('data-date') < today) el.hidden = true;
  });
  // Filter buttons: <div data-filter-for="listId"> with <button data-filter="cat">.
  document.querySelectorAll('[data-filter-for]').forEach(function (bar) {
    var list = document.getElementById(bar.getAttribute('data-filter-for'));
    if (!list) return;
    bar.hidden = false;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      bar.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      list.querySelectorAll('[data-category]').forEach(function (item) {
        var past = item.hasAttribute('data-date') && item.getAttribute('data-date') < today && list.hasAttribute('data-upcoming');
        item.hidden = past || !(cat === 'all' || item.getAttribute('data-category') === cat);
      });
      list.querySelectorAll('[data-group]').forEach(function (g) {
        g.hidden = !g.querySelector('[data-category]:not([hidden])');
      });
    });
  });
  // Menu dropdowns: Esc closes the open one (WCAG 1.4.13).
  document.querySelectorAll('.nav__item').forEach(function (item) {
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { item.classList.add('nav__item--closed'); item.querySelector('.nav__link').focus(); }
    });
    item.addEventListener('mouseleave', function () { item.classList.remove('nav__item--closed'); });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) item.classList.remove('nav__item--closed'); });
  });
  // Copy buttons.
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.hidden = !navigator.clipboard;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
        var old = btn.textContent; btn.textContent = btn.getAttribute('data-copied');
        setTimeout(function () { btn.textContent = old; }, 1600);
      });
    });
  });
})();
`;

export function layout(ctx, { title, description, body, ogType = 'website' }) {
  const t = ctx.t;
  const canonical = ctx.site.siteUrl + ctx.alternates[ctx.lang];
  const desc = description || t.defaultDescription;
  const htmlLang = ctx.lang === 'pt' ? 'pt-PT' : 'en';
  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${ctx.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canonical)}">`}
${ctx.noindex ? '' : `<link rel="alternate" hreflang="en" href="${esc(ctx.site.siteUrl + ctx.alternates.en)}">
<link rel="alternate" hreflang="pt-PT" href="${esc(ctx.site.siteUrl + ctx.alternates.pt)}">
<link rel="alternate" hreflang="x-default" href="${esc(ctx.site.siteUrl + ctx.alternates.en)}">`}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(t.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
${ctx.hasShareImage ? `<meta property="og:image" content="${esc(ctx.site.siteUrl)}/laish-share.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : ''}
<meta property="og:locale" content="${ctx.lang === 'pt' ? 'pt_PT' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f4f7f4">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${ctx.hasTouchIcon ? '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' : ''}
${ctx.hasFont ? '<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>' : ''}
<link rel="stylesheet" href="/site.css?v=${ctx.cssVersion}">
</head>
<body>
<a class="skip-link" href="#main">${esc(t.skip)}</a>
${ctx.draft ? `<div class="draft">${esc(t.draftNotice)}</div>` : ''}
${header(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
<script>${SCRIPT}</script>
</body>
</html>
`;
}
