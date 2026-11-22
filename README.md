# LAISH website

The website of the Lisbon AI Safety Hub: www.lisbonaisafetyhub.org.
English at `/`, Portuguese at `/pt/`.

It is a static site. A small Node script (no packages) makes the HTML files. Cloudflare Pages hosts them.

## Look at the site

| You want to | Do this |
|---|---|
| See the site without installing anything | Open `preview/index.html` in your browser. |
| Run it on your computer (needs Node 18 or later) | `npm run dev`, then open http://localhost:8788 |
| Make a new preview folder | `npm run preview` |
| Check for broken links and open placeholders | `npm run check` |

## Change the content

All text is in `src/`. You do not need to change code to change text.

| What | File |
|---|---|
| Menu, dropdown menus (`submenu`), footer, newsletter box, links to Discord, Substack and other sites | `src/content/site.json` |
| Audience paths (Home "Find your path" and the Get involved page) | `src/content/pages/paths.json` |
| Text on each page (EN and PT side by side) | `src/content/pages/*.json` |
| Vision, Code of conduct, Privacy (Markdown) | `src/content/docs/*.en.md` and `*.pt.md` |
| Events | `src/data/events.json` |
| Team, advisors, volunteers, partners, numbers, photos | `src/data/people.json` |
| Substack posts on the Writing page | `src/data/posts.json` |
| Resources library | `src/data/resources.json` |
| Images, logo, favicon | `src/static/` |

Rules:

- Each text has an `en` and a `pt` version. Change both.
- Text in `[square brackets]` is a placeholder. `npm run check` lists all of them.
- Events: past events move to "Past events" when the site builds. Each new commit builds the site again.
- Partners show only when `"confirmed": true`. The numbers on the home page show only when all four have a value.
- Photos: put the file in `src/static/photos/` and add it to `photos.items` in `people.json`.

## Put it online (Cloudflare Pages)

1. In Cloudflare, go to **Workers & Pages > Create > Pages > Connect to Git**. Select this repository.
2. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. Add the custom domains `www.lisbonaisafetyhub.org` and `lisbonaisafetyhub.org`. Redirect the root domain to `www`.
4. Each push to `main` publishes the site. Other branches get a preview link.

The build also writes `_headers` (security headers), `_redirects` (old Lovable routes), `sitemap.xml` and `robots.txt`.

## Before launch

- [ ] Run `sh scripts/get-fonts.sh` on a computer with internet access, then commit `src/static/fonts/`. Until then, the site uses a system font.
- [ ] Add the Conthrax wordmark as outlined SVG paths in `src/static/laish-wordmark.svg`. The header uses it when the file is there. Do not use the Conthrax font file on the web: its licence does not allow it.
- [ ] Fill in all placeholders (see `CONTENT-TODO.md` and `npm run check`).
- [ ] A native speaker reads all Portuguese text.
- [ ] Set `"draft": false` in `src/content/site.json`. This removes the yellow bar.
- [ ] Set up email routing for `contact@lisbonaisafetyhub.org` in Cloudflare (free).
- [ ] Optional: turn on Cloudflare Web Analytics (no cookies). Then remove the "[Confirm: ...]" note in the privacy pages.
- [ ] After the domain moves: test the old links `/admin-login` and `/vision`.

## Files

```
build.mjs            makes dist/ from src/
serve.mjs            local server for dist/
scripts/check.mjs    link, language and placeholder checks
scripts/preview.mjs  makes preview/ (opens from disk)
scripts/get-fonts.sh downloads the Archivo font (run once)
src/content/         text
src/data/            lists (events, people, posts, resources)
src/templates/       HTML for each page
src/styles/site.css  styles (LAISH design system, direction B)
src/static/          files copied as they are (logo, icons, fonts, photos)
```
