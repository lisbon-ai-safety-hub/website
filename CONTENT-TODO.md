# Content to get from Caleb

The site is complete, but some text is a placeholder. The site shows a yellow "Draft" bar until `"draft": false` in `src/content/site.json`.

## Needed for launch

| # | What | Where it goes |
|---|---|---|
| 1 | Venue for the 8 Dec screening and the 14 Dec discussion group | `src/data/events.json` (`venue`) |
| 2 | Luma (or other) link for each event, and the calendar link | `events.json` (`url`), `site.json` (`links.calendar`) |
| 3 | Next fellowship round: month, application dates, 2027 plan (still 8 weeks?) | `src/content/pages/fellowship.json`, `programmes.json`, `other.json` |
| 4 | Are sessions always in English? | `fellowship.json` ("know" box) |
| 5 | One quote from a 2026 fellow, with their consent, name and study or job | `fellowship.json` ("reflections") |
| 6 | Launch date for the privacy policy | `src/content/docs/privacy.en.md` and `.pt.md` |
| 7 | Is Cloudflare Web Analytics on or off? | privacy pages |
| 8 | Who receives `contact@lisbonaisafetyhub.org`? | Cloudflare Email Routing |

## From the white paper (June 2026): please confirm

| # | Question | Why it matters |
|---|---|---|
| 9 | Are community events weekly or monthly? | The white paper says weekly. The site says "Something every month" (`events.json`, `programmes.json`). |
| 10 | Is LAISH a member of ENAIS (European Network for AI Safety)? | If yes, we add it to the Network section on Home and About. |
| 11 | Can we name EA Portugal as a supporter? | The white paper names the Portuguese EA community. |
| 12 | Are guest lectures still at ISCTE? | If yes, we show the venue on Events. The Contact page says "no university affiliation": is that still true? |
| 13 | Author of "The AI Risk Most People Aren't Thinking About" (2 Oct) | The Substack page did not load. Add the name and fellow/team in `src/data/posts.json`. |
| 14 | White paper page (`/about/white-paper`) | The page copies the June 2026 text word for word, with a link to the original Google Doc at the end. Some lines are out of date ("Portugal does not have any AI safety project", ENAIS, lectures in the future tense). If Caleb updates the doc, update `src/content/pages/whitepaper.json`. Make sure the Google Doc is shared as "Anyone with the link: Viewer". |

## Makes the site stronger

| # | What | Where it goes |
|---|---|---|
| 15 | 3 to 6 community photos, with consent of the people in them | `src/static/photos/` and `people.json` |
| 16 | Team photos (square, 400 x 400 px) | `src/static/people/` and `people.json` |
| 17 | Four numbers: fellows trained, cohorts, events, community members | `people.json` (`stats`) |
| 18 | Which partners agree to be named (BlueDot, Lens Academy, ISCTE, Nova SBE, Técnico) | `people.json` (`partners`, `confirmed`) |
| 19 | Past events with dates and number of people | `events.json` |
| 20 | Wordmark as outlined SVG (from the logo designer) | `src/static/laish-wordmark.svg` |
| 21 | Legal name and NIF, if LAISH is now a registered association | privacy pages |
| 22 | Native review of all Portuguese text | `pt` fields and `*.pt.md` |

## From the audience paths (20 Nov 2026, see `LAISHweb/07-paths-justification.md`)

| # | What | Where it goes |
|---|---|---|
| 23 | Confirm the 4 volunteer roles (Events, Fellowship, Writing, Outreach) | `src/content/pages/paths.json` (`volunteer`) |
| 24 | Who answers each email topic (Policy, Give a talk, Mentoring, Partnerships, Support, Press, Volunteering, Start a group), and how fast | Team process |
| 25 | Add "Which describes you best?" (the 6 paths) to the fellowship application form | Application form |
