// One function per page. Each returns { title, description, body } for the layout.
import { esc, inline, markdown } from '../lib/html.mjs';
import {
  button, tag, sectionTitle, mosaic, panel, newsletterPanel, subscribeForm, mailto,
  eventRow, nextBar, programmeCards, initials, resolveHref, linkAttrs, dateParts, go, eventEnd, orgLink, venueOf,
} from './components.mjs';

const pad = (n) => String(n).padStart(2, '0');

/** "by Stefan Kujundzic and Bachir Remtula · Fellows, 2026 cohort" (or "LAISH team" when no names). */
function byline(ctx, post) {
  const W = ctx.page('writing');
  const names = (post.authors || []).join(` ${W.and} `);
  const label = post.byline === 'fellows' ? (post.authors.length > 1 ? W.byline.fellows : W.byline.fellow)
    : post.byline === 'team' ? W.byline.team : '';
  if (!names) return label;
  return `${W.by} ${names}${label ? ' · ' + label : ''}`;
}

function hero(ctx, { tagText, title, lede, actions = '', aside = '', top = false, dot = true }) {
  return `<section class="wrap hero${top ? ' hero--top' : ''}">
    <div class="hero__text">
      ${tagText ? tag(tagText, { dot }) : ''}
      <h1 class="display-xl">${inline(title)}</h1>
      ${lede ? `<p class="lede">${inline(lede)}</p>` : ''}
      ${actions}
    </div>
    ${aside ? `<div class="hero__aside">${aside}</div>` : ''}
  </section>`;
}

// Upcoming and past are decided at build time, then again in the browser (see SCRIPT in layout.mjs),
// so an event moves to "Past events" when it ends, even if nobody builds the site again.
function upcoming(ctx) { return ctx.data.events.events.filter((e) => eventEnd(e) > ctx.now).sort((a, b) => eventEnd(a) - eventEnd(b)); }
function allByDateDesc(ctx) { return [...ctx.data.events.events].sort((a, b) => eventEnd(b) - eventEnd(a)); }

function eventList(ctx, events, id, limit = 0) {
  const empty = (show) => `<p class="empty" data-upcoming-empty${show ? '' : ' hidden'}>${esc(ctx.t.events.noUpcoming)}</p>`;
  if (!events.length) return empty(true);
  let n = 0;
  // Group by month.
  const groups = [];
  for (const ev of events) {
    const m = ev.date.slice(0, 7);
    let g = groups.find((x) => x.m === m);
    if (!g) groups.push((g = { m, items: [] }));
    g.items.push(ev);
  }
  return `<div id="${id}" data-upcoming${limit ? ` data-limit="${limit}"` : ''}>
    ${groups.map((g) => `<div data-group>
      <p class="label month">${esc(dateParts(ctx.lang, g.m + '-01').monthLong)}</p>
      ${g.items.map((ev) => eventRow(ctx, ev, limit && ++n > limit)).join('\n')}
    </div>`).join('\n')}
  </div>${empty(false)}`;
}

/** Name, role and a small round photo (advisors, volunteers). */
function personLine(p, text, style = '') {
  const img = p.photo
    ? `<img class="avatar avatar--sm" src="${esc(p.photo)}" alt="" width="56" height="56" loading="lazy">`
    : `<span class="avatar avatar--sm" aria-hidden="true">${esc(initials(p.name))}</span>`;
  return `<div class="list-line person-line"${style ? ` style="${style}"` : ''}>${img}<span class="person-line__text"><span style="font-weight: 700">${esc(p.name)}</span><span class="muted small">${esc(text)}</span></span></div>`;
}

// ------------------------------------------------------------------ Home
export function home(ctx) {
  const c = ctx.page('home');
  const P = ctx.page('programmes');
  const next = upcoming(ctx)[0];
  const stats = ctx.data.people.stats.items;
  const showStats = stats.every((s) => s.value !== null && s.value !== '');
  const partners = [...ctx.data.people.affiliates, ...(ctx.data.people.sponsors || []), ...ctx.data.people.partners].filter((p) => p.confirmed);
  const fellowPosts = ctx.data.posts.posts.filter((p) => p.byline === 'fellows');
  const posts = (fellowPosts.length >= 3 ? fellowPosts : ctx.data.posts.posts).slice(0, 3);
  const W = ctx.page('writing');

  const body = `
${hero(ctx, {
  tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede,
  actions: `<div class="btn-row">${button(ctx, { label: c.hero.primary, href: ctx.href('fellowship') + '#notify', size: 'lg' })}${button(ctx, { label: c.hero.secondary, href: 'discord', variant: 'secondary', size: 'lg' })}</div>`,
  aside: mosaic(),
})}
${next ? `<section class="wrap section--tight-bottom" aria-label="${esc(ctx.t.events.nextUp)}" data-next data-next-empty="hide">${upcoming(ctx).slice(0, 3).map((ev, i) => nextBar(ctx, ev, i > 0)).join('')}</section>` : ''}

${showStats ? `<section class="wrap section section--tight-bottom" aria-label="${esc(c.stats.label)}">
  <div class="stats">${stats.map((s) => `<div class="stat"><span class="stat-value">${esc(s.value)}</span><span class="muted">${esc(s[ctx.lang])}</span></div>`).join('')}</div>
</section>` : ''}

<section class="border-top" aria-labelledby="safety">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.safety.label, title: c.safety.title, id: 'safety' })}
    <div class="row">${c.safety.items.map((it) => `<div class="topline"><p class="label">${esc(it.kicker)}</p><h3 class="title">${esc(it.title)}</h3><p class="muted">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="band-card" aria-labelledby="paths">
  <div class="wrap section stack">
    <div class="section-head">${sectionTitle({ label: ctx.page('paths').home.label, title: ctx.page('paths').home.title, intro: ctx.page('paths').home.intro, id: 'paths' })}<a class="link-arrow" href="${ctx.href('getinvolved')}">${esc(ctx.page('paths').home.all)}</a></div>
    <div class="row">${ctx.page('paths').personas.map((p) => { const a = p.actions[0]; const h = go(ctx, a.href); return `<a class="card path" href="${esc(h)}"${linkAttrs(h)}><span class="title">${esc(p.title)}</span><span class="card__text">${esc(p.short)}</span><span class="card__cta">${esc(a.label)} →</span></a>`; }).join('')}</div>
  </div>
</section>

<section class="band-mist" aria-labelledby="why">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.why.label, title: c.why.title, id: 'why' })}
    <div class="row">${c.why.items.map((it, i) => `<div class="card"><span class="index" style="font-size: 40px; line-height: 1">${pad(i + 1)}</span><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section aria-labelledby="programmes">
  <div class="wrap section stack">
    <div class="section-head">${sectionTitle({ label: c.programmes.label, title: c.programmes.title, id: 'programmes' })}<a class="link-arrow" href="${ctx.href('programmes')}">${esc(c.programmes.all)}</a></div>
    ${programmeCards(ctx, P.items, { limit: 5 })}
  </div>
</section>

<section class="band-card" aria-labelledby="events-title">
  <div class="wrap section stack">
    <div class="section-head">${sectionTitle({ label: c.events.label, title: c.events.title, intro: c.events.note, id: 'events-title' })}<a class="link-arrow" href="${ctx.href('events')}">${esc(ctx.t.events.allEvents)}</a></div>
    ${eventList(ctx, upcoming(ctx).slice(0, 4), 'home-events', 3)}
  </div>
</section>

${ctx.data.people.photos.items.length ? `<section class="wrap section" aria-hidden="false"><div class="row">${ctx.data.people.photos.items.slice(0, 3).map((p) => `<figure class="photo" style="margin:0"><img src="${esc(p.src)}" alt="${esc(p[ctx.lang] || '')}" loading="lazy"></figure>`).join('')}</div></section>` : ''}

<section aria-labelledby="writing-title">
  <div class="wrap section stack">
    <div class="section-head">${sectionTitle({ label: c.writing.label, title: c.writing.title, id: 'writing-title' })}<a class="link-arrow" href="${ctx.href('writing')}">${esc(c.writing.all)}</a></div>
    <div class="row">${posts.map((p) => `<a class="card" href="${esc(p.url)}" rel="noopener"><span class="small muted">${esc(W.kinds[p.kind])} · ${esc(dateParts(ctx.lang, p.date).full)}</span><span class="title">${esc(p.title)}</span>${byline(ctx, p) ? `<span class="small muted">${esc(byline(ctx, p))}</span>` : ''}<span class="card__cta">${esc(ctx.t.onSubstack)} →</span></a>`).join('')}</div>
  </div>
</section>

<section class="wrap section section--tight-bottom" aria-labelledby="advisors">
  <div class="stack" style="gap: 24px">
    <div class="section-head">${sectionTitle({ label: ctx.page('paths').advisors.label, title: ctx.page('paths').advisors.title, id: 'advisors' })}<a class="link-arrow" href="${ctx.href('about')}#team">${esc(ctx.page('paths').advisors.link)}</a></div>
    <div class="row row--narrow" style="gap: 0 32px">${ctx.data.people.advisors.map((a) => personLine(a, a[ctx.lang], 'flex: 1 1 300px')).join('')}</div>
  </div>
</section>

${partners.length ? `<section class="wrap section--tight-bottom" aria-label="${esc(c.network.label)}">
  <div class="names"><p class="label" style="color: var(--muted)">${esc(c.network.label)}</p>${partners.map(orgLink).join('')}</div>
</section>` : ''}

<section class="wrap section">${newsletterPanel(ctx)}</section>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Programmes
export function programmes(ctx) {
  const c = ctx.page('programmes');
  const body = `
${hero(ctx, { tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede })}
<section class="wrap section--tight-bottom" aria-label="${esc(c.hero.tag)}">${programmeCards(ctx, c.items)}</section>
<section class="band-mist" aria-labelledby="ladder">
  <div class="wrap section stack">${sectionTitle({ label: c.ladder.label, title: c.ladder.title, intro: c.ladder.text, id: 'ladder' })}
  <div>${button(ctx, { label: ctx.page('about').docs.items[0].title, href: 'vision', variant: 'secondary' })}</div></div>
</section>
<section class="wrap section">${newsletterPanel(ctx)}</section>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Fellowship
export function fellowship(ctx) {
  const c = ctx.page('fellowship');
  const posts = ctx.data.posts.posts.filter((p) => p.kind === 'reflection').slice().reverse();
  const facts = `<div class="facts"><p class="label" style="padding-bottom: 14px; color: var(--sage)">${esc(c.facts.label)}</p><dl>${c.facts.items.map(([k, v]) => `<div class="facts__row"><dt>${esc(k)}</dt><dd>${inline(v)}</dd></div>`).join('')}</dl></div>`;
  const body = `
${hero(ctx, {
  top: true, tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede,
  actions: `${tag(c.hero.status, { status: true })}<div class="btn-row">${button(ctx, { label: c.hero.primary, href: '#notify', size: 'lg' })}${button(ctx, { label: c.hero.secondary, href: '#reflections', variant: 'secondary', size: 'lg' })}</div>`,
  aside: facts,
})}

<section class="band-mist" aria-labelledby="explore">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.weeks.label, title: c.weeks.title, intro: c.weeks.intro, id: 'explore' })}
    <ol class="row" style="list-style: none; padding: 0; gap: 16px">${c.weeks.items.map((w, i) => `<li class="week${w.guest ? ' week--guest' : ''}"><span class="index">${pad(i + 1)}</span><h3 class="title">${esc(w.title)}</h3><p class="card__text">${esc(w.text)}</p>${w.guest ? `<span class="tag tag--status tag--small">${esc(c.weeks.guest)}</span>` : ''}</li>`).join('')}</ol>
    <p class="small muted">${inline(c.weeks.note)}</p>
  </div>
</section>

<section aria-labelledby="how">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.how.label, title: c.how.title, intro: c.how.intro, id: 'how' })}
    <div class="row">${c.how.items.map((it, i) => `<div class="card"><span class="index small">${pad(i + 1)}</span><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="wrap section--tight-bottom stack" aria-labelledby="audiences" style="gap: 28px">
  ${sectionTitle({ label: c.audiences.label, title: c.audiences.title, id: 'audiences' })}
  <div class="row row--wide">${c.audiences.items.map((it) => `<div class="card card--mist" style="padding: 32px"><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></div>`).join('')}</div>
  <p class="muted small">${esc(c.audiences.outreach)}</p>
</section>
<section class="wrap section--tight-bottom" aria-label="${esc(c.who.label)}">
  <div class="row row--wide">
    <div class="card" style="padding: 36px; gap: 18px"><p class="label">${esc(c.who.label)}</p><h2 class="display-m">${esc(c.who.title)}</h2><ul class="stack" style="gap: 8px">${c.who.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></div>
    <div class="card card--mist" style="padding: 36px; gap: 18px"><p class="label">${esc(c.know.label)}</p><h2 class="display-m">${esc(c.know.title)}</h2><ul class="stack" style="gap: 8px">${c.know.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></div>
  </div>
</section>

<section class="border-top" aria-labelledby="after">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.after.label, title: c.after.title, id: 'after' })}
    <div class="row row--narrow" style="gap: 28px">${c.after.items.map((it) => `<div class="topline"><h3 class="title title--sm">${esc(it.title)}</h3><p class="muted">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section id="reflections" class="band-mist" aria-labelledby="fellows">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.reflections.label, title: c.reflections.title, id: 'fellows' })}
    <div class="row">${posts.map((p) => `<a class="card" href="${esc(p.url)}" rel="noopener"><span class="small muted">${esc(c.reflections.series)} · ${esc(dateParts(ctx.lang, p.date).full)}</span><span class="title">${esc(p.title)}</span>${byline(ctx, p) ? `<span class="small muted">${esc(byline(ctx, p))}</span>` : ''}<span class="card__cta">${esc(ctx.t.onSubstack)} →</span></a>`).join('')}</div>
    <figure class="card" style="margin: 0; padding: 36px">
      <blockquote class="title" style="margin: 0; font-size: 26px">"${inline(c.reflections.quote)}"</blockquote>
      <figcaption class="muted">${inline(c.reflections.quoteBy)}</figcaption>
    </figure>
  </div>
</section>

<section aria-labelledby="faq">
  <div class="wrap section row" style="gap: 48px">
    <div style="flex: 1 1 300px">${sectionTitle({ label: c.faq.label, title: c.faq.title, id: 'faq' })}</div>
    <div class="faq" style="flex: 2 1 560px">${c.faq.items.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${inline(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section id="notify" class="wrap section--tight-bottom">${panel({ label: c.cta.label, title: c.cta.title, text: c.cta.text, right: subscribeForm(ctx, c.cta.button) })}</section>
<div style="height: var(--space-14)"></div>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Events
export function events(ctx) {
  const c = ctx.page('events');
  const up = upcoming(ctx);
  const next = up[0];
  const cats = ctx.t.events.categories;
  const card = (ev, hidden) => {
    const p = dateParts(ctx.lang, ev.date);
    const h = resolveHref(ctx, ev.url);
    return `<a class="next-card" href="${esc(h)}"${linkAttrs(h)} data-next-item data-end="${eventEnd(ev)}"${hidden ? ' hidden' : ''}>
      <span class="label">${esc(ctx.t.events.nextUp)}</span>
      <span style="display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap"><span class="next-card__day">${p.day}</span><span class="next-card__when">${esc(p.month)} · ${esc(p.weekday)} ${esc(ev.time || '')}</span></span>
      <span class="next-card__title">${esc(ev[ctx.lang].title)}</span>
      <span class="next-card__text">${esc(ev[ctx.lang].summary)} ${esc(venueOf(ctx, ev))}</span>
      <span class="btn btn--on-ink" style="align-self: flex-start">${esc(ctx.t.events.attend)} →</span>
    </a>`;
  };
  const nextCard = next ? `<div data-next data-next-empty="hide">${up.slice(0, 3).map((ev, i) => card(ev, i > 0)).join('')}</div>` : '';
  const pastList = allByDateDesc(ctx); // all events; the ones that have not ended yet stay hidden
  const anyPast = pastList.some((ev) => eventEnd(ev) <= ctx.now);
  const body = `
${hero(ctx, {
  tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede,
  actions: `<div class="btn-row">${button(ctx, { label: c.hero.primary, href: 'calendar', size: 'lg' })}${button(ctx, { label: c.hero.secondary, href: 'discord', variant: 'secondary', size: 'lg' })}</div>`,
  aside: nextCard,
})}

<section class="band-card" aria-labelledby="upcoming">
  <div class="wrap section stack" style="gap: 28px">
    <div class="section-head">
      ${sectionTitle({ label: c.upcoming.label, title: c.upcoming.title, id: 'upcoming' })}
      <div class="filters" role="group" aria-label="${esc(c.upcoming.filter)}" data-filter-for="event-list" hidden>
        ${['all', 'screening', 'discussion', 'lecture', 'social'].map((k, i) => `<button class="filter" type="button" data-filter="${k}" aria-pressed="${i === 0}">${esc(cats[k])}</button>`).join('')}
      </div>
    </div>
    ${eventList(ctx, up, 'event-list')}
  </div>
</section>

<section class="band-mist" aria-labelledby="formats">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.formats.label, title: c.formats.title, intro: c.formats.intro, id: 'formats' })}
    <div class="row row--wide">${ctx.data.events.formats.map((f) => `<div class="card"><span class="tag tag--small">${esc(cats[f.category])}</span><h3 class="title">${esc(f[ctx.lang].title)}</h3><p class="card__text">${esc(f[ctx.lang].text)}</p></div>`).join('')}</div>
  </div>
</section>

${pastList.length ? `<section aria-labelledby="past" data-past${anyPast ? '' : ' hidden'}>
  <div class="wrap section stack">
    ${sectionTitle({ label: c.past.label, title: c.past.title, id: 'past' })}
    <div>${pastList.map((ev) => {
      const p = dateParts(ctx.lang, ev.date);
      return `<article class="event" data-end="${eventEnd(ev)}"${eventEnd(ev) > ctx.now ? ' hidden' : ''}><div class="event__date"><span class="event__day">${p.day}</span><span class="event__when">${esc(p.month)} ${ev.date.slice(0, 4)}</span></div><div class="event__body"><h3 class="event__title">${esc(ev[ctx.lang].title)}</h3><p class="event__meta">${esc(ev[ctx.lang].summary || '')}</p></div>${ev.attended ? `<span class="muted small">${esc(ev.attended)} ${esc(c.past.attended)}</span>` : ''}</article>`;
    }).join('')}</div>
  </div>
</section>` : ''}

<section class="wrap section">
  <div class="card" style="flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px; padding: 36px">
    <div class="stack" style="gap: 8px; max-width: 640px"><h2 class="display-m">${esc(c.suggest.title)}</h2><p class="muted">${esc(c.suggest.text)}</p></div>
    ${button(ctx, { label: c.suggest.button, href: mailto(ctx, 'Events') })}
  </div>
</section>

<section class="wrap section--tight-bottom">${newsletterPanel(ctx)}</section>
<div style="height: var(--space-14)"></div>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Resources
export function resources(ctx) {
  const c = ctx.page('resources');
  const R = ctx.data.resources;
  const body = `
${hero(ctx, { tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede })}
<section class="wrap section--tight-bottom" aria-label="${esc(c.filter)}">
  <div class="filters" role="group" aria-label="${esc(c.filter)}" data-filter-for="resource-list" hidden>
    <button class="filter" type="button" data-filter="all" aria-pressed="true">${esc(c.all)} (${R.items.length})</button>
    ${R.categories.map((cat) => `<button class="filter" type="button" data-filter="${esc(cat.id)}" aria-pressed="false">${esc(cat[ctx.lang].title)} (${R.items.filter((i) => i.category === cat.id).length})</button>`).join('')}
  </div>
</section>
<div id="resource-list">
${R.categories.map((cat, ci) => `<section class="${ci % 2 ? 'band-mist' : ''}" data-group aria-labelledby="cat-${esc(cat.id)}">
  <div class="wrap section stack" style="padding-top: 64px; padding-bottom: 64px">
    ${sectionTitle({ label: pad(ci + 1), title: cat[ctx.lang].title, intro: cat[ctx.lang].text, id: 'cat-' + cat.id })}
    <div class="row row--wide">${R.items.filter((i) => i.category === cat.id).map((it) => `<a class="card resource" href="${esc(it.url)}" rel="noopener" data-category="${esc(cat.id)}"><span class="resource__source">${esc(it.source)}</span><span class="title">${esc(it[ctx.lang].title)}</span><span class="card__text">${esc(it[ctx.lang].text)}</span></a>`).join('')}</div>
  </div>
</section>`).join('\n')}
</div>
<section class="wrap section">
  <div class="card" style="flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px; padding: 36px">
    <div class="stack" style="gap: 8px; max-width: 640px"><h2 class="display-m">${esc(c.suggest.title)}</h2><p class="muted">${esc(c.suggest.text)}</p></div>
    ${button(ctx, { label: c.suggest.button, href: mailto(ctx, 'Resource') })}
  </div>
</section>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Writing
export function writing(ctx) {
  const c = ctx.page('writing');
  const A = ctx.page('about');
  const body = `
${hero(ctx, {
  tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede,
  actions: `<div class="btn-row">${button(ctx, { label: c.hero.primary, href: 'substackSubscribe', size: 'lg' })}${button(ctx, { label: c.hero.secondary, href: mailto(ctx, 'Writing'), variant: 'secondary', size: 'lg' })}</div>`,
})}
<section class="band-card" aria-label="${esc(c.hero.tag)}">
  <div class="wrap section">
    ${ctx.data.posts.posts.map((p) => `<a class="post" href="${esc(p.url)}" rel="noopener"><span class="post__date">${esc(dateParts(ctx.lang, p.date).full)}</span><span class="post__body"><span class="title">${esc(p.title)}</span><span class="post__kind">${esc(c.kinds[p.kind])}${byline(ctx, p) ? ` · ${esc(byline(ctx, p))}` : ''}</span></span></a>`).join('')}
    <p style="padding-top: 24px"><a class="link-arrow" href="${esc(ctx.site.links.substack)}/archive" rel="noopener">${esc(ctx.t.onSubstack)}</a></p>
  </div>
</section>
<section aria-labelledby="docs">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.docs.label, title: c.docs.title, id: 'docs' })}
    <div>${A.docs.items.slice(0, 2).map((d, i) => { const h = resolveHref(ctx, d.href); return `<a class="doc" href="${esc(h)}"${linkAttrs(h)}><span class="index">${pad(i + 1)}</span><span class="title doc__title">${esc(d.title)}</span><span class="doc__text">${esc(d.text)}</span><span aria-hidden="true" class="index">→</span></a>`; }).join('')}</div>
  </div>
</section>
<section class="wrap section--tight-bottom">${newsletterPanel(ctx)}</section>
<div style="height: var(--space-14)"></div>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ About
export function about(ctx) {
  const c = ctx.page('about');
  const P = ctx.data.people;
  const avatar = (m) => m.photo ? `<img class="avatar" src="${esc(m.photo)}" alt="" width="96" height="96" loading="lazy">` : `<span class="avatar" aria-hidden="true">${esc(initials(m.name))}</span>`;
  const confirmedPartners = P.partners.filter((p) => p.confirmed);
  const confirmedSponsors = (P.sponsors || []).filter((p) => p.confirmed);
  const body = `
${hero(ctx, {
  tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede,
  actions: `<div class="btn-row">${button(ctx, { label: c.hero.primary, href: '#team', size: 'lg' })}${button(ctx, { label: c.hero.secondary, href: 'vision', variant: 'secondary', size: 'lg' })}</div>`,
  aside: P.photos.items[0] ? `<figure class="photo" style="margin: 0; min-height: 420px"><img src="${esc(P.photos.items[0].src)}" alt="${esc(P.photos.items[0][ctx.lang] || '')}"></figure>` : mosaic(),
})}

<section class="band-mist" aria-labelledby="mission">
  <div class="wrap section row" style="gap: 56px">
    <div class="stack" style="flex: 1 1 480px; gap: 18px">
      <p class="label">${esc(c.mission.label)}</p>
      <h2 class="display-l" id="mission">${esc(c.mission.title)}</h2>
      ${c.mission.paras.map((p) => `<p class="muted">${inline(p)}</p>`).join('')}
    </div>
    <div style="flex: 1 1 420px">
      <p class="label" style="padding-bottom: 10px">${esc(c.mission.whyLabel)}</p>
      ${c.mission.why.map((w, i) => `<div class="numbered"><span class="index">${pad(i + 1)}</span><div><h3 class="title title--sm">${esc(w.title)}</h3><p class="muted">${esc(w.text)}</p></div></div>`).join('')}
    </div>
  </div>
</section>

<section aria-labelledby="change">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.change.label, title: c.change.title, id: 'change' })}
    <ol class="row row--narrow" style="list-style: none; padding: 0">${c.change.items.map((it, i) => `<li class="card"><span class="index" style="font-size: 32px; line-height: 1">${i + 1}</span><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></li>`).join('')}</ol>
  </div>
</section>

<section aria-labelledby="pipeline">
  <div class="wrap section stack" style="padding-top: 0">
    ${sectionTitle({ label: c.pipeline.label, title: c.pipeline.title, intro: c.pipeline.intro, id: 'pipeline' })}
    <ol class="pipeline" style="list-style: none; padding: 0">${c.pipeline.levels.map(([t, d], i) => `<li class="level${i <= 2 ? ' level--focus' : ''}" style="min-height: ${150 + i * 14}px"><span class="index">${i}</span><span style="font-weight: 700">${esc(t)}</span><span class="muted small">${esc(d)}</span>${i <= 2 ? `<span class="visually-hidden">(${esc(c.pipeline.focus)})</span>` : ''}</li>`).join('')}</ol>
  </div>
</section>

<section class="border-top" aria-labelledby="do">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.do.label, title: c.do.title, id: 'do' })}
    <div class="row" style="gap: 0 32px">${c.do.items.map((it) => `<div class="topline" style="padding-bottom: 20px"><h3 class="title title--sm">${esc(it.title)}</h3><p class="muted">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section id="team" class="band-card" aria-labelledby="team-title">
  <div class="wrap section stack" style="gap: 48px">
    ${sectionTitle({ label: c.team.label, title: c.team.title, id: 'team-title' })}
    <div class="row row--narrow" style="gap: 32px">${P.team.map((m) => `<div class="person">${avatar(m)}<h3 class="title title--sm">${m.linkedin ? `<a href="${esc(m.linkedin)}" rel="noopener" style="color: inherit">${esc(m.name)}</a>` : esc(m.name)}</h3><span class="person__role">${esc(m[ctx.lang].role)}</span><p class="muted small">${esc(m[ctx.lang].text)}</p></div>`).join('')}</div>
    <div class="row" style="gap: 48px">
      <div style="flex: 2 1 560px"><h3 class="label" style="padding-bottom: 8px">${esc(c.team.advisors)}</h3><div class="row" style="gap: 0 32px">${P.advisors.map((a) => personLine(a, a[ctx.lang], 'flex: 1 1 320px')).join('')}</div></div>
      <div style="flex: 1 1 280px"><h3 class="label" style="padding-bottom: 8px">${esc(c.team.volunteers)}</h3>${P.volunteers.map((v) => personLine(v, v[ctx.lang])).join('')}</div>
    </div>
  </div>
</section>

<section aria-labelledby="network">
  <div class="wrap section row" style="gap: 48px">
    <div class="stack" style="flex: 1 1 360px; gap: 14px"><p class="label">${esc(c.network.label)}</p><h2 class="display-m" id="network">${esc(c.network.title)}</h2><p class="muted">${esc(c.network.text)}</p></div>
    <div class="stack" style="flex: 2 1 560px; gap: 18px">
      <div class="names"><span class="muted small" style="width: 120px; font-weight: 600">${esc(c.network.affiliates)}</span>${P.affiliates.filter((a) => a.confirmed).map(orgLink).join('')}</div>
      ${confirmedPartners.length ? `<div class="names" style="padding-top: 18px; border-top: 1px solid var(--line)"><span class="muted small" style="width: 120px; font-weight: 600">${esc(c.network.partners)}</span>${confirmedPartners.map(orgLink).join('')}</div>` : ''}
      ${confirmedSponsors.length ? `<div class="names" style="padding-top: 18px; border-top: 1px solid var(--line)"><span class="muted small" style="width: 120px; font-weight: 600">${esc(c.network.sponsors)}</span>${confirmedSponsors.map(orgLink).join('')}</div>` : ''}
    </div>
  </div>
</section>

<section class="band-mist" aria-labelledby="next">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.next.label, title: c.next.title, id: 'next' })}
    <div class="row row--narrow">${c.next.items.map((it) => `<div class="card"><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section aria-labelledby="docs">
  <div class="wrap section row" style="gap: 48px">
    <div style="flex: 1 1 300px">${sectionTitle({ label: c.docs.label, title: c.docs.title, id: 'docs' })}</div>
    <div style="flex: 2 1 560px">${c.docs.items.map((d, i) => { const h = resolveHref(ctx, d.href); return `<a class="doc" href="${esc(h)}"${linkAttrs(h)}><span class="index">${pad(i + 1)}</span><span class="title doc__title">${esc(d.title)}</span><span class="doc__text">${esc(d.text)}</span><span aria-hidden="true" class="index">→</span></a>`; }).join('')}</div>
  </div>
</section>

<section class="wrap section--tight-bottom">${panel({ label: c.cta.label, title: c.cta.title, text: c.cta.text, right: `<a class="btn btn--on-ink btn--lg" href="${ctx.href('contact')}">${esc(c.cta.button)}</a>` })}</section>
<div style="height: var(--space-14)"></div>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Contact
export function contact(ctx) {
  const c = ctx.page('contact');
  const L = ctx.site.links;
  const body = `
${hero(ctx, { tagText: c.hero.tag, title: c.hero.title, lede: c.hero.lede })}
<section class="wrap section--tight-bottom" aria-labelledby="topics">
  <div class="stack" style="gap: 24px">
    <div class="section-title"><h2 class="label" id="topics">${esc(c.topicsLabel)}</h2><p class="muted small">${esc(c.topicsHint)}</p></div>
    <div class="row">${c.topics.map((tp) => `<a class="card topic" href="${esc(mailto(ctx, tp.subject))}"><span class="title">${esc(tp.title)}</span><span class="card__text">${esc(tp.text)}</span><span class="card__cta">${esc(ctx.site.email)} →</span></a>`).join('')}</div>
    <div class="copybox">
      <span class="muted small">${esc(c.direct)}</span>
      <a class="copybox__email" href="mailto:${esc(ctx.site.email)}">${esc(ctx.site.email)}</a>
      <button class="btn btn--secondary" type="button" data-copy="${esc(ctx.site.email)}" data-copied="${esc(ctx.t.copied)}" hidden>${esc(ctx.t.copy)}</button>
    </div>
    <div class="names" style="padding-top: 8px"><span class="muted small" style="font-weight: 600">${esc(c.social)}</span>
      <a href="${esc(L.discord)}" rel="noopener">Discord</a><a href="${esc(L.instagram)}" rel="noopener">Instagram</a><a href="${esc(L.linkedin)}" rel="noopener">LinkedIn</a><a href="${esc(L.substack)}" rel="noopener">Substack</a>
    </div>
    <p class="muted small">${esc(c.independent)}</p>
  </div>
</section>
<section class="border-top" aria-labelledby="faq">
  <div class="wrap section row" style="gap: 48px">
    <div style="flex: 1 1 300px">${sectionTitle({ label: c.faq.label, title: c.faq.title, id: 'faq' })}</div>
    <div class="faq" style="flex: 2 1 560px">${c.faq.items.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${inline(a)}</p></details>`).join('')}</div>
  </div>
</section>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Long text pages
function docPage(ctx, { label, title, md, extra = '' }) {
  return `
<section class="wrap hero" style="padding-bottom: 24px">
  <div class="hero__text"><p class="label">${esc(label)}</p><h1 class="display-xl">${esc(title)}</h1></div>
</section>
<section class="wrap" style="padding-bottom: 96px">
  <div class="prose">${markdown(md)}</div>
  ${extra}
</section>`;
}

export function vision(ctx) {
  const L = ctx.page('legal');
  return { title: `${L.visionTitle} · LAISH`, description: ctx.page('about').docs.items[0].text, body: docPage(ctx, { label: L.visionLabel, title: L.visionTitle, md: ctx.doc('vision') }) };
}

export function conduct(ctx) {
  const L = ctx.page('legal');
  const extra = `<div class="copybox" style="max-width: 760px; margin-top: 24px"><span class="title" style="flex: 1 1 260px">${esc(L.report)}</span>${button(ctx, { label: L.reportButton, href: mailto(ctx, 'Code of conduct') })}</div>`;
  return { title: `${L.conductTitle} · LAISH`, description: ctx.page('about').docs.items[2].text, body: docPage(ctx, { label: L.conductLabel, title: L.conductTitle, md: ctx.doc('code-of-conduct'), extra }) };
}

export function privacy(ctx) {
  const L = ctx.page('legal');
  return { title: `${L.privacyTitle} · LAISH`, description: L.privacyTitle, body: docPage(ctx, { label: L.privacyLabel, title: L.privacyTitle, md: ctx.doc('privacy') }) };
}

export function notFound(ctx) {
  const c = ctx.page('notfound');
  const body = `<section class="wrap hero">
    <div class="hero__text"><p class="label">404</p><h1 class="display-xl">${esc(c.heading)}</h1><p class="lede">${esc(c.text)}</p>
    <div class="btn-row">${button(ctx, { label: c.home, href: ctx.href('home'), size: 'lg' })}</div></div>
    <div class="hero__aside">${mosaic()}</div>
  </section>`;
  return { title: c.title, description: c.text, body };
}

// ------------------------------------------------------------------ White paper
export function whitepaper(ctx) {
  const c = ctx.page('whitepaper');
  const S = [
    ['overview', c.overview.title], ['significance', c.significance.title], ['strategy', c.strategy.title],
    ['target', c.target.title], ['theory', c.theory.title], ['involved', c.involved.title],
  ];
  const facts = `<div class="facts"><p class="label" style="padding-bottom: 14px; color: var(--sage)">${esc(c.facts.label)}</p><dl>${c.facts.items.map(([k, v]) => `<div class="facts__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`;
  const head = (id, i) => `<p class="label">${pad(i + 1)}</p><h2 class="display-l" id="${id}">${esc(S[i][1])}</h2>`;
  const paras = (list) => list.map((p) => `<p>${inline(p)}</p>`).join('');
  const original = resolveHref(ctx, 'whitePaper');
  const body = `
${hero(ctx, { top: true, tagText: c.tag, title: c.heading, lede: '', aside: facts,
  actions: `<nav class="toc" aria-label="${esc(c.toc)}"><p class="label" style="color: var(--muted); width: 100%">${esc(c.toc)}</p>${S.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>` })}

<section class="band-card" aria-labelledby="overview">
  <div class="wrap section stack" style="gap: 20px">${head('overview', 0)}<div class="wp-lede">${paras(c.overview.paras)}</div></div>
</section>

<section aria-labelledby="significance">
  <div class="wrap section stack" style="gap: 20px">${head('significance', 1)}<div class="wp-prose">${paras(c.significance.paras)}</div></div>
</section>

<section class="band-mist" aria-labelledby="strategy">
  <div class="wrap section stack" style="gap: 28px">${head('strategy', 2)}
    <div class="row row--wide">${c.strategy.items.map((it) => `<div class="card" style="padding: 32px"><h3 class="title">${esc(it.title)}</h3><p class="card__text">${esc(it.text)}</p></div>`).join('')}</div>
  </div>
</section>

<section aria-labelledby="target">
  <div class="wrap section stack" style="gap: 20px">${head('target', 3)}<div class="wp-prose">${paras(c.target.paras)}</div></div>
</section>

<section class="border-top" aria-labelledby="theory">
  <div class="wrap section stack" style="gap: 28px">${head('theory', 4)}
    <ol class="row row--narrow" style="list-style: none; padding: 0">${c.theory.steps.map((s, i) => `<li class="card${i === 3 ? ' card--ink' : ''}"><span class="index" style="font-size: 32px; line-height: 1">${i + 1}</span><p class="${i === 3 ? '' : 'card__text'}" style="font-size: 17px">${esc(s)}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="wrap section--tight-bottom" aria-labelledby="involved">
  <div class="panel" style="align-items: center">
    <div class="panel__text"><p class="label">${pad(6)}</p><h2 class="display-l" id="involved">${esc(c.involved.title)}</h2>${paras(c.involved.paras)}</div>
    <div class="btn-row" style="flex: 0 1 auto">
      <a class="btn btn--on-ink" href="${ctx.href('fellowship')}">${esc(c.involved.buttons.fellowship)}</a>
      <a class="btn btn--outline" style="color: var(--on-ink); border-color: var(--on-ink)" href="${esc(ctx.site.links.substackSubscribe)}" rel="noopener">${esc(c.involved.buttons.newsletter)}</a>
      <a class="btn btn--outline" style="color: var(--on-ink); border-color: var(--on-ink)" href="${esc(mailto(ctx, 'Getting involved'))}">${esc(c.involved.buttons.contact)}</a>
    </div>
  </div>
</section>

<section class="wrap section" aria-label="${esc(c.original.title)}">
  <a class="doc" href="${esc(original)}"${linkAttrs(original)}>
    <span class="label" style="width: 80px">${esc(c.original.label)}</span>
    <span class="title doc__title">${esc(c.original.title)}</span>
    <span class="doc__text">${esc(c.original.text)}</span>
    <span aria-hidden="true" class="index">↗</span>
  </a>
</section>
`;
  return { title: c.title, description: c.description, body };
}

// ------------------------------------------------------------------ Get involved
export function getInvolved(ctx) {
  const c = ctx.page('paths');
  const action = (a, i) => {
    const h = go(ctx, a.href);
    return `<a class="path-action${i === 0 ? ' path-action--main' : ''}" href="${esc(h)}"${linkAttrs(h)}>${esc(a.label)}<span aria-hidden="true">→</span></a>`;
  };
  const body = `
${hero(ctx, { tagText: c.page.tag, title: c.page.heading, lede: c.page.lede,
  actions: `<nav class="toc" aria-label="${esc(c.page.toc)}">${c.personas.map((p) => `<a href="#${p.id}">${esc(p.title)}</a>`).join('')}</nav>`,
  aside: mosaic() })}

${c.personas.map((p, i) => `<section class="${i % 2 ? 'band-mist' : 'band-card'}" aria-labelledby="${p.id}">
  <div class="wrap section row" style="gap: 32px 56px; padding-top: 64px; padding-bottom: 64px">
    <div class="stack" style="flex: 1 1 420px; gap: 14px">
      <p class="label">${pad(i + 1)}</p>
      <h2 class="display-m" id="${p.id}">${esc(p.title)}</h2>
      <p class="muted" style="font-size: 18px; max-width: 560px">${esc(p.text)}</p>
    </div>
    <div class="path-actions" style="flex: 1 1 380px">${p.actions.map(action).join('')}</div>
  </div>
</section>`).join('\n')}

<section aria-labelledby="volunteer">
  <div class="wrap section stack">
    ${sectionTitle({ label: c.volunteer.label, title: c.volunteer.title, intro: c.volunteer.text, id: 'volunteer' })}
    <div class="row row--narrow">${c.volunteer.roles.map((r) => `<div class="card"><h3 class="title">${esc(r.title)}</h3><p class="card__text">${esc(r.text)}</p></div>`).join('')}</div>
    <p class="small muted">${inline(c.volunteer.note)}</p>
    <div>${button(ctx, { label: c.volunteer.button, href: mailto(ctx, 'Volunteering') })}</div>
  </div>
</section>

<section class="wrap section--tight-bottom" aria-labelledby="elsewhere">
  ${panel({ label: 'Portugal', title: c.elsewhere.title, text: c.elsewhere.text, right: `<div class="btn-row"><a class="btn btn--on-ink" href="${esc(ctx.site.links.discord)}" rel="noopener">${esc(c.elsewhere.discord)}</a><a class="btn btn--outline" style="color: var(--on-ink); border-color: var(--on-ink)" href="${esc(mailto(ctx, 'Start a group'))}">${esc(c.elsewhere.group)}</a></div>` }).replace('<h2 class="display-l">', '<h2 class="display-l" id="elsewhere">')}
</section>

<section class="wrap section">
  <p class="title" style="text-align: center">${esc(c.questions.text)} <a href="${ctx.href('contact')}">${esc(c.questions.link)} →</a></p>
</section>
`;
  return { title: c.page.title, description: c.page.description, body };
}
