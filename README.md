# Open City Advocates — Astro site

The <https://www.opencityadvocates.org/> site, built with [Astro](https://astro.build)
and served by a Cloudflare Worker. It replaces the Squarespace site and uses
the same setup as the [Youth Justice Project site](https://github.com/Open-City-Advocates/youth-justice-project).

The site was ported to Hugo in July 2026 and moved to Astro in October 2026.
Page addresses match the Squarespace site (`/our-team`, no extension or
trailing slash), so links people have saved keep working. The layout, type
and colors reproduce the Squarespace site as measured on 2026-10-22
(`static/css/main.css` carries the numbers): Cormorant Garamond headings and
nav, Nunito Sans text, Fjalla One post titles, 2.6vw gutters, the two-column
pages, the brown footer with yellow links.

## Project layout

```
open-city-advocates/
├─ astro.config.mjs              # site URL, flat-file output, Markdown settings
├─ content/                      # every page, as Markdown (see below)
├─ src/
│  ├─ layouts/Base.astro         # page skeleton and <head> (title, description, social cards)
│  ├─ components/                # Header (nav), Footer, and the two forms (ContactForm, RequestAccessForm)
│  ├─ pages/index.astro          # the homepage layout
│  ├─ pages/[...slug].astro      # every other page: bios, news, testimony, lists, Our Team
│  ├─ lib/site.ts                # menu, contact details, Neon links, URL helpers
│  ├─ lib/markdown-links.mjs     # external links open in a new tab; images load lazily
│  └─ content.config.ts          # the front matter fields pages may use
├─ static/                       # copied to the site as-is: css, fonts, images, PDFs, _redirects
├─ scripts/check-route-inventory.mjs  # runs after every build (see below)
├─ wrangler.jsonc                # Cloudflare Workers static-assets config
└─ public/                       # BUILD OUTPUT (generated; do not edit or commit)
```

## Setup

Node 22.22 or newer (`.node-version` pins 24 for Cloudflare's build). Then:

```bash
npm install
npm run dev        # live preview at http://localhost:4321
npm run build      # build into ./public, then run the route check
npm run preview    # serve ./public exactly as Cloudflare will (wrangler dev)
```

## Editing pages

Each Markdown file under `content/` is one page. The file's path is its address:

| File | Address |
|---|---|
| `content/_index.md` | `/` (homepage text, plus `mission` and `vision` in the front matter) |
| `content/our-team.md` | `/our-team` (lists the `staff` and `board` bio pages named in its front matter) |
| `content/penelope-spain.md` | `/penelope-spain` (a bio; `role` is the line above the name, `photo` the headshot; staff bios get a contact form, board bios do not) |
| `content/news-updates/_index.md` | `/news-updates` (lists every post in the folder, newest first) |
| `content/news-updates/<name>.md` | `/news-updates/<name>` (a post; needs `date` and `author`; `image` and `summary` fill its card on the News list) |
| `content/policy-advocacy/<name>.md` | `/policy-advocacy/<name>` (testimony; see an existing file for the fields) |
| `content/join-us/<name>.md` | `/join-us/<name>` (a job posting) |

Front matter fields are checked at build time (`src/content.config.ts`): a
misspelled field fails the build instead of being silently ignored.

- `draft: true` keeps a page out of the build.
- `url: "/some/path"` publishes a page at a different address (the two annual
  reports use this to keep their Squarespace addresses).
- A policy archive entry with `href:` links to that address (a PDF, or another
  page) instead of getting its own page.
- Squarespace forms (the Defense Guide's "Request Access" form and the contact
  form on each staff bio) have no server here. They look as they did, but
  submitting opens the visitor's email app with the fields addressed to
  `CONTACT.email` in `src/lib/site.ts`; change the address there.

## Redirects and the route check

`static/_redirects` holds permanent redirects for Squarespace addresses the
site retired. List each old path with and without a trailing slash.

`npm run build` ends with `scripts/check-route-inventory.mjs`. It fails the
build if any address from the Squarespace sitemap (snapshot of 2026-10-22) is
neither a page nor a redirect, if a redirect points at a page that doesn't
exist, or if the sitemap lists a page that wasn't built. If you retire a
page on purpose, add a redirect for it.

## Deploying

Pushes to `main` deploy through Cloudflare Workers Builds. See
[DEPLOY-WORKERS.md](DEPLOY-WORKERS.md) for the dashboard settings and the
cutover from Squarespace.
