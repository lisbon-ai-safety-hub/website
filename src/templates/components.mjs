// Reusable pieces of markup. Each function returns an HTML string.
import { esc, inline } from '../lib/html.mjs';

// The crow emblem path, read by build.mjs from src/static/laish-crow.svg.
let CROW_PATH = '';
export function setCrowPath(d) { CROW_PATH = d; }

export function crow(className = '', label = '') {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${className}" viewBox="0 0 652 586" ${a11y}><g transform="translate(0,586) scale(0.1,-0.1)" fill="currentColor"><path d="${CROW_PATH}"/></g></svg>`;
}

/** Resolve a link target: a page id, a key in site.links, or a full URL. */
export function resolveHref(ctx, target) {
  if (!target) return '#';
  if (target.startsWith('[')) return '#'; // placeholder such as "[Luma link]": fill it in before launch
  if (/^(https?:|mailto:|#|\/)/.test(target)) return target;
  if (ctx.site.links[target]) return resolveHref(ctx, ctx.site.links[target]);
  return ctx.href(target);
}

export function isExternal(href) {
  return /^https?:\/\//.test(href) && !href.startsWith(SITE_ORIGIN());
}
let _origin = '';
export function setOrigin(o) { _origin = o; }
function SITE_ORIGIN() { return _origin || 'https://www.lisbonaisafetyhub.org'; }

export function linkAttrs(href) {
  return isExternal(href) ? ' rel="noopener"' : '';
}

export function button(ctx, { label, href, variant = 'primary', size = '' }) {
  const h = resolveHref(ctx, href);
  return `<a class="btn btn--${variant}${size ? ' btn--' + size : ''}" href="${esc(h)}"${linkAttrs(h)}>${esc(label)}</a>`;
}

export function tag(text, { dot = false, status = false } = {}) {
  return `<span class="tag${status ? ' tag--status' : ''}">${dot ? '<span class="tag__dot" aria-hidden="true"></span>' : ''}${inline(text)}</span>`;
}

export function sectionTitle({ label, title, intro, id, level = 2 }) {
  return `<div class="section-title">
    ${label ? `<p class="label">${esc(label)}</p>` : ''}
    <h${level} class="display-l"${id ? ` id="${esc(id)}"` : ''}>${inline(title)}</h${level}>
    ${intro ? `<p class="lede">${inline(intro)}</p>` : ''}
  </div>`;
}

export function mosaic() {
  const t = (c, tri = '') => `<div class="tile tile--${c}${tri ? ' tile--' + tri : ''}"></div>`;
  // 4 x 4 grid: 12 single tiles plus the crow tile (2 x 2).
  return `<div class="mosaic" aria-hidden="true">
    ${t('sage', 'tl')}${t('mist')}${t('accent', 'bl')}${t('ink')}
    ${t('mist')}<div class="tile tile--crow">${crow()}</div>${t('accent')}
    ${t('mist', 'br')}${t('sage', 'tr')}
    ${t('mist')}${t('ink', 'tl')}${t('sage')}${t('accent', 'br')}
  </div>`;
}

/** The dark newsletter / call-to-action panel. */
export function panel({ label, title, text, right }) {
  return `<div class="panel">
    <div class="panel__text">
      <p class="label">${esc(label)}</p>
      <h2 class="display-l">${inline(title)}</h2>
      ${text ? `<p>${inline(text)}</p>` : ''}
    </div>
    ${right}
  </div>`;
}

export function subscribeForm(ctx, buttonLabel) {
  const t = ctx.t.newsletter;
  const id = 'email-' + Math.random().toString(36).slice(2, 7);
  return `<form class="subscribe" action="${esc(ctx.site.links.substackSubscribe)}" method="get">
    <label for="${id}">${esc(t.email)}
      <input id="${id}" type="email" name="email" autocomplete="email" placeholder="you@example.com" required>
    </label>
    <button class="btn btn--on-ink" type="submit">${esc(buttonLabel || t.button)}</button>
    <p class="subscribe__note">${esc(t.note)}</p>
  </form>`;
}

export function newsletterPanel(ctx, overrides = {}) {
  const t = ctx.t.newsletter;
  return panel({
    label: overrides.label || t.label,
    title: overrides.title || t.title,
    text: overrides.text || t.text,
    right: subscribeForm(ctx, overrides.button),
  });
}

export function mailto(ctx, subject) {
  const s = encodeURIComponent(`[LAISH] ${subject}`);
  return `mailto:${ctx.site.email}?subject=${s}`;
}

// ---------- Dates ----------
export function dateParts(lang, iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const locale = lang === 'pt' ? 'pt-PT' : 'en-GB';
  const clean = (s) => s.replace('.', '').replace(/^./, (c) => c.toUpperCase());
  return {
    day: String(d.getUTCDate()).padStart(2, '0'),
    month: clean(new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(d)),
    monthLong: clean(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)),
    weekday: clean(new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d)),
    full: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d),
  };
}

export function eventRow(ctx, ev) {
  const p = dateParts(ctx.lang, ev.date);
  const c = ev[ctx.lang];
  const meta = [ev.time, ev.venue, ev.free ? ctx.t.events.free : ''].filter(Boolean).join(' · ');
  const href = resolveHref(ctx, ev.url);
  return `<article class="event" data-category="${esc(ev.category)}" data-date="${esc(ev.date)}">
    <div class="event__date"><span class="event__day">${p.day}</span><span class="event__when">${esc(p.month)} · ${esc(p.weekday)}</span></div>
    <div class="event__body"><h3 class="event__title">${esc(c.title)}</h3><p class="event__meta">${esc(meta)}</p>${c.summary ? `<p class="event__summary">${esc(c.summary)}</p>` : ''}</div>
    <a class="btn btn--outline" href="${esc(href)}"${linkAttrs(href)}>${esc(ctx.t.events.attend)}<span class="visually-hidden">: ${esc(c.title)}</span></a>
  </article>`;
}

export function nextBar(ctx, ev) {
  if (!ev) return '';
  const p = dateParts(ctx.lang, ev.date);
  const c = ev[ctx.lang];
  return `<a class="nextbar" href="${esc(ctx.href('events'))}">
    <span class="label">${esc(ctx.t.events.nextUp)}</span>
    <span class="nextbar__date">${p.day} ${esc(p.month)}</span>
    <span class="nextbar__title">${esc(c.title)}</span>
    <span class="muted">${esc(p.weekday)} ${esc(ev.time || '')}${ev.free ? ' · ' + esc(ctx.t.events.free) : ''}</span>
    <span class="btn btn--accent">${esc(ctx.t.events.attend)} →</span>
  </a>`;
}

export function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('');
}

/** Programme cards: one feature card plus the rest. Used on home and /programmes. */
export function programmeCards(ctx, items, { limit } = {}) {
  const list = limit ? items.slice(0, limit) : items;
  const [feature, ...rest] = list;
  const card = (it, i, mist) => {
    const h = resolveHref(ctx, it.href);
    return `<a class="card${mist ? ' card--mist' : ''}" href="${esc(h)}"${linkAttrs(h)}>
      <span class="card__top"><span class="index small">${String(i + 2).padStart(2, '0')}</span><span class="tag tag--small">${inline(it.status)}</span></span>
      <span class="title">${esc(it.title)}</span>
      <span class="card__text">${esc(it.text)}</span>
      <span class="card__cta">${esc(it.cta)} →</span>
    </a>`;
  };
  const fh = resolveHref(ctx, feature.href);
  return `<div class="row">
    <a class="card card--ink feature" href="${esc(fh)}" style="flex: 2 1 520px">
      <span class="card__top"><span class="index small">01 · ${esc(ctx.t.footer.fellowship)}</span><span class="tag tag--status">${inline(feature.status)}</span></span>
      <span class="stack" style="gap: 12px">
        <span class="display-m">${esc(feature.title)}</span>
        <span class="card__text" style="font-size: 18px">${esc(feature.text)}</span>
      </span>
      <span class="card__cta">${esc(feature.cta)} →</span>
    </a>
    ${rest.map((it, i) => card(it, i, i >= 2)).join('\n')}
  </div>`;
}

/** Resolve a menu or path target: mail:Subject, page#anchor, page id, links key or URL. */
export function go(ctx, target) {
  if (target.startsWith('mail:')) return mailto(ctx, target.slice(5));
  const m = target.match(/^([a-z]+)#(.+)$/);
  if (m) return ctx.href(m[1]) + '#' + m[2];
  return resolveHref(ctx, target);
}
